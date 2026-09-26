import "server-only";
import { runAnalysis, type AnalysisOutcome } from "@/lib/ai";
import { getRepository } from "@/lib/db";
import { getConfig } from "@/lib/env";
import { ApiError } from "@/lib/http";
import { createLeadReference } from "@/lib/ids";
import { sendToN8n, type DeliveryResult, type N8nTarget, type OutboundEventType } from "@/lib/n8n";
import { estimateProject } from "@/lib/pricing/estimate";
import { sanitizeOverrides } from "@/lib/pricing/overrides";
import { buildProposalDraft, isProposalExpired, isShareable } from "@/lib/proposals";
import { publishEvent } from "@/lib/realtime/bus";
import type { ScopeAnalysis } from "@/lib/schemas/analysis";
import type { LeadSubmission } from "@/lib/schemas/lead";
import type {
  AnalysisProvider,
  AnalysisRecord,
  AnalysisRunner,
  EventType,
  Lead,
  LeadEvent,
  LeadStatus,
  Proposal,
} from "@/lib/types";
import { pipelinePayload } from "./payloads";

/**
 * The onboarding pipeline — a small state machine around each lead:
 *
 *   new ──► analyzing ──► review ──► approved ──► sent ──► won / lost
 *            (AI via n8n or in-app)   (human)      (n8n dispatch)  (client portal)
 *
 * Route handlers call these functions and schedule the slow parts with
 * `after()`. Every transition is recorded in the event log, which powers the
 * dashboard activity feed and its live stream.
 */

/** Business-rule violation; extends ApiError so route handlers map it to an HTTP status. */
export class PipelineError extends ApiError {
  constructor(message: string, status = 409, code = "invalid_state") {
    super(status, code, message);
    this.name = "PipelineError";
  }
}

/* ----------------------------------------------------------------------------
 * Events
 * ------------------------------------------------------------------------- */

export async function recordEvent(input: {
  type: EventType;
  leadId?: string | null;
  proposalId?: string | null;
  actor: string;
  data?: Record<string, unknown>;
}): Promise<LeadEvent> {
  const event = await getRepository().addEvent({
    type: input.type,
    leadId: input.leadId ?? null,
    proposalId: input.proposalId ?? null,
    actor: input.actor,
    data: input.data ?? {},
  });
  publishEvent(event);
  return event;
}

/** Deliver to n8n and log failures to the event log (never throws). */
async function deliver(
  target: N8nTarget,
  type: OutboundEventType,
  lead: Lead,
  proposal: Proposal | null,
  extra: Record<string, unknown> = {},
): Promise<DeliveryResult> {
  const result = await sendToN8n(target, type, pipelinePayload(lead, proposal, extra));
  if (!result.ok && !result.skipped) {
    await recordEvent({
      type: "webhook.failed",
      leadId: lead.id,
      proposalId: proposal?.id ?? null,
      actor: "system",
      data: { target, event: type, status: result.status ?? null, error: result.error ?? null, attempts: result.attempts },
    }).catch((error) => console.error("[pipeline] could not record webhook failure", error));
  }
  return result;
}

/** Fan lifecycle changes out to the n8n CRM Sync workflow (Airtable / Notion / Supabase). */
export async function syncCrm(lead: Lead, trigger: EventType, proposal: Proposal | null = null) {
  if (!getConfig().n8n.crmSyncEnabled) return;
  await deliver("crmSync", "crm.sync", lead, proposal, { trigger });
}

/* ----------------------------------------------------------------------------
 * Intake
 * ------------------------------------------------------------------------- */

export async function createLeadFromSubmission(
  submission: LeadSubmission,
  context: { ipHash: string | null; userAgent: string | null; actor: string },
): Promise<Lead> {
  const repo = getRepository();
  const { project, plan, contact, meta } = submission;
  const overrides = sanitizeOverrides(await repo.getPricingOverrides());
  const estimate = estimateProject(
    {
      services: project.services,
      features: project.features,
      scale: project.scale,
      timeline: plan.timeline,
      languages: project.languages,
    },
    overrides,
  );
  const { consent, marketingOptIn, ...contactFields } = contact;

  let lead: Lead | null = null;
  for (let attempt = 0; attempt < 5 && !lead; attempt++) {
    try {
      lead = await repo.createLead({
        reference: createLeadReference(),
        status: "new",
        source: meta.source,
        contact: contactFields,
        project,
        plan,
        estimate,
        meta: {
          ...meta,
          ipHash: context.ipHash,
          userAgent: context.userAgent?.slice(0, 300) ?? null,
          consent: { privacy: consent, marketing: marketingOptIn, at: new Date().toISOString() },
        },
      });
    } catch (error) {
      // Retry only on reference collisions (unique constraint).
      if (!/duplicate|23505|unique/i.test((error as Error).message)) throw error;
    }
  }
  if (!lead) throw new Error("Could not allocate a unique lead reference");

  await recordEvent({
    type: "lead.created",
    leadId: lead.id,
    actor: context.actor,
    data: { reference: lead.reference, source: lead.source, services: project.services, budget: plan.budget },
  });
  return lead;
}

/**
 * Post-submission work (run inside `after()`): notify the n8n intake workflow,
 * request the AI analysis and push the new lead to the CRM.
 */
export async function processNewLead(leadId: string): Promise<void> {
  const lead = await getRepository().getLead(leadId);
  if (!lead) return;
  await Promise.all([
    deliver("leadIntake", "lead.created", lead, null),
    requestAnalysis(lead, { trigger: "intake", actor: "system" }),
    syncCrm(lead, "lead.created"),
  ]);
}

/* ----------------------------------------------------------------------------
 * Analysis
 * ------------------------------------------------------------------------- */

export async function setLeadStatus(lead: Lead, status: LeadStatus, actor: string, extra: Record<string, unknown> = {}) {
  if (lead.status === status) return lead;
  const updated = await getRepository().updateLead(lead.id, { status });
  await recordEvent({ type: "lead.status_changed", leadId: lead.id, actor, data: { from: lead.status, to: status, ...extra } });
  return updated;
}

/**
 * Ask for a (re)analysis. With the n8n runner the request goes to the
 * "AI Scope Analysis" workflow, which posts its result to POST /api/v1/proposals;
 * otherwise (or if n8n is unreachable) the analysis runs in-process.
 */
export async function requestAnalysis(
  lead: Lead,
  options: { trigger: "intake" | "regenerate"; actor: string; instructions?: string | null },
): Promise<{ runner: AnalysisRunner }> {
  const config = getConfig();
  const repo = getRepository();
  const [previous] = options.trigger === "regenerate" ? await repo.listAnalyses(lead.id) : [];
  const previousSummary = previous
    ? {
        recommended: previous.result.budget.recommended,
        totalWeeks: previous.result.timeline.totalWeeks,
        projectType: previous.result.projectType,
      }
    : null;

  const analyzing = await repo.updateLead(lead.id, { status: "analyzing", analysisError: null });
  if (lead.status !== "analyzing") {
    await recordEvent({ type: "lead.status_changed", leadId: lead.id, actor: options.actor, data: { from: lead.status, to: "analyzing" } });
  }

  if (config.analysisRunner === "n8n" && config.n8n.urls.analysis) {
    const result = await deliver("analysis", "analysis.requested", analyzing, null, {
      trigger: options.trigger,
      instructions: options.instructions ?? null,
      previous: previousSummary,
    });
    if (result.ok) {
      await recordEvent({
        type: "analysis.requested",
        leadId: lead.id,
        actor: options.actor,
        data: { runner: "n8n", trigger: options.trigger, instructions: options.instructions ?? null },
      });
      return { runner: "n8n" };
    }
    console.warn(`[pipeline] n8n analysis request failed for ${lead.reference}; running in-app instead`);
  }

  await recordEvent({
    type: "analysis.requested",
    leadId: lead.id,
    actor: options.actor,
    data: { runner: "app", provider: config.ai.provider, trigger: options.trigger, instructions: options.instructions ?? null },
  });
  await runAppAnalysis(analyzing, { instructions: options.instructions ?? null, previous: previousSummary });
  return { runner: "app" };
}

export async function runAppAnalysis(
  lead: Lead,
  options: { instructions?: string | null; previous?: { recommended: number; totalWeeks: number; projectType: string } | null } = {},
): Promise<{ analysis: AnalysisRecord; proposal: Proposal } | null> {
  let outcome: AnalysisOutcome;
  try {
    outcome = await runAnalysis(lead, options);
  } catch (error) {
    await failAnalysis(lead, (error as Error).message, "system");
    return null;
  }
  const result = await applyAnalysisResult({
    lead,
    analysis: outcome.analysis,
    provider: outcome.provider,
    model: outcome.model,
    usage: outcome.usage,
    runner: "app",
    instructions: options.instructions ?? null,
    fallbackReason: outcome.fallbackReason,
    durationMs: outcome.durationMs,
    actor: "system",
  });
  // In n8n-runner mode the analysis workflow sends the "draft ready" alert itself.
  await deliver("dispatch", "proposal.created", result.lead, result.proposal);
  return result;
}

export async function failAnalysis(lead: Lead, message: string, actor: string) {
  const repo = getRepository();
  await repo.updateLead(lead.id, { analysisError: message.slice(0, 500), status: lead.status === "analyzing" ? "new" : lead.status });
  await recordEvent({ type: "analysis.failed", leadId: lead.id, actor, data: { error: message.slice(0, 500) } });
}

/** Persist an analysis, derive the proposal draft and move the lead to review. */
export async function applyAnalysisResult(params: {
  lead: Lead;
  analysis: ScopeAnalysis;
  provider: AnalysisProvider;
  model: string | null;
  usage: Record<string, unknown> | null;
  runner: AnalysisRunner;
  instructions: string | null;
  fallbackReason: string | null;
  durationMs: number | null;
  actor: string;
  /** Set to false to skip the CRM webhook (demo data). */
  syncCrm?: boolean;
}): Promise<{ analysis: AnalysisRecord; proposal: Proposal; lead: Lead }> {
  const repo = getRepository();
  const { lead } = params;

  const analysis = await repo.createAnalysis({
    leadId: lead.id,
    provider: params.provider,
    model: params.model,
    runner: params.runner,
    result: params.analysis,
    usage: params.usage,
    instructions: params.instructions,
    fallbackReason: params.fallbackReason,
    durationMs: params.durationMs,
  });

  const version = await repo.nextProposalVersion(lead.id);
  const proposal = await repo.createProposal(
    buildProposalDraft({ leadId: lead.id, analysisId: analysis.id, analysis: params.analysis, version }),
  );
  await repo.supersedeOpenProposals(lead.id, proposal.id);

  const updated = await repo.updateLead(lead.id, {
    status: "review",
    fitScore: params.analysis.fitScore,
    estimatedValue: proposal.totals.total,
    analysisError: null,
  });

  await recordEvent({
    type: "analysis.completed",
    leadId: lead.id,
    actor: params.actor,
    data: {
      analysisId: analysis.id,
      version: analysis.version,
      provider: params.provider,
      model: params.model,
      runner: params.runner,
      fitScore: params.analysis.fitScore,
      recommended: params.analysis.budget.recommended,
      fallbackReason: params.fallbackReason,
    },
  });
  await recordEvent({
    type: "proposal.created",
    leadId: lead.id,
    proposalId: proposal.id,
    actor: params.actor,
    data: { version: proposal.version, total: proposal.totals.total, currency: proposal.currency },
  });
  if (lead.status !== "review") {
    await recordEvent({ type: "lead.status_changed", leadId: lead.id, actor: params.actor, data: { from: "analyzing", to: "review" } });
  }

  if (params.syncCrm !== false) await syncCrm(updated, "proposal.created", proposal);
  return { analysis, proposal, lead: updated };
}

/* ----------------------------------------------------------------------------
 * Review, approval & dispatch
 * ------------------------------------------------------------------------- */

export async function approveProposal(
  proposalId: string,
  actor: string,
): Promise<{ proposal: Proposal; lead: Lead; dispatch: DeliveryResult }> {
  const repo = getRepository();
  const proposal = await repo.getProposal(proposalId);
  if (!proposal) throw new PipelineError("Proposal not found", 404, "not_found");
  if (proposal.status !== "draft" && proposal.status !== "approved") {
    throw new PipelineError(`A ${proposal.status} proposal cannot be approved`);
  }
  if (proposal.totals.total <= 0 && proposal.totals.monthlyTotal <= 0) {
    throw new PipelineError("Add at least one priced line item before approving", 422, "empty_proposal");
  }
  const lead = await repo.getLead(proposal.leadId);
  if (!lead) throw new PipelineError("Lead not found", 404, "not_found");

  const approved = await repo.updateProposal(proposal.id, {
    status: "approved",
    approvedAt: new Date().toISOString(),
    approvedBy: actor,
  });
  // A newly approved version replaces any older version the client may still have open.
  await repo.supersedeOpenProposals(lead.id, approved.id, ["draft", "approved", "sent"]);
  const updatedLead = await repo.updateLead(lead.id, { status: "approved", estimatedValue: approved.totals.total });

  await recordEvent({
    type: "proposal.approved",
    leadId: lead.id,
    proposalId: approved.id,
    actor,
    data: { version: approved.version, total: approved.totals.total },
  });
  if (lead.status !== "approved") {
    await recordEvent({ type: "lead.status_changed", leadId: lead.id, actor, data: { from: lead.status, to: "approved" } });
  }

  const dispatch = await deliver("dispatch", "proposal.approved", updatedLead, approved);
  await syncCrm(updatedLead, "proposal.approved", approved);
  return { proposal: approved, lead: updatedLead, dispatch };
}

export async function markProposalSent(proposalId: string, actor: string, data: Record<string, unknown> = {}) {
  const repo = getRepository();
  const proposal = await repo.getProposal(proposalId);
  if (!proposal) throw new PipelineError("Proposal not found", 404, "not_found");
  if (!["approved", "sent"].includes(proposal.status)) {
    throw new PipelineError(`A ${proposal.status} proposal cannot be marked as sent`);
  }
  const sent = await repo.updateProposal(proposal.id, { status: "sent", sentAt: proposal.sentAt ?? new Date().toISOString() });
  let lead = await repo.getLead(proposal.leadId);
  if (!lead) throw new PipelineError("Lead not found", 404, "not_found");
  if (proposal.status !== "sent") {
    await recordEvent({ type: "proposal.sent", leadId: lead.id, proposalId: sent.id, actor, data });
  }
  if (["new", "analyzing", "review", "approved"].includes(lead.status)) {
    lead = await setLeadStatus(lead, "sent", actor);
  }
  await syncCrm(lead, "proposal.sent", sent);
  return { proposal: sent, lead };
}

/* ----------------------------------------------------------------------------
 * Client portal
 * ------------------------------------------------------------------------- */

const VIEW_THROTTLE_MS = 60 * 60 * 1000;

export async function recordProposalView(proposal: Proposal) {
  if (proposal.viewedAt && Date.now() - new Date(proposal.viewedAt).getTime() < VIEW_THROTTLE_MS) return;
  const repo = getRepository();
  await repo.updateProposal(proposal.id, { viewedAt: new Date().toISOString() });
  await recordEvent({
    type: "proposal.viewed",
    leadId: proposal.leadId,
    proposalId: proposal.id,
    actor: "client",
    data: { firstView: !proposal.viewedAt },
  });
}

export async function respondToProposal(params: {
  token: string;
  decision: "accepted" | "declined";
  name: string;
  note: string | null;
}): Promise<Proposal> {
  const repo = getRepository();
  const proposal = await repo.getProposalByToken(params.token);
  if (!proposal || !isShareable(proposal)) throw new PipelineError("Proposal not found", 404, "not_found");
  if (proposal.status === "accepted" || proposal.status === "declined") {
    throw new PipelineError(`This proposal was already ${proposal.status}`, 409, "already_responded");
  }
  if (isProposalExpired(proposal)) {
    throw new PipelineError("This proposal has expired — please contact the studio for an updated version", 410, "expired");
  }

  const respondedAt = new Date().toISOString();
  const updated = await repo.updateProposal(proposal.id, {
    status: params.decision,
    respondedAt,
    clientResponse: { decision: params.decision, name: params.name, note: params.note, at: respondedAt },
  });
  let lead = await repo.getLead(proposal.leadId);
  if (!lead) throw new PipelineError("Lead not found", 404, "not_found");

  await recordEvent({
    type: params.decision === "accepted" ? "proposal.accepted" : "proposal.declined",
    leadId: lead.id,
    proposalId: updated.id,
    actor: "client",
    data: { name: params.name, note: params.note, total: updated.totals.total },
  });
  lead = await setLeadStatus(lead, params.decision === "accepted" ? "won" : "lost", "client");

  await deliver("dispatch", params.decision === "accepted" ? "proposal.accepted" : "proposal.declined", lead, updated);
  await syncCrm(lead, params.decision === "accepted" ? "proposal.accepted" : "proposal.declined", updated);
  return updated;
}

/* ----------------------------------------------------------------------------
 * Callbacks from n8n (POST /api/v1/events)
 * ------------------------------------------------------------------------- */

export const N8N_EVENT_TYPES = [
  "notification.sent",
  "email.sent",
  "crm.synced",
  "analysis.failed",
  "proposal.sent",
  "pdf.generated",
  "custom",
] as const;
export type N8nEventType = (typeof N8N_EVENT_TYPES)[number];

export async function ingestN8nEvent(input: {
  type: N8nEventType;
  leadId?: string;
  leadReference?: string;
  proposalId?: string;
  data: Record<string, unknown>;
}): Promise<{ leadId: string; eventType: N8nEventType }> {
  const repo = getRepository();
  const proposal = input.proposalId ? await repo.getProposal(input.proposalId) : null;
  const lead =
    (input.leadId ? await repo.getLead(input.leadId) : null) ??
    (input.leadReference ? await repo.getLeadByReference(input.leadReference) : null) ??
    (proposal ? await repo.getLead(proposal.leadId) : null);
  if (!lead) throw new PipelineError("Lead not found", 404, "not_found");

  switch (input.type) {
    case "proposal.sent": {
      if (!proposal) throw new PipelineError("proposalId is required for proposal.sent", 422, "validation_failed");
      await markProposalSent(proposal.id, "n8n", input.data);
      break;
    }
    case "analysis.failed": {
      const message = typeof input.data.error === "string" ? input.data.error : "The n8n analysis workflow reported a failure";
      await failAnalysis(lead, message, "n8n");
      break;
    }
    case "crm.synced": {
      const pick = (key: string) => (typeof input.data[key] === "string" ? (input.data[key] as string) : undefined);
      const crm = {
        ...lead.crm,
        ...(pick("airtableRecordId") ? { airtableRecordId: pick("airtableRecordId") } : {}),
        ...(pick("notionPageId") ? { notionPageId: pick("notionPageId") } : {}),
        ...(pick("supabaseRecordId") ? { supabaseRecordId: pick("supabaseRecordId") } : {}),
        syncedAt: new Date().toISOString(),
      };
      await repo.updateLead(lead.id, { crm });
      await recordEvent({ type: "crm.synced", leadId: lead.id, proposalId: proposal?.id ?? null, actor: "n8n", data: input.data });
      break;
    }
    default:
      await recordEvent({ type: input.type, leadId: lead.id, proposalId: proposal?.id ?? null, actor: "n8n", data: input.data });
  }
  return { leadId: lead.id, eventType: input.type };
}
