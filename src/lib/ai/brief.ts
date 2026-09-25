import {
  ASSETS,
  BUDGET_MAP,
  CURRENCY,
  FEATURE_MAP,
  GOALS,
  LANGUAGES,
  labelFor,
  PROJECT_TYPES,
  SCALE_MAP,
  SERVICE_MAP,
  TIMELINE_MAP,
} from "@/config/catalog";
import type { Lead } from "@/lib/types";

/**
 * The data-minimised brief sent to AI providers.
 *
 * Contact details (name, email, phone) are deliberately excluded — they are not
 * needed to scope the work. The same object is included in the n8n webhook
 * payload (`lead.aiBrief`) so both analysis runners send identical input.
 */
export interface AiBrief {
  reference: string;
  submittedAt: string;
  client: {
    company: string | null;
    role: string | null;
    industry: string | null;
    country: string | null;
    website: string | null;
  };
  project: {
    type: string;
    name: string | null;
    services: { key: string; name: string }[];
    description: string;
    goals: string[];
    audience: string | null;
    features: { key: string; name: string }[];
    scale: string;
    languages: string[];
    references: string[];
    existingAssets: string[];
  };
  budget: {
    range: string;
    min: number | null;
    max: number | null;
    currency: string;
    flexible: boolean;
  };
  timeline: {
    preference: string;
    deadline: string | null;
  };
  indicativeEstimate: {
    min: number;
    max: number;
    monthlyMin: number;
    monthlyMax: number;
    weeksMin: number;
    weeksMax: number;
  };
}

export function toAiBrief(lead: Lead): AiBrief {
  const { project, plan, contact, estimate } = lead;
  const budget = BUDGET_MAP[plan.budget];
  return {
    reference: lead.reference,
    submittedAt: lead.createdAt,
    client: {
      company: contact.company ?? null,
      role: contact.role ?? null,
      industry: project.industry ?? null,
      country: contact.country ?? null,
      website: contact.website ?? null,
    },
    project: {
      type: labelFor(PROJECT_TYPES, project.type),
      name: project.name ?? null,
      services: project.services.map((key) => ({ key, name: SERVICE_MAP[key]?.name ?? key })),
      description: project.description,
      goals: project.goals.map((key) => labelFor(GOALS, key)),
      audience: project.audience ?? null,
      features: project.features.map((key) => ({ key, name: FEATURE_MAP[key]?.name ?? key })),
      scale: SCALE_MAP[project.scale]?.name ?? project.scale,
      languages: project.languages.map((key) => labelFor(LANGUAGES, key)),
      references: project.references,
      existingAssets: project.assets.map((key) => labelFor(ASSETS, key)),
    },
    budget: {
      range: budget?.label ?? plan.budget,
      min: budget?.min ?? null,
      max: budget?.max ?? null,
      currency: CURRENCY,
      flexible: plan.budgetFlexible,
    },
    timeline: {
      preference: TIMELINE_MAP[plan.timeline]?.label ?? plan.timeline,
      deadline: plan.deadline ?? null,
    },
    indicativeEstimate: {
      min: estimate.min,
      max: estimate.max,
      monthlyMin: estimate.monthlyMin,
      monthlyMax: estimate.monthlyMax,
      weeksMin: estimate.weeksMin,
      weeksMax: estimate.weeksMax,
    },
  };
}
