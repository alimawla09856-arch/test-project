"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/Button";

const MARKERS = [
  { value: "≈ 5 دقائق", label: "لمشاركة تفاصيل مشروعك" },
  { value: "مباشر", label: "تقدير أولي فوري" },
  { value: "بشري", label: "مراجعة العرض" },
];

export function Hero() {
  const reduce = useReducedMotion();
  const item = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 28, filter: "blur(10px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <section className="relative mx-auto max-w-6xl px-5 pb-16 pt-14 sm:px-8 sm:pt-20 lg:pb-24">
      <motion.p {...item(0.05)} className="font-mono text-[11px] uppercase tracking-[0.32em] text-ember-300">
        مُصمّم المشاريع <span className="text-fog">·</span> عروض مدعومة بالذكاء الاصطناعي
      </motion.p>
      <h1 className="mt-6 max-w-5xl font-display text-[40px] leading-[1.15] tracking-normal text-ivory sm:text-[60px] lg:text-[74px]">
        <motion.span {...item(0.12)} className="block">
          أخبرنا عمّا تريد بناءه.
        </motion.span>
        <motion.span {...item(0.24)} className="block text-ember-gradient">
          وسنعدّ لك المخطط.
        </motion.span>
      </h1>
      <motion.p {...item(0.36)} className="mt-7 max-w-2xl text-[17px] leading-relaxed text-mist sm:text-[19px]">
        أجب عن بضعة أسئلة، ويقوم مساعدنا بإعداد نطاق عمل وجدول زمني وعرض استثمار مخصص لك — يراجعه استراتيجي قبل أن يصلك.
      </motion.p>
      <motion.div {...item(0.48)} className="mt-10 flex flex-wrap items-center gap-3">
        <a href="#builder">
          <Button size="lg">
            <ArrowDown className="size-4" /> ابدأ تفاصيل مشروعك
          </Button>
        </a>
        <a href="#how-it-works">
          <Button size="lg" variant="ghost">
            كيف تعمل الخدمة
          </Button>
        </a>
      </motion.div>
      <motion.dl {...item(0.6)} className="mt-16 grid max-w-3xl grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.06]">
        {MARKERS.map((marker) => (
          <div key={marker.label} className="flex flex-col bg-ink-950/60 px-4 py-4 backdrop-blur-sm sm:px-6">
            <dt className="order-2 mt-1 text-[12px] text-fog sm:text-[13px]">{marker.label}</dt>
            <dd className="font-display text-[22px] tracking-tight text-ivory sm:text-[28px]">{marker.value}</dd>
          </div>
        ))}
      </motion.dl>
    </section>
  );
}
