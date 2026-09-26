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
  INDUSTRIES,
  LANGUAGES,
  PROJECT_TYPES,
  SCALES,
  SERVICES,
  SERVICE_MAP,
  TIMELINES,
  labelFor,
  type FeatureKey,
} from "@/config/catalog";
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

export function ServicesStep({ draft, update, errors }: StepProps) {
  const onPointerMove = useSpotlight();
  const selected = draft.project.services;
  return (
    <div className="space-y-8">
      <Segmented
        ariaLabel="Project type"
        value={draft.project.type}
        onChange={(type) => update("project", { type })}
        options={PROJECT_TYPES}
      />
      <div>
        <SectionLabel hint={selected.length ? `${selected.length} selected` : "Select one or more"}>Services</SectionLabel>
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" role="group" aria-label="Services">
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
                  "spotlight group relative flex min-h-[148px] flex-col rounded-2xl border p-4 text-left transition-all duration-300 ease-out-expo active:scale-[0.985]",
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
                <span className="mt-4 font-display text-[19px] leading-tight tracking-tight text-ivory">{service.name}</span>
                <span className="mt-1 text-[13px] leading-snug text-mist">{service.tagline}</span>
                <span className="mt-auto pt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-fog">
                  from {formatMoney(service.price.min, CURRENCY, { compact: true })}
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
          <Label htmlFor="project-name" optional>
            Project name
          </Label>
          <Input
            id="project-name"
            placeholder="e.g. Flagship website relaunch"
            value={project.name}
            maxLength={120}
            onChange={(e) => update("project", { name: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="industry" optional>
            Industry
          </Label>
          <Input
            id="industry"
            list="industries"
            placeholder="Start typing…"
            value={project.industry}
            maxLength={80}
            onChange={(e) => update("project", { industry: e.target.value })}
          />
          <datalist id="industries">
            {INDUSTRIES.map((industry) => (
              <option key={industry} value={industry} />
            ))}
          </datalist>
        </div>
      </div>

      <div>
        <Label htmlFor="description">What are you looking to achieve?</Label>
        <Textarea
          id="description"
          rows={6}
          invalid={Boolean(errors.description)}
          aria-describedby="description-hint description-error"
          placeholder="Tell us about your business, who it serves, what's not working today and what success looks like in six months…"
          value={project.description}
          maxLength={5000}
          onChange={(e) => update("project", { description: e.target.value })}
        />
        <div className="flex items-start justify-between gap-4">
          <FieldError id="description-error" message={errors.description} />
          <span id="description-hint" className={cn("ml-auto mt-2 font-mono text-[11px]", length >= 30 ? "text-glacier-400" : "text-fog")}>
            {length < 30 ? `${30 - length} more characters` : `${length} characters ✓`}
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
        <SectionLabel hint="Optional">Primary goals</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {GOALS.map((goal) => (
            <Chip key={goal.key} selected={project.goals.includes(goal.key)} onToggle={() => update("project", { goals: toggle(project.goals, goal.key) })}>
              {goal.label}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="audience" optional>
          Who is it for?
        </Label>
        <Input
          id="audience"
          placeholder="e.g. Boutique hotel owners across the Gulf"
          value={project.audience}
          maxLength={300}
          onChange={(e) => update("project", { audience: e.target.value })}
        />
      </div>

      <div>
        <SectionLabel hint="Optional">References you love</SectionLabel>
        <div className="space-y-2">
          {project.references.map((reference, index) => (
            <div key={index} className="flex gap-2">
              <Input
                aria-label={`Reference link ${index + 1}`}
                placeholder="https://"
                inputMode="url"
                value={reference}
                invalid={Boolean(errors[`references.${index}`])}
                onChange={(e) => setReference(index, e.target.value)}
              />
              {project.references.length > 1 ? (
                <button
                  type="button"
                  aria-label="Remove reference"
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
              <Plus className="size-3.5" /> Add another link
            </button>
          ) : null}
        </div>
      </div>

      <div>
        <SectionLabel hint="Optional">What do you already have?</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {ASSETS.map((asset) => (
            <Chip key={asset.key} selected={project.assets.includes(asset.key)} onToggle={() => update("project", { assets: toggle(project.assets, asset.key) })}>
              {asset.label}
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
        <SectionLabel hint={related.size ? "Recommended for your services first" : undefined}>Capabilities</SectionLabel>
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
                  "spotlight flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all duration-300",
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
                    {feature.name}
                    {related.has(feature.key) ? (
                      <span className="rounded-full bg-glacier-400/10 px-1.5 py-px font-mono text-[9.5px] uppercase tracking-wider text-glacier-300">Fit</span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] leading-snug text-fog">{feature.description}</span>
                </span>
                <span className="shrink-0 font-mono text-[11px] text-mist">
                  {feature.price > 0 ? `+${formatMoney(feature.price, CURRENCY, { compact: true })}` : `${formatMoney(feature.monthly ?? 0, CURRENCY)}/mo`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <SectionLabel>How ambitious is it?</SectionLabel>
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4" role="radiogroup" aria-label="Project scale">
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
                  "rounded-2xl border p-4 text-left transition-all duration-300",
                  active ? "border-ember-400/55 bg-ember-500/[0.1]" : "border-white/[0.08] bg-white/[0.02] hover:border-white/20",
                )}
              >
                <span className="flex gap-1" aria-hidden>
                  {SCALES.map((_, i) => (
                    <span key={i} className={cn("h-1 w-5 rounded-full", i <= index ? (active ? "bg-ember-400" : "bg-mist/60") : "bg-white/10")} />
                  ))}
                </span>
                <span className="mt-3 block font-display text-[17px] text-ivory">{scale.name}</span>
                <span className="mt-1 block text-[12.5px] leading-snug text-fog">{scale.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <SectionLabel>Languages</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((language) => (
            <Chip
              key={language.key}
              selected={project.languages.includes(language.key)}
              onToggle={() => update("project", { languages: toggle(project.languages, language.key) })}
            >
              {language.label}
            </Chip>
          ))}
        </div>
        <FieldError message={errors.languages} />
        {project.languages.includes("ar") ? <Hint>Arabic layouts are designed right-to-left from the start — not mirrored as an afterthought.</Hint> : null}
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
        <SectionLabel>Investment range</SectionLabel>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4" role="radiogroup" aria-label="Budget">
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
                  "rounded-2xl border px-4 py-4 text-left transition-all duration-300",
                  budget.key === "not-sure" && "col-span-2 sm:col-span-1",
                  active
                    ? "border-ember-400/55 bg-ember-500/[0.12] shadow-[0_14px_40px_-22px_rgb(255_138_76/0.9)]"
                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/20",
                )}
              >
                <span className={cn("font-display text-[18px] tracking-tight", active ? "text-ivory" : "text-mist")}>{budget.label}</span>
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
            label="The budget is flexible for the right solution"
            description="We'll include an optional scope that goes beyond the range."
          />
        </div>
      </div>

      <div>
        <SectionLabel>Timeline</SectionLabel>
        <div className="grid gap-2.5 sm:grid-cols-5" role="radiogroup" aria-label="Timeline">
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
                  "rounded-2xl border p-4 text-left transition-all duration-300",
                  active ? "border-ember-400/55 bg-ember-500/[0.12]" : "border-white/[0.08] bg-white/[0.02] hover:border-white/20",
                )}
              >
                <span className="block font-display text-[17px] text-ivory">{timeline.label}</span>
                <span className="mt-1 block text-[12px] leading-snug text-fog">{timeline.description}</span>
              </button>
            );
          })}
        </div>
        <FieldError message={errors.timeline} />
      </div>

      <div className="max-w-xs">
        <Label htmlFor="deadline" optional>
          Hard deadline or launch date
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
          <Label htmlFor="contact-name">Full name</Label>
          <Input {...field("name")} autoComplete="name" value={contact.name} onChange={(e) => update("contact", { name: e.target.value })} />
          <FieldError id="contact-name-error" message={errors.name} />
        </div>
        <div>
          <Label htmlFor="contact-email">Work email</Label>
          <Input {...field("email")} type="email" autoComplete="email" inputMode="email" value={contact.email} onChange={(e) => update("contact", { email: e.target.value })} />
          <FieldError id="contact-email-error" message={errors.email} />
        </div>
        <div>
          <Label htmlFor="contact-company" optional>
            Company
          </Label>
          <Input {...field("company")} autoComplete="organization" value={contact.company} onChange={(e) => update("contact", { company: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="contact-role" optional>
            Your role
          </Label>
          <Input {...field("role")} autoComplete="organization-title" value={contact.role} onChange={(e) => update("contact", { role: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="contact-phone" optional>
            Phone
          </Label>
          <Input {...field("phone")} type="tel" autoComplete="tel" placeholder="+961 …" value={contact.phone} onChange={(e) => update("contact", { phone: e.target.value })} />
          <FieldError id="contact-phone-error" message={errors.phone} />
        </div>
        <div>
          <Label htmlFor="contact-website" optional>
            Current website
          </Label>
          <Input {...field("website")} inputMode="url" placeholder="yourcompany.com" value={contact.website} onChange={(e) => update("contact", { website: e.target.value })} />
          <FieldError id="contact-website-error" message={errors.website} />
        </div>
        <div>
          <Label htmlFor="contact-country" optional>
            Country
          </Label>
          <Input {...field("country")} autoComplete="country-name" value={contact.country} onChange={(e) => update("contact", { country: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="contact-preferred">Preferred way to talk</Label>
          <Select
            id="contact-preferred"
            value={contact.preferredContact}
            onChange={(e) => update("contact", { preferredContact: e.target.value as BuilderDraft["contact"]["preferredContact"] })}
          >
            {CONTACT_METHODS.map((method) => (
              <option key={method.key} value={method.key} className="bg-ink-900">
                {method.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {contact.phone ? (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
          <Switch id="contact-whatsapp" checked={contact.whatsapp} onChange={(whatsapp) => update("contact", { whatsapp })} label="This number is on WhatsApp" />
        </div>
      ) : null}

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
            I agree that {brand.name} may store the details in this brief and contact me about my project. My brief is analysed with AI to
            prepare the proposal; contact details are not shared with AI providers.
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
          <span>Send me occasional studio news and case studies (optional).</span>
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
    { step: 0, label: "Services", value: project.services.map((s) => SERVICE_MAP[s]?.name ?? s).join(" · ") || "—" },
    { step: 0, label: "Project type", value: labelFor(PROJECT_TYPES, project.type) },
    { step: 1, label: "Project", value: project.name || "Untitled" },
    { step: 1, label: "Goals", value: project.goals.map((g) => labelFor(GOALS, g)).join(", ") || "—" },
    { step: 2, label: "Capabilities", value: project.features.map((f) => FEATURES.find((x) => x.key === f)?.name ?? f).join(", ") || "None selected" },
    { step: 2, label: "Scale & languages", value: `${labelFor(SCALES, project.scale)} · ${project.languages.map((l) => labelFor(LANGUAGES, l)).join(", ")}` },
    { step: 3, label: "Budget", value: `${labelFor(BUDGETS, plan.budget)}${plan.budgetFlexible ? " (flexible)" : ""}` },
    { step: 3, label: "Timeline", value: `${labelFor(TIMELINES, plan.timeline)}${plan.deadline ? ` · deadline ${plan.deadline}` : ""}` },
    { step: 4, label: "Contact", value: [contact.name, contact.company, contact.email].filter(Boolean).join(" · ") },
  ];
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.24em] text-fog">Your brief</p>
        <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ivory/90">{project.description || "—"}</p>
      </div>
      <dl className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.08]">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start gap-4 bg-white/[0.015] px-5 py-3.5">
            <dt className="w-36 shrink-0 text-[13px] text-fog">{row.label}</dt>
            <dd className="min-w-0 flex-1 text-[14px] text-ivory">{row.value}</dd>
            <button type="button" onClick={() => onEdit(row.step)} className="shrink-0 text-[12.5px] text-ember-300 transition hover:text-ember-200">
              Edit
            </button>
          </div>
        ))}
      </dl>
    </div>
  );
}
