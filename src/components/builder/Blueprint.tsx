"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp } from "lucide-react";
import { useState } from "react";
import { CURRENCY, SERVICE_MAP } from "@/config/catalog";
import { DELIVERY_PHASE_NAMES_AR, SERVICE_NAMES_AR } from "@/config/catalog.ar";
import type { Estimate } from "@/lib/pricing/estimate";
import { formatMoney } from "@/lib/format";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { cn } from "@/components/ui/cn";
import type { BuilderDraft } from "./state";

const PHASE_COLORS = ["bg-ember-400", "bg-ember-300", "bg-iris-400", "bg-glacier-400"];

const compact = (value: number) => formatMoney(Math.round(value / 100) * 100, CURRENCY, { compact: true });

function PhaseBar({ estimate }: { estimate: Estimate }) {
  const total = estimate.phases.reduce((s, p) => s + p.weeks, 0) || 1;
  return (
    <div>
      <div className="flex h-2 gap-1 overflow-hidden rounded-full">
        {estimate.phases.map((phase, index) => (
          <motion.span
            key={phase.key}
            layout
            className={cn("h-full rounded-full", PHASE_COLORS[index % PHASE_COLORS.length])}
            style={{ width: `${(phase.weeks / total) * 100}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
          />
        ))}
      </div>
      <div className="mt-2.5 grid grid-cols-4 gap-1">
        {estimate.phases.map((phase, index) => (
          <span key={phase.key} className="flex items-center gap-1.5 text-[10.5px] leading-tight text-fog">
            <span className={cn("size-1.5 shrink-0 rounded-full", PHASE_COLORS[index % PHASE_COLORS.length])} />
            <span className="truncate">{(DELIVERY_PHASE_NAMES_AR[phase.key] ?? phase.name).split(" ")[0]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function BlueprintBody({ draft, estimate }: { draft: BuilderDraft; estimate: Estimate }) {
  const hasServices = draft.project.services.length > 0;
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-fog">المشروع</p>
        <p className="mt-1.5 truncate font-display text-[22px] leading-tight tracking-tight text-ivory">
          {draft.project.name || draft.contact.company || "مشروع بلا عنوان"}
        </p>
        <div className="mt-3 flex min-h-7 flex-wrap gap-1.5">
          <AnimatePresence initial={false}>
            {draft.project.services.map((key) => (
              <motion.span
                key={key}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[12px] text-ivory/90"
              >
                {SERVICE_NAMES_AR[key] ?? SERVICE_MAP[key]?.name ?? key}
              </motion.span>
            ))}
          </AnimatePresence>
          {!hasServices ? <span className="text-[13px] text-fog">اختر الخدمات لبدء المخطط.</span> : null}
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-transparent p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-fog">الاستثمار التقديري</p>
        <p className="mt-2 font-display text-[34px] leading-none tracking-tight text-ivory">
          {hasServices ? (
            <>
              <AnimatedNumber value={estimate.min} format={compact} />
              <span className="mx-1.5 text-fog">–</span>
              <AnimatedNumber value={estimate.max} format={compact} />
            </>
          ) : (
            <span className="text-fog">—</span>
          )}
        </p>
        {estimate.monthlyMax > 0 ? (
          <p className="mt-2 text-[12.5px] text-mist">
            + رسوم اشتراك اختيارية تبدأ من {formatMoney(estimate.monthlyMin, CURRENCY)}/شهرياً
          </p>
        ) : null}
        {estimate.discountRate > 0 ? (
          <p className="mt-1 text-[12.5px] text-glacier-300">يشمل خصم دمج خدمات بنسبة {Math.round(estimate.discountRate * 100)}%</p>
        ) : null}
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-fog">الجدول الزمني</p>
          <p className="font-display text-[18px] text-ivory">
            {hasServices ? `${estimate.weeksMin}–${estimate.weeksMax} أسابيع` : "—"}
          </p>
        </div>
        <div className="mt-3">
          <PhaseBar estimate={estimate} />
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2 text-center">
        {[
          ["الخدمات", draft.project.services.length],
          ["القدرات", draft.project.features.length],
          ["اللغات", draft.project.languages.length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-2 py-2.5">
            <dd className="font-display text-[20px] text-ivory">{value}</dd>
            <dt className="text-[10.5px] uppercase tracking-wider text-fog">{label}</dt>
          </div>
        ))}
      </dl>

      <p className="text-[11.5px] leading-relaxed text-fog">
        نطاق تقديري من قائمة أسعارنا. عرضك مصمّم خصيصاً لمشروعك ويراجعه استراتيجي قبل إرساله.
      </p>
    </div>
  );
}

export function Blueprint({ draft, estimate, className }: { draft: BuilderDraft; estimate: Estimate; className?: string }) {
  return (
    <aside className={cn("glass edge-light rounded-3xl p-6", className)} aria-label="مخطط المشروع المباشر">
      <div className="mb-6 flex items-center justify-between">
        <span className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.28em] text-ember-300">
          <span className="size-1.5 animate-pulse-soft rounded-full bg-ember-400 shadow-[0_0_10px_rgb(255_138_76/0.9)]" />
          المخطط المباشر
        </span>
        <span className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px] tracking-widest text-fog">مسودة</span>
      </div>
      <BlueprintBody draft={draft} estimate={estimate} />
    </aside>
  );
}

/** Compact sticky bar for small screens; expands into a sheet. */
export function MobileBlueprint({ draft, estimate }: { draft: BuilderDraft; estimate: Estimate }) {
  const [open, setOpen] = useState(false);
  const hasServices = draft.project.services.length > 0;
  return (
    <div className="fixed inset-x-3 bottom-3 z-40 lg:hidden">
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass-strong mb-2 max-h-[65vh] overflow-y-auto rounded-3xl p-5"
          >
            <BlueprintBody draft={draft} estimate={estimate} />
          </motion.div>
        ) : null}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="glass-strong flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3"
      >
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-ember-300">
          <span className="size-1.5 animate-pulse-soft rounded-full bg-ember-400" /> المخطط
        </span>
        <span className="font-display text-[17px] text-ivory">
          {hasServices ? `${compact(estimate.min)} – ${compact(estimate.max)}` : "اختر الخدمات"}
        </span>
        <span className="flex items-center gap-1 text-[12px] text-mist">
          {hasServices ? `${estimate.weeksMin}–${estimate.weeksMax} أ` : ""}
          <ChevronUp className={cn("size-4 transition-transform", open && "rotate-180")} />
        </span>
      </button>
    </div>
  );
}
