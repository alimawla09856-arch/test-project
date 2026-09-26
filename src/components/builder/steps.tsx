"use client";

import { motion } from "framer-motion";
import { Check, Plus, X } from "lucide-react";
import { useCallback, type PointerEvent } from "react";
import {
  ASSETS,
  BUDGETS,
  CONTACT_METHODS,
  CURRENCY,
  FEATURES,
  GOALS,
  LANGUAGES,
  PROJECT_TYPES,
  SCALES,
  SERVICES,
  SERVICE_MAP,
  TIMELINES,
  type FeatureKey,
} from "@/config/catalog";
import {
  ASSET_LABELS_AR,
  BUDGET_LABELS_AR,
  CONTACT_METHOD_LABELS_AR,
  FEATURE_DESCRIPTIONS_AR,
  FEATURE_NAMES_AR,
  GOAL_LABELS_AR,
  INDUSTRIES_AR,
  LANGUAGE_LABELS_AR,
  PROJECT_TYPE_DESCRIPTIONS_AR,
  PROJECT_TYPE_LABELS_AR,
  SCALE_DESCRIPTIONS_AR,
  SCALE_NAMES_AR,
  SERVICE_NAMES_AR,
  SERVICE_TAGLINES_AR,
  TIMELINE_DESCRIPTIONS_AR,
  TIMELINE_LABELS_AR,
} from "@/config/catalog.ar";
import { brand } from "@/config/brand";
import { formatMoney } from "@/lib/format";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/components/ui/cn";
import { FieldError, Hint, Input, Label, Select, Textarea } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { Switch } from "@/components/ui/Switch";
import { SERVICE_ICONS } from "./icons";
import { toggle, type BuilderDraft } from "./state";
import { VoiceRecorder } from "./VoiceRecorder";

export interface StepProps {
  draft: BuilderDraft;
  update: <K extends keyof BuilderDraft>(section: K, patch: Partial<BuilderDraft[K]>) => void;
  errors: Record<string, string>;
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045 } },
};
const rise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

function useSpotlight() {
  return useCallback((event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--my", `${event.clientY - rect.top}px`);
  }, []);
}

function SectionLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <h3 className="text-[13px] font-medium uppercase tracking-[0.16em] text-mist">{children}</h3>
      {hint ? <span className="text-[12px] text-fog">{hint}</span> : null}
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * 01 — Services
 * ------------------------------------------------------------------------- */

const PROJECT_TYPES_AR = PROJECT_TYPES.map((pt) => ({ key: pt.key, label: PROJECT_TYPE_LABELS_AR[pt.key], description: PROJECT_TYPE_DESCRIPTIONS_AR[pt.key] }));

export function ServicesStep({ draft, update, errors }: StepProps) {
  const onPointerMove = useSpotlight();
  const selected = draft.project.services;
  return (
    <div className="space-y-8">
      <Segmented
        ariaLabel="نوع المشروع"
        value={draft.project.type}
        onChange={(type) => update("project", { type })}
        options={PROJECT_TYPES_AR}
      />
      <div>
        <SectionLabel hint={selected.length ? `${selected.length} مُختارة` : "اختر واحدة أو أكثر"}>الخدمات</SectionLabel>
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" role="group" aria-label="الخدمات">
          {SERVICES.map((service) => {
            const Icon = SERVICE_ICONS[service.icon];
            const active = selected.includes(service.key);
            return (
              <motion.button
                key={service.key}
                variants={rise}
                type="button"
                role="checkbox"
                aria-checked={active}
                onPointerMove={onPointerMove}
                onClick={() => update("project", { services: toggle(selected, service.key) })}
                className={cn(
                  "spotlight group relative flex min-h-[148px] flex-col rounded-2xl border p-4 text-start transition-all duration-300 ease-out-expo active:scale-[0.985]",
                  active
                    ? "border-ember-400/55 bg-gradient-to-b from-ember-500/[0.14] to-ember-500/[0.03] shadow-[0_18px_50px_-24px_rgb(255_138_76/0.9)]"
                    : "border-white/[0.08] bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.045]",
                )}
              >
                <span className="flex items-start justify-between">
                  <span
                    className={cn(
                      "grid size-10 place-items-center rounded-xl border transition-colors",
                      active ? "border-ember-400/40 bg-ember-400/15 text-ember-300" : "border-white/10 bg-white/[0.04] text-mist group-hover:text-ivory",
                    )}
                  >
                    <Icon className="size-[18px]" strokeWidth={1.6} />
                  </span>
                  <span
                    className={cn(
                      "grid size-5 place-items-center rounded-full border transition-all duration-300",
                      active ? "scale-100 border-ember-400 bg-ember-400 text-ink-950" : "scale-90 border-white/20 text-transparent",
                    )}
                  >
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                </span>
                <span className="mt-4 font-display text-[19px] leading-tight tracking-tight text-ivory">{SERVICE_NAMES_AR[service.key]}</span>
                <span className="mt-1 text-[13px] leading-snug text-mist">{SERVICE_TAGLINES_AR[service.key]}</span>
                <span className="mt-auto pt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-fog">
                  من {formatMoney(service.price.min, CURRENCY, { compact: true })}
                </span>
              </motion.button>
            );
          })}
        </motion.div>
        <FieldError message={errors.services} />
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * 02 — Vision
 * ------------------------------------------------------------------------- */

export function VisionStep({ draft, update, errors }: StepProps) {
  const { project } = draft;
  const length = project.description.trim().length;
  const setReference = (index: number, value: string) =>
    update("project", { references: project.references.map((r, i) => (i === index ? value : r)) });

  return (
    <div className="space-y-7">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="project-name" optional="اختياري">
            اسم المشروع
          </Label>
          <Input
            id="project-name"
            placeholder="مثال: إعادة إطلاق الموقع الرئيسي"
            value={project.name}
            maxLength={120}
            onChange={(e) => update("project", { name: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="industry" optional="اختياري">
            القطاع
          </Label>
          <Input
            id="industry"
            list="industries"
            placeholder="ابدأ الكتابة…"
            value={project.industry}
            maxLength={80}
            onChange={(e) => update("project", { industry: e.target.value })}
          />
          <datalist id="industries">
            {INDUSTRIES_AR.map((industry) => (
              <option key={industry} value={industry} />
            ))}
          </datalist>
        </div>
      </div>

      <div>
        <Label htmlFor="description">ما الذي تسعى لتحقيقه؟</Label>
        <Textarea
          id="description"
          rows={6}
          invalid={Boolean(errors.description)}
          aria-describedby="description-hint description-error"
          placeholder="أخبرنا عن نشاطك التجاري، من يخدم، ما الذي لا يعمل بشكل جيد اليوم، وكيف يبدو النجاح خلال ستة أشهر…"
          value={project.description}
          maxLength={5000}
          onChange={(e) => update("project", { description: e.target.value })}
        />
        <div className="flex items-start justify-between gap-4">
          <FieldError id="description-error" message={errors.description} />
          <span id="description-hint" className={cn("ms-auto mt-2 font-mono text-[11px]", length >= 30 ? "text-glacier-400" : "text-fog")}>
            {length < 30 ? `${30 - length} حرفاً إضافياً` : `${length} حرفاً ✓`}
          </span>
        </div>
        <VoiceRecorder
          className="mt-3"
          onTranscript={(text) =>
            update("project", { description: project.description.trim() ? `${project.description.trim()}\n\n${text}` : text })
          }
        />
      </div>

      <div>
        <SectionLabel hint="اختياري">الأهداف الرئيسية</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {GOALS.map((goal) => (
            <Chip key={goal.key} selected={project.goals.includes(goal.key)} onToggle={() => update("project", { goals: toggle(project.goals, goal.key) })}>
              {GOAL_LABELS_AR[goal.key]}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="audience" optional="اختياري">
          لمن هذا المشروع؟
        </Label>
        <Input
          id="audience"
          placeholder="مثال: أصحاب فنادق بوتيك في منطقة الخليج"
          value={project.audience}
          maxLength={300}
          onChange={(e) => update("project", { audience: e.target.value })}
        />
      </div>

      <div>
        <SectionLabel hint="اختياري">مراجع تعجبك</SectionLabel>
        <div className="space-y-2">
          {project.references.map((reference, index) => (
            <div key={index} className="flex gap-2">
              <Input
                aria-label={`رابط مرجعي ${index + 1}`}
                placeholder="https://"
                inputMode="url"
                value={reference}
                invalid={Boolean(errors[`references.${index}`])}
                onChange={(e) => setReference(index, e.target.value)}
              />
              {project.references.length > 1 ? (
                <button
                  type="button"
                  aria-label="حذف المرجع"
                  onClick={() => update("project", { references: project.references.filter((_, i) => i !== index) })}
                  className="grid size-12 shrink-0 place-items-center rounded-xl border border-white/10 text-fog transition hover:border-white/25 hover:text-ivory"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>
          ))}
          {Object.entries(errors)
            .filter(([key]) => key.startsWith("references"))
            .slice(0, 1)
            .map(([key, message]) => (
              <FieldError key={key} message={message} />
            ))}
          {project.references.length < 5 ? (
            <button
              type="button"
              onClick={() => update("project", { references: [...project.references, ""] })}
              className="inline-flex items-center gap-1.5 text-[13px] text-ember-300 transition hover:text-ember-200"
            >
              <Plus className="size-3.5" /> إضافة رابط آخر
            </button>
          ) : null}
        </div>
      </div>

      <div>
        <SectionLabel hint="اختياري">ما الذي تمتلكه حالياً؟</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {ASSETS.map((asset) => (
            <Chip key={asset.key} selected={project.assets.includes(asset.key)} onToggle={() => update("project", { assets: toggle(project.assets, asset.key) })}>
              {ASSET_LABELS_AR[asset.key]}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * 03 — Scope
 * ------------------------------------------------------------------------- */

export function ScopeStep({ draft, update, errors }: StepProps) {
  const { project } = draft;
  const related = new Set<FeatureKey>(project.services.flatMap((key) => SERVICE_MAP[key]?.relatedFeatures ?? []));
  const features = [...FEATURES].sort((a, b) => Number(related.has(b.key)) - Number(related.has(a.key)));
  const onPointerMove = useSpotlight();

  return (
    <div className="space-y-8">
      <div>
        <SectionLabel hint={related.size ? "موصى بها بناءً على خدماتك أولاً" : undefined}>القدرات</SectionLabel>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {features.map((feature) => {
            const active = project.features.includes(feature.key);
            return (
              <button
                key={feature.key}
                type="button"
                role="checkbox"
                aria-checked={active}
                onPointerMove={onPointerMove}
                onClick={() => update("project", { features: toggle(project.features, feature.key) })}
                className={cn(
                  "spotlight flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-start transition-all duration-300",
                  active ? "border-ember-400/50 bg-ember-500/[0.1]" : "border-white/[0.08] bg-white/[0.02] hover:border-white/20",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-all",
                    active ? "border-ember-400 bg-ember-400 text-ink-950" : "border-white/20",
                  )}
                >
                  {active ? <Check className="size-3" strokeWidth={3} /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-[14px] font-medium text-ivory">
                    {FEATURE_NAMES_AR[feature.key]}
                    {related.has(feature.key) ? (
                      <span className="rounded-full bg-glacier-400/10 px-1.5 py-px font-mono text-[9.5px] uppercase tracking-wider text-glacier-300">مناسبة</span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] leading-snug text-fog">{FEATURE_DESCRIPTIONS_AR[feature.key]}</span>
                </span>
                <span className="shrink-0 font-mono text-[11px] text-mist">
                  {feature.price > 0 ? `+${formatMoney(feature.price, CURRENCY, { compact: true })}` : `${formatMoney(feature.monthly ?? 0, CURRENCY)}/شهرياً`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <SectionLabel>ما مدى طموح المشروع؟</SectionLabel>
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4" role="radiogroup" aria-label="نطاق المشروع">
          {SCALES.map((scale, index) => {
            const active = project.scale === scale.key;
            return (
              <button
                key={scale.key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => update("project", { scale: scale.key })}
                className={cn(
                  "rounded-2xl border p-4 text-start transition-all duration-300",
                  active ? "border-ember-400/55 bg-ember-500/[0.1]" : "border-white/[0.08] bg-white/[0.02] hover:border-white/20",
                )}
              >
                <span className="flex gap-1" aria-hidden>
                  {SCALES.map((_, i) => (
                    <span key={i} className={cn("h-1 w-5 rounded-full", i <= index ? (active ? "bg-ember-400" : "bg-mist/60") : "bg-white/10")} />
                  ))}
                </span>
                <span className="mt-3 block font-display text-[17px] text-ivory">{SCALE_NAMES_AR[scale.key]}</span>
                <span className="mt-1 block text-[12.5px] leading-snug text-fog">{SCALE_DESCRIPTIONS_AR[scale.key]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <SectionLabel>اللغات</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((language) => (
            <Chip
              key={language.key}
              selected={project.languages.includes(language.key)}
              onToggle={() => update("project", { languages: toggle(project.languages, language.key) })}
            >
              {LANGUAGE_LABELS_AR[language.key]}
            </Chip>
          ))}
        </div>
        <FieldError message={errors.languages} />
        {project.languages.includes("ar") ? <Hint>الواجهات العربية مصمَّمة من اليمين إلى اليسار منذ البداية — لا تُعكس لاحقاً كحل مؤقت.</Hint> : null}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * 04 — Budget & timeline
 * ------------------------------------------------------------------------- */

export function PlanStep({ draft, update, errors }: StepProps) {
  const { plan } = draft;
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="space-y-8">
      <div>
        <SectionLabel>نطاق الاستثمار</SectionLabel>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4" role="radiogroup" aria-label="الميزانية">
          {BUDGETS.map((budget) => {
            const active = plan.budget === budget.key;
            return (
              <button
                key={budget.key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => update("plan", { budget: budget.key })}
                className={cn(
                  "rounded-2xl border px-4 py-4 text-start transition-all duration-300",
                  budget.key === "not-sure" && "col-span-2 sm:col-span-1",
                  active
                    ? "border-ember-400/55 bg-ember-500/[0.12] shadow-[0_14px_40px_-22px_rgb(255_138_76/0.9)]"
                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/20",
                )}
              >
                <span className={cn("font-display text-[18px] tracking-tight", active ? "text-ivory" : "text-mist")}>{BUDGET_LABELS_AR[budget.key]}</span>
              </button>
            );
          })}
        </div>
        <FieldError message={errors.budget} />
        <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
          <Switch
            id="budget-flexible"
            checked={plan.budgetFlexible}
            onChange={(budgetFlexible) => update("plan", { budgetFlexible })}
            label="الميزانية مرنة للحل المناسب"
            description="سنُدرج نطاقاً اختيارياً يتجاوز هذا المدى."
          />
        </div>
      </div>

      <div>
        <SectionLabel>الجدول الزمني</SectionLabel>
        <div className="grid gap-2.5 sm:grid-cols-5" role="radiogroup" aria-label="الجدول الزمني">
          {TIMELINES.map((timeline) => {
            const active = plan.timeline === timeline.key;
            return (
              <button
                key={timeline.key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => update("plan", { timeline: timeline.key })}
                className={cn(
                  "rounded-2xl border p-4 text-start transition-all duration-300",
                  active ? "border-ember-400/55 bg-ember-500/[0.12]" : "border-white/[0.08] bg-white/[0.02] hover:border-white/20",
                )}
              >
                <span className="block font-display text-[17px] text-ivory">{TIMELINE_LABELS_AR[timeline.key]}</span>
                <span className="mt-1 block text-[12px] leading-snug text-fog">{TIMELINE_DESCRIPTIONS_AR[timeline.key]}</span>
              </button>
            );
          })}
        </div>
        <FieldError message={errors.timeline} />
      </div>

      <div className="max-w-xs">
        <Label htmlFor="deadline" optional="اختياري">
          موعد نهائي محدد أو تاريخ الإطلاق
        </Label>
        <Input id="deadline" type="date" min={today} value={plan.deadline} onChange={(e) => update("plan", { deadline: e.target.value })} invalid={Boolean(errors.deadline)} />
        <FieldError message={errors.deadline} />
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * 05 — Contact
 * ------------------------------------------------------------------------- */

export function ContactStep({ draft, update, errors }: StepProps) {
  const { contact } = draft;
  const field = (key: keyof BuilderDraft["contact"]) => ({
    id: `contact-${key}`,
    invalid: Boolean(errors[key]),
    "aria-describedby": errors[key] ? `contact-${key}-error` : undefined,
  });
  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="contact-name">الاسم الكامل</Label>
          <Input {...field("name")} autoComplete="name" value={contact.name} onChange={(e) => update("contact", { name: e.target.value })} />
          <FieldError id="contact-name-error" message={errors.name} />
        </div>
        <div>
          <Label htmlFor="contact-email">البريد الإلكتروني للعمل</Label>
          <Input {...field("email")} type="email" autoComplete="email" inputMode="email" value={contact.email} onChange={(e) => update("contact", { email: e.target.value })} />
          <FieldError id="contact-email-error" message={errors.email} />
        </div>
        <div>
          <Label htmlFor="contact-company" optional="اختياري">
            الشركة
          </Label>
          <Input {...field("company")} autoComplete="organization" value={contact.company} onChange={(e) => update("contact", { company: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="contact-role" optional="اختياري">
            دورك في الشركة
          </Label>
          <Input {...field("role")} autoComplete="organization-title" value={contact.role} onChange={(e) => update("contact", { role: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="contact-phone" optional="اختياري">
            الهاتف
          </Label>
          <Input
            {...field("phone")}
            type="tel"
            autoComplete="tel"
            placeholder="+961 …"
            value={contact.phone}
            onChange={(e) => update("contact", e.target.value ? { phone: e.target.value } : { phone: e.target.value, whatsapp: false, deliveryChannel: "email" })}
          />
          <FieldError id="contact-phone-error" message={errors.phone} />
        </div>
        <div>
          <Label htmlFor="contact-website" optional="اختياري">
            الموقع الإلكتروني الحالي
          </Label>
          <Input {...field("website")} inputMode="url" placeholder="yourcompany.com" value={contact.website} onChange={(e) => update("contact", { website: e.target.value })} />
          <FieldError id="contact-website-error" message={errors.website} />
        </div>
        <div>
          <Label htmlFor="contact-country" optional="اختياري">
            الدولة
          </Label>
          <Input {...field("country")} autoComplete="country-name" value={contact.country} onChange={(e) => update("contact", { country: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="contact-preferred">أفضل طريقة للتواصل</Label>
          <Select
            id="contact-preferred"
            value={contact.preferredContact}
            onChange={(e) => update("contact", { preferredContact: e.target.value as BuilderDraft["contact"]["preferredContact"] })}
          >
            {CONTACT_METHODS.map((method) => (
              <option key={method.key} value={method.key} className="bg-ink-900">
                {CONTACT_METHOD_LABELS_AR[method.key]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {contact.phone ? (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
          <Switch
            id="contact-whatsapp"
            checked={contact.whatsapp}
            onChange={(whatsapp) => update("contact", whatsapp ? { whatsapp } : { whatsapp, deliveryChannel: "email" })}
            label="هذا الرقم على واتساب"
          />
        </div>
      ) : null}

      <div>
        <Label htmlFor="contact-delivery">كيف نُرسل لك العرض؟</Label>
        <Segmented
          ariaLabel="طريقة إرسال العرض"
          value={contact.deliveryChannel}
          onChange={(deliveryChannel) => update("contact", { deliveryChannel })}
          options={
            contact.phone && contact.whatsapp
              ? [
                  { key: "email", label: "البريد الإلكتروني" },
                  { key: "whatsapp", label: "واتساب" },
                  { key: "both", label: "كلاهما" },
                ]
              : [{ key: "email", label: "البريد الإلكتروني" }]
          }
        />
        <FieldError message={errors.deliveryChannel} />
      </div>

      <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
        <label className="flex cursor-pointer items-start gap-3 text-[13.5px] leading-relaxed text-mist">
          <input
            type="checkbox"
            checked={contact.consent}
            onChange={(e) => update("contact", { consent: e.target.checked })}
            aria-invalid={Boolean(errors.consent) || undefined}
            className="mt-0.5 size-4 shrink-0 accent-[var(--color-ember-500)]"
          />
          <span>
            أوافق على أن يقوم {brand.name} بحفظ بيانات هذا الملخص والتواصل معي بخصوص مشروعي. يُحلَّل ملخص مشروعي بالذكاء الاصطناعي لإعداد
            العرض؛ لا تتم مشاركة بيانات التواصل مع مزوّدي الذكاء الاصطناعي.
          </span>
        </label>
        <FieldError message={errors.consent} />
        <label className="flex cursor-pointer items-start gap-3 text-[13.5px] leading-relaxed text-fog">
          <input
            type="checkbox"
            checked={contact.marketingOptIn}
            onChange={(e) => update("contact", { marketingOptIn: e.target.checked })}
            className="mt-0.5 size-4 shrink-0 accent-[var(--color-ember-500)]"
          />
          <span>أرغب باستلام أخبار الاستوديو ودراسات الحالة من حين لآخر (اختياري).</span>
        </label>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * 06 — Review
 * ------------------------------------------------------------------------- */

export function ReviewStep({ draft, onEdit }: { draft: BuilderDraft; onEdit: (step: number) => void }) {
  const { project, plan, contact } = draft;
  const rows: { step: number; label: string; value: string }[] = [
    { step: 0, label: "الخدمات", value: project.services.map((s) => SERVICE_NAMES_AR[s] ?? s).join(" · ") || "—" },
    { step: 0, label: "نوع المشروع", value: PROJECT_TYPE_LABELS_AR[project.type] },
    { step: 1, label: "المشروع", value: project.name || "بلا عنوان" },
    { step: 1, label: "الأهداف", value: project.goals.map((g) => GOAL_LABELS_AR[g]).join("، ") || "—" },
    { step: 2, label: "القدرات", value: project.features.map((f) => FEATURE_NAMES_AR[f] ?? f).join("، ") || "لم يتم اختيار شيء" },
    { step: 2, label: "النطاق واللغات", value: `${SCALE_NAMES_AR[project.scale]} · ${project.languages.map((l) => LANGUAGE_LABELS_AR[l]).join("، ")}` },
    { step: 3, label: "الميزانية", value: `${(plan.budget && BUDGET_LABELS_AR[plan.budget]) || "—"}${plan.budgetFlexible ? " (مرنة)" : ""}` },
    { step: 3, label: "الجدول الزمني", value: `${(plan.timeline && TIMELINE_LABELS_AR[plan.timeline]) || "—"}${plan.deadline ? ` · الموعد النهائي ${plan.deadline}` : ""}` },
    { step: 4, label: "التواصل", value: [contact.name, contact.company, contact.email].filter(Boolean).join(" · ") },
  ];
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.24em] text-fog">ملخص مشروعك</p>
        <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ivory/90">{project.description || "—"}</p>
      </div>
      <dl className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.08]">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start gap-4 bg-white/[0.015] px-5 py-3.5">
            <dt className="w-36 shrink-0 text-[13px] text-fog">{row.label}</dt>
            <dd className="min-w-0 flex-1 text-[14px] text-ivory">{row.value}</dd>
            <button type="button" onClick={() => onEdit(row.step)} className="shrink-0 text-[12.5px] text-ember-300 transition hover:text-ember-200">
              تعديل
            </button>
          </div>
        ))}
      </dl>
    </div>
  );
}
