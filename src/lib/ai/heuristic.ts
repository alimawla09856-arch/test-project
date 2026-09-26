import {
  bundleDiscountRate,
  BUDGET_MAP,
  CURRENCY,
  DELIVERY_PHASES,
  GOALS,
  labelFor,
  SCALE_MAP,
  TIMELINE_MAP,
  type FeatureKey,
  type ServiceKey,
} from "@/config/catalog";
import { estimateProject } from "@/lib/pricing/estimate";
import { resolveFeatureMap, resolveServiceMap, type PricingOverrides } from "@/lib/pricing/overrides";
import { normalizeAnalysis, type Deliverable, type ScopeAnalysis } from "@/lib/schemas/analysis";
import type { Lead } from "@/lib/types";

/**
 * Deterministic, rule-based scope analysis built purely from the rate card.
 *
 * Used when no AI provider is configured (local development, demos), and as a
 * safety net when an AI call fails — the studio still gets a reviewable draft.
 */

const round50 = (value: number) => Math.round(value / 50) * 50;

/** Goals phrased for third-person copy ("… wants to elevate its brand"). */
const GOAL_PHRASES: Record<string, string> = {
  "generate-leads": "generate more qualified leads",
  "sell-online": "sell online",
  "elevate-brand": "elevate its brand",
  "launch-product": "launch a new product",
  "automate-operations": "automate day-to-day operations",
  "improve-conversion": "improve conversion",
  "enter-new-market": "enter a new market",
  "support-fundraising": "support its fundraising",
};

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

const SERVICE_QUESTIONS: Partial<Record<ServiceKey, string[]>> = {
  "brand-identity": ["Are there brands (in or outside your industry) whose positioning you admire?", "Do you need naming or only visual identity?"],
  "web-design": ["Roughly how many pages or templates do you expect at launch?", "Who will maintain the content after launch?"],
  ecommerce: ["How many products (and variants) will you launch with?", "Which payment gateways and shipping zones must be supported?"],
  "ui-ux": ["Do you have existing user research or analytics we can build on?", "Which platforms (web, iOS, Android) are in scope for design?"],
  "mobile-app": ["Is there an existing backend/API, or should we build it?", "Which features are essential for the first release?"],
  "ai-automation": ["Which tools does the team use daily (CRM, email, spreadsheets)?", "Which process costs you the most time today?"],
  "seo-content": ["Which markets and languages should we rank in?", "Who approves content before publishing?"],
  "social-media": ["Which channels matter most to your audience?", "Is there a monthly paid media budget in addition to management fees?"],
  "motion-3d": ["Where will the motion pieces be used (web, social, events)?", "Do you have product CAD files or references?"],
};

export function analyzeHeuristically(lead: Lead, overrides?: PricingOverrides | null): ScopeAnalysis {
  const { project, plan, contact } = lead;
  const serviceMap = resolveServiceMap(overrides);
  const featureMap = resolveFeatureMap(overrides);
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
  const scale = SCALE_MAP[project.scale];
  const timeline = TIMELINE_MAP[plan.timeline];
  const budget = BUDGET_MAP[plan.budget];
  const services = project.services.map((key) => serviceMap[key]).filter(Boolean);
  const multiplier = scale.priceMultiplier * timeline.priceMultiplier * (1 - bundleDiscountRate(services.length));

  // Phases with durations derived from the estimate's mid-point.
  const midWeeks = (estimate.weeksMin + estimate.weeksMax) / 2 || 4;
  const phaseSummaries: Record<string, string> = {
    discovery: "Workshops, research and a shared definition of success, scope and priorities.",
    design: "Concepts, iterations and a signed-off design direction across every touchpoint.",
    build: "Production and development in weekly sprints with regular demos and feedback.",
    launch: "Quality assurance, final polish, launch and a handover to your team.",
  };
  const phaseMilestones: Record<string, string[]> = {
    discovery: ["Kickoff workshop", "Strategy & scope sign-off"],
    design: ["Design direction presented", "Final design approval"],
    build: ["Sprint demos", "Content integration complete"],
    launch: ["QA sign-off", "Launch & handover"],
  };
  const phases = DELIVERY_PHASES.map((phase) => ({
    name: phase.name,
    weeks: Math.max(0.5, Math.round(midWeeks * phase.share * 2) / 2),
    summary: phaseSummaries[phase.key],
    milestones: phaseMilestones[phase.key],
  }));
  const phaseName = (index: number) => phases[Math.min(index, phases.length - 1)].name;

  // Deliverables: each service's four typical deliverables map onto the four phases.
  const weights = [0.2, 0.3, 0.35, 0.15];
  const deliverables: Deliverable[] = [];
  for (const service of services) {
    const servicePrice = ((service.price.min + service.price.max) / 2) * multiplier;
    service.deliverables.forEach((deliverable, index) => {
      deliverables.push({
        title: deliverable.title,
        description: deliverable.description,
        serviceKey: service.key,
        phase: phaseName(index),
        price: servicePrice * (weights[index] ?? 0.25),
        billing: "one_time",
        optional: false,
        estimatedHours: null,
      });
    });
  }
  for (const key of project.features) {
    const feature = featureMap[key];
    if (!feature) continue;
    if (feature.price > 0) {
      deliverables.push({
        title: feature.name,
        description: feature.description,
        serviceKey: services[0]?.key ?? "other",
        phase: phaseName(2),
        price: feature.price * scale.priceMultiplier,
        billing: "one_time",
        optional: false,
        estimatedHours: null,
      });
    }
    if (feature.monthly) {
      deliverables.push({
        title: `${feature.name} (monthly)`,
        description: feature.description,
        serviceKey: services[0]?.key ?? "other",
        phase: phaseName(3),
        price: feature.monthly,
        billing: "monthly",
        optional: false,
        estimatedHours: null,
      });
    }
  }
  const extraLanguages = Math.max(0, project.languages.length - 1 - (project.features.includes("multilingual") ? 1 : 0));
  if (extraLanguages > 0) {
    deliverables.push({
      title: `Localisation for ${extraLanguages} additional language${extraLanguages > 1 ? "s" : ""}`,
      description: "Translation workflow, localised layouts and native-speaker review.",
      serviceKey: services[0]?.key ?? "other",
      phase: phaseName(2),
      price: featureMap.multilingual.price * scale.priceMultiplier * extraLanguages,
      billing: "one_time",
      optional: false,
      estimatedHours: null,
    });
  }

  // Nudge the base scope toward the client's budget (within ±15%) when it overlaps.
  const base = deliverables.filter((d) => d.billing === "one_time").reduce((sum, d) => sum + d.price, 0);
  let factor = 1;
  if (budget.min !== null && base > 0) {
    const budgetMid = budget.max === null ? budget.min * 1.25 : (budget.min + budget.max) / 2;
    const target = Math.min(Math.max(budgetMid, estimate.min), estimate.max);
    factor = Math.min(1.15, Math.max(0.85, target / base));
  }
  for (const item of deliverables) {
    if (item.billing === "one_time") item.price = round50(item.price * factor);
  }

  // Optional upsells: related features the client did not select, plus retainers.
  const selected = new Set<FeatureKey>(project.features);
  const upsellKeys = [...new Set(services.flatMap((s) => s.relatedFeatures))].filter((key) => !selected.has(key)).slice(0, 2);
  for (const key of upsellKeys) {
    const feature = featureMap[key];
    if (!feature || feature.price <= 0) continue;
    deliverables.push({
      title: feature.name,
      description: `Recommended add-on: ${feature.description.charAt(0).toLowerCase()}${feature.description.slice(1)}.`,
      serviceKey: services[0]?.key ?? "other",
      phase: phaseName(2),
      price: round50(feature.price * scale.priceMultiplier),
      billing: "one_time",
      optional: true,
      estimatedHours: null,
    });
  }
  const retainer = services.find((s) => s.monthly);
  if (retainer?.monthly) {
    deliverables.push({
      title: retainer.monthly.label,
      description: "Ongoing support after launch, billed monthly and cancellable with 30 days' notice.",
      serviceKey: retainer.key,
      phase: phaseName(3),
      price: round50((retainer.monthly.min + retainer.monthly.max) / 2),
      billing: "monthly",
      optional: true,
      estimatedHours: null,
    });
  }

  const recommended = deliverables.filter((d) => !d.optional && d.billing === "one_time").reduce((s, d) => s + d.price, 0);
  const totalWeeks = phases.reduce((s, p) => s + p.weeks, 0);

  // Risks.
  const risks: ScopeAnalysis["risks"] = [];
  if (plan.timeline === "asap") {
    risks.push({ title: "Compressed timeline", severity: totalWeeks > 6 ? "high" : "medium", mitigation: "Prioritise a launch-critical scope, run design and build in parallel tracks and agree fast feedback windows." });
  }
  if (budget.max !== null && recommended > budget.max * 1.1) {
    const gap = recommended / budget.max - 1;
    risks.push({ title: "Budget below recommended scope", severity: gap > 0.35 ? "high" : "medium", mitigation: "Offer a phased roadmap: launch the core scope first and schedule the remaining items as phase two." });
  }
  if (plan.budget === "not-sure") {
    risks.push({ title: "Budget not yet defined", severity: "low", mitigation: "Share the indicative range early and confirm budget on the discovery call." });
  }
  if (project.languages.includes("ar")) {
    risks.push({ title: "Right-to-left localisation", severity: "medium", mitigation: "Design RTL layouts from the start and plan native Arabic copy review." });
  }
  if (project.features.some((f) => f === "integrations" || f === "payments" || f === "crm")) {
    risks.push({ title: "Third-party dependencies", severity: "medium", mitigation: "Confirm API access, credentials and gateway approvals during discovery." });
  }
  if (!project.assets.length && !project.services.includes("brand-identity") && project.services.some((s) => s === "web-design" || s === "ecommerce")) {
    risks.push({ title: "Content & brand assets readiness", severity: "medium", mitigation: "Agree a content plan and deadlines; consider the copywriting and photography add-ons." });
  }
  if (project.description.length < 120) {
    risks.push({ title: "Brief is light on detail", severity: "low", mitigation: "Validate scope and priorities on the discovery call before final pricing." });
  }

  // Fit score.
  let fit = 60;
  if (budget.min !== null) {
    if (budget.max === null || recommended <= budget.max * 1.1) fit += 15;
    else if (recommended > budget.max * 1.35) fit -= 20;
    else fit -= 5;
  } else fit -= 5;
  if (project.description.length > 200) fit += 10;
  if (project.goals.length >= 2) fit += 5;
  if (contact.company) fit += 5;
  if (plan.timeline === "asap" && totalWeeks > 8) fit -= 10;
  fit = Math.max(5, Math.min(98, fit));

  const complexity: ScopeAnalysis["complexity"] =
    recommended < 5000 ? "low" : recommended < 15000 ? "medium" : recommended < 40000 ? "high" : "very_high";

  const clientName = contact.company ?? project.name ?? contact.name;
  const serviceNames = services.map((s) => s.name);
  const serviceList = serviceNames.length ? serviceNames.join(" + ") : "Digital project";
  const serviceProse = joinList(serviceNames.map((name) => name.toLowerCase()));
  const goals = project.goals.map((g) => GOAL_PHRASES[g] ?? labelFor(GOALS, g).toLowerCase());
  const goalsText = goals.length ? joinList(goals) : "strengthen its digital presence";
  const industry = project.industry ? ` in ${project.industry.toLowerCase()}` : "";

  const questions = [
    ...services.flatMap((s) => SERVICE_QUESTIONS[s.key] ?? []).slice(0, 5),
    "Who are the decision-makers and approvers on your side?",
    plan.deadline ? `What drives the ${plan.deadline} deadline, and is it fixed?` : "Is there a launch date or event we should plan around?",
  ];

  const alignmentNote =
    budget.min === null
      ? "The client has not set a budget yet; the recommendation follows the rate card mid-range."
      : budget.max !== null && recommended > budget.max * 1.1
        ? `The recommended scope sits above the stated ${budget.label} range. A phased launch keeps phase one within budget.`
        : `The recommended scope fits the stated ${budget.label} range.`;

  return normalizeAnalysis({
    summary: `${clientName}${industry} is looking for ${serviceProse} to ${goalsText}. Budget: ${budget.label}; timeline: ${timeline.label}. Rule-based estimate ${estimate.min.toLocaleString("en-US")}–${estimate.max.toLocaleString("en-US")} ${CURRENCY}.`,
    clientNeeds: [
      ...project.goals.map((g) => labelFor(GOALS, g)),
      ...project.features.slice(0, 3).map((f) => featureMap[f]?.name ?? f),
    ].slice(0, 6),
    projectType: serviceList,
    complexity,
    fitScore: fit,
    fitRationale: `Scored on budget realism (${budget.label}), brief detail, stated goals and timeline feasibility (${timeline.label}).`,
    budget: {
      currency: CURRENCY,
      estimateLow: estimate.min,
      estimateHigh: estimate.max,
      recommended,
      monthlyRecurring: 0,
      clientBudgetLow: budget.min,
      clientBudgetHigh: budget.max,
      alignment: "unknown",
      notes: `${alignmentNote} Generated by the rule-based estimator from the studio rate card — review before sending.`,
    },
    deliverables,
    timeline: { totalWeeks, phases },
    risks,
    assumptions: [
      "Timelines assume feedback within two business days at each review point.",
      "Two rounds of revisions are included per design deliverable.",
      project.assets.includes("copy") ? "Final copy is supplied by the client." : "Content is supplied or approved by the client unless copywriting is included.",
      "Third-party licences, hosting and paid media spend are billed at cost.",
    ],
    clarifyingQuestions: questions,
    proposal: {
      title: `${clientName} — ${serviceList}`,
      executiveSummary: `Thank you for sharing your plans with us. ${clientName} wants to ${goalsText}, and we see a clear opportunity to get there with ${serviceProse} crafted around your audience${project.audience ? ` — ${project.audience.charAt(0).toLowerCase()}${project.audience.slice(1)}` : ""}.\n\nThis proposal outlines a focused scope, a realistic ${Math.round(totalWeeks)}-week timeline and a transparent investment, designed to launch with confidence and grow from there.`,
      approach:
        "We work in clear phases with a dedicated team: discovery to align on goals and success metrics, design to establish the direction, then build and production in short sprints with regular demos. You get a single point of contact, shared progress boards and sign-off moments at every milestone.",
      nextSteps: [
        "Accept this proposal online",
        "Schedule the kickoff workshop",
        "Share brand assets, content and access to existing tools",
        "Receive the detailed project plan within 3 business days",
      ],
    },
  });
}
