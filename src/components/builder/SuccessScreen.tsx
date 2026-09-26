"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, CalendarClock, FileText, ScanSearch, Sparkles } from "lucide-react";
import { brand } from "@/config/brand";
import { CURRENCY } from "@/config/catalog";
import { formatRange } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import type { BuilderVariant } from "./ProjectBuilder";

export interface SubmissionResult {
  reference: string;
  name: string;
  estimate?: { min: number; max: number; weeksMin: number; weeksMax: number };
}

const NEXT_STEPS = [
  { icon: ScanSearch, title: "تحليل النطاق", body: "يقوم مساعدنا بمطابقة تفاصيل مشروعك مع التسليمات والمراحل وقائمة أسعارنا." },
  { icon: FileText, title: "مراجعة استراتيجية", body: "يصقل استراتيجي النطاق والاستثمار قبل إرسال أي شيء." },
  { icon: Sparkles, title: "عرضك الخاص", body: "تستلم عرضاً مصمّماً لك مع ملف PDF ورابط للموافقة أونلاين." },
];

export function SuccessScreen({ result, variant, onRestart }: { result: SubmissionResult; variant: BuilderVariant; onRestart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="glass edge-light relative mx-auto max-w-3xl overflow-hidden rounded-[32px] p-7 text-center sm:p-12"
      role="status"
      aria-live="polite"
    >
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-64 w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember-500/25 blur-[90px]" />

      <svg viewBox="0 0 72 72" className="relative mx-auto size-[72px]" aria-hidden>
        <motion.circle
          cx="36"
          cy="36"
          r="33"
          fill="none"
          stroke="url(#check-gradient)"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
        />
        <motion.path
          d="M23 37.5 32 46 50 27"
          fill="none"
          stroke="#f4f1ea"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="check-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffc59a" />
            <stop offset="1" stopColor="#5eead4" />
          </linearGradient>
        </defs>
      </svg>

      <p className="relative mt-6 font-mono text-[11px] uppercase tracking-[0.3em] text-ember-300">تم استلام ملخص مشروعك</p>
      <h2 className="relative mt-3 font-display text-[30px] leading-tight text-ivory sm:text-[40px]">
        شكراً لك{result.name ? ` ${result.name}` : ""}. <span className="text-ember-gradient">نحن نعمل على الأمر.</span>
      </h2>
      <p className="relative mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-mist">
        ملخص مشروعك وصل إلى الاستوديو. سنرسل لك عرضاً مخصصاً عبر البريد الإلكتروني بعد مراجعة استراتيجي له — احتفظ برقمك المرجعي إن أردت
        التواصل معنا بالمثل.
      </p>

      <div className="relative mt-7 inline-flex flex-wrap items-center justify-center gap-3">
        <span dir="ltr" className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 font-mono text-[15px] tracking-[0.18em] text-ivory">{result.reference}</span>
        {result.estimate && result.estimate.max > 0 ? (
          <span className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-[14px] text-mist">
            تقديرياً {formatRange(result.estimate.min, result.estimate.max, CURRENCY)} · {result.estimate.weeksMin}–{result.estimate.weeksMax} أسابيع
          </span>
        ) : null}
      </div>

      <ol className="relative mt-10 grid gap-3 text-start sm:grid-cols-3">
        {NEXT_STEPS.map((item, index) => (
          <motion.li
            key={item.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 + index * 0.12, duration: 0.5 }}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4"
          >
            <span className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-fog">
              <item.icon className="size-3.5 text-ember-300" /> 0{index + 1}
            </span>
            <p className="mt-2 font-display text-[17px] text-ivory">{item.title}</p>
            <p className="mt-1 text-[13px] leading-snug text-mist">{item.body}</p>
          </motion.li>
        ))}
      </ol>

      <div className="relative mt-9 flex flex-wrap justify-center gap-3">
        {brand.bookingUrl ? (
          <a href={brand.bookingUrl} target="_blank" rel="noreferrer">
            <Button size="lg">
              <CalendarClock className="size-4" /> احجز مكالمة تعريفية
            </Button>
          </a>
        ) : null}
        {variant === "page" ? (
          <a href={brand.siteUrl}>
            <Button size="lg" variant="secondary">
              <ArrowUpRight className="size-4" /> العودة إلى {brand.shortName}
            </Button>
          </a>
        ) : null}
        <Button size="lg" variant="ghost" onClick={onRestart}>
          إرسال ملخص مشروع آخر
        </Button>
      </div>
    </motion.div>
  );
}
