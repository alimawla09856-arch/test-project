import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { getConfig } from "@/lib/env";
import type { Proposal, ProposalArabicText } from "@/lib/types";

/**
 * Arabic translation of the client-facing proposal text, for the bilingual
 * PDF (Arabic section, then the original English, per block — see
 * ProposalDocument.tsx). Computed once and cached on `proposal.translations`
 * (see the PDF route) rather than on every render.
 *
 * Requires `ANTHROPIC_API_KEY` — if Claude isn't configured, callers should
 * treat a `null` result as "render English-only" rather than fail the PDF.
 */

const ArabicTranslationSchema = z.object({
  title: z.string(),
  executiveSummary: z.string(),
  approach: z.string(),
  nextSteps: z.array(z.string()).describe("Same order and count as the English nextSteps."),
  notes: z.string().nullable(),
  phases: z.array(z.object({ name: z.string(), summary: z.string() })).describe("Same order and count as the English phases."),
  lineItems: z.array(z.object({ title: z.string(), description: z.string() })).describe("Same order and count as the English line items."),
});

const SYSTEM_PROMPT = [
  "You translate client-facing project proposals from English to Modern Standard Arabic for a design studio (AS Design Studio).",
  "Keep the tone warm and professional, matching the register a boutique studio would use with a client.",
  "Preserve names, prices and technical terms (e.g. CMS, SEO, API) as commonly written in Arabic business writing — transliterate or keep Latin where that's the natural convention.",
  "Return exactly one translated item per input item, in the same order — never merge, split, drop or add items.",
].join(" ");

function buildUserMessage(proposal: Proposal): string {
  const payload = {
    title: proposal.title,
    executiveSummary: proposal.executiveSummary,
    approach: proposal.approach,
    nextSteps: proposal.nextSteps,
    notes: proposal.notes,
    phases: proposal.phases.map((p) => ({ name: p.name, summary: p.summary })),
    lineItems: proposal.lineItems.map((i) => ({ title: i.title, description: i.description })),
  };
  return `Translate every field below to Arabic. Return JSON matching the schema exactly.\n\n${JSON.stringify(payload, null, 2)}`;
}

/** Returns `null` when Claude isn't configured, or when the translation call fails. */
export async function translateProposalToArabic(proposal: Proposal): Promise<ProposalArabicText | null> {
  const config = getConfig();
  if (config.ai.provider !== "anthropic" || !config.ai.anthropic) return null;

  try {
    const client = new Anthropic({ apiKey: config.ai.anthropic.apiKey, maxRetries: 2, timeout: 3 * 60 * 1000 });
    const stream = client.beta.messages.stream({
      model: config.ai.anthropic.model,
      max_tokens: 8000,
      system: [{ type: "text", text: SYSTEM_PROMPT }],
      messages: [{ role: "user", content: buildUserMessage(proposal) }],
      output_config: { format: betaZodOutputFormat(ArabicTranslationSchema) },
    });
    const message = await stream.finalMessage();
    if (message.stop_reason === "refusal" || message.stop_reason === "max_tokens" || !message.parsed_output) return null;

    const out = message.parsed_output;
    // Defensive: keep positional arrays aligned with the English proposal even if the model drifts on count.
    const alignedTo = <T,>(list: T[], length: number, fallback: T): T[] => {
      const next = list.slice(0, length);
      while (next.length < length) next.push(fallback);
      return next;
    };
    return {
      title: out.title,
      executiveSummary: out.executiveSummary,
      approach: out.approach,
      nextSteps: alignedTo(out.nextSteps, proposal.nextSteps.length, ""),
      notes: proposal.notes ? out.notes : null,
      phases: alignedTo(out.phases, proposal.phases.length, { name: "", summary: "" }),
      lineItems: alignedTo(out.lineItems, proposal.lineItems.length, { title: "", description: "" }),
    };
  } catch (error) {
    console.error(`[ai] Arabic translation failed for proposal ${proposal.id}`, error);
    return null;
  }
}
