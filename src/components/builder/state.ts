"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AssetKey,
  BudgetKey,
  ContactMethodKey,
  FeatureKey,
  GoalKey,
  LanguageKey,
  ProjectTypeKey,
  ScaleKey,
  ServiceKey,
  TimelineKey,
} from "@/config/catalog";
import { BUILDER_STEP_SCHEMAS, issuesToFieldErrors, type BuilderStepKey, type LeadSubmissionInput } from "@/lib/schemas/lead";

/** Form state for the Project Builder (mirrors LeadSubmission, with UI-friendly empties). */
export interface BuilderDraft {
  project: {
    type: ProjectTypeKey;
    name: string;
    services: ServiceKey[];
    description: string;
    goals: GoalKey[];
    industry: string;
    audience: string;
    features: FeatureKey[];
    scale: ScaleKey;
    languages: LanguageKey[];
    references: string[];
    assets: AssetKey[];
  };
  plan: {
    budget: BudgetKey | "";
    budgetFlexible: boolean;
    timeline: TimelineKey | "";
    deadline: string;
  };
  contact: {
    name: string;
    email: string;
    phone: string;
    whatsapp: boolean;
    company: string;
    role: string;
    website: string;
    country: string;
    preferredContact: ContactMethodKey;
    deliveryChannel: "email" | "whatsapp" | "both";
    consent: boolean;
    marketingOptIn: boolean;
  };
}

export const EMPTY_DRAFT: BuilderDraft = {
  project: {
    type: "new",
    name: "",
    services: [],
    description: "",
    goals: [],
    industry: "",
    audience: "",
    features: [],
    scale: "standard",
    languages: ["en"],
    references: [""],
    assets: [],
  },
  plan: { budget: "", budgetFlexible: false, timeline: "", deadline: "" },
  contact: {
    name: "",
    email: "",
    phone: "",
    whatsapp: false,
    company: "",
    role: "",
    website: "",
    country: "",
    preferredContact: "email",
    deliveryChannel: "email",
    consent: false,
    marketingOptIn: false,
  },
};

export const STEPS: { key: BuilderStepKey | "review"; label: string; title: string; subtitle: string }[] = [
  { key: "services", label: "الخدمات", title: "ما الذي يمكننا صنعه معاً؟", subtitle: "اختر كل ما يدور في ذهنك — يمكنك تعديل المزيج لاحقاً." },
  { key: "vision", label: "الرؤية", title: "أخبرنا عن مشروعك", subtitle: "كلما شاركت سياقاً أكثر، كان عرضك أدق." },
  { key: "scope", label: "النطاق", title: "حدّد نطاق العمل", subtitle: "اختر القدرات التي تحتاجها ومدى طموحك في المشروع." },
  { key: "plan", label: "الميزانية", title: "الميزانية والجدول الزمني", subtitle: "نطاق واقعي يساعدنا على اقتراح النطاق الصحيح — دون مفاجآت." },
  { key: "contact", label: "التواصل", title: "لمن نرسل العرض؟", subtitle: "سنستخدم بياناتك فقط لإعداد عرضك ومناقشته." },
  { key: "review", label: "المراجعة", title: "راجع تفاصيل مشروعك", subtitle: "كل شيء يبدو صحيحاً؟ أرسل وسنبدأ العمل." },
];

const STORAGE_KEY = "asd-builder-draft-v1";

function stepInput(draft: BuilderDraft, step: BuilderStepKey): unknown {
  switch (step) {
    case "services":
      return { type: draft.project.type, services: draft.project.services };
    case "vision":
      return {
        name: draft.project.name,
        description: draft.project.description,
        goals: draft.project.goals,
        industry: draft.project.industry,
        audience: draft.project.audience,
        references: draft.project.references.map((r) => r.trim()).filter(Boolean),
        assets: draft.project.assets,
      };
    case "scope":
      return { features: draft.project.features, scale: draft.project.scale, languages: draft.project.languages };
    case "plan":
      return {
        budget: draft.plan.budget || undefined,
        budgetFlexible: draft.plan.budgetFlexible,
        timeline: draft.plan.timeline || undefined,
        deadline: draft.plan.deadline,
      };
    case "contact":
      return { ...draft.contact, phone: draft.contact.phone, consent: draft.contact.consent ? true : undefined };
  }
}

export function validateStep(draft: BuilderDraft, step: BuilderStepKey): Record<string, string> {
  const result = BUILDER_STEP_SCHEMAS[step].safeParse(stepInput(draft, step));
  return result.success ? {} : issuesToFieldErrors(result.error);
}

export function toSubmission(draft: BuilderDraft, extras: Pick<LeadSubmissionInput, "meta" | "_hp" | "_t">): LeadSubmissionInput {
  return {
    project: {
      ...(stepInput(draft, "services") as object),
      ...(stepInput(draft, "vision") as object),
      ...(stepInput(draft, "scope") as object),
    } as LeadSubmissionInput["project"],
    plan: stepInput(draft, "plan") as LeadSubmissionInput["plan"],
    contact: stepInput(draft, "contact") as LeadSubmissionInput["contact"],
    ...extras,
  };
}

/** Draft state persisted to localStorage (guarded: storage may be unavailable). */
export function useBuilderDraft() {
  const [draft, setDraft] = useState<BuilderDraft>(EMPTY_DRAFT);
  const [restored, setRestored] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<BuilderDraft>;
        const merged: BuilderDraft = {
          project: { ...EMPTY_DRAFT.project, ...saved.project },
          plan: { ...EMPTY_DRAFT.plan, ...saved.plan },
          contact: { ...EMPTY_DRAFT.contact, ...saved.contact, consent: false },
        };
        if (merged.project.services.length || merged.project.description) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from storage
          setDraft(merged);
          setRestored(true);
        }
      }
    } catch {
      // Storage blocked or corrupted — start fresh.
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    const timer = setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      } catch {
        // ignore
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [draft]);

  const update = useCallback(<K extends keyof BuilderDraft>(section: K, patch: Partial<BuilderDraft[K]>) => {
    setDraft((current) => ({ ...current, [section]: { ...current[section], ...patch } }));
  }, []);

  const reset = useCallback(() => {
    setDraft(EMPTY_DRAFT);
    setRestored(false);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return { draft, update, reset, restored, dismissRestored: () => setRestored(false) };
}

export function toggle<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}
