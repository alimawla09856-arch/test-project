import { FileCheck2, MessagesSquare, PenLine, Workflow } from "lucide-react";

const STEPS = [
  {
    icon: PenLine,
    title: "شارك تفاصيل مشروعك",
    body: "اختر الخدمات، صف أهدافك، وحدّد ميزانية وجدولاً زمنياً واقعياً. مخططك المباشر يسعّر ذلك أولاً بأول.",
  },
  {
    icon: Workflow,
    title: "تحديد النطاق بالذكاء الاصطناعي",
    body: "يقوم مساعدنا بمطابقة تفاصيل مشروعك مع قائمة أسعارنا: التسليمات، المراحل، المخاطر، والاستثمار الموصى به.",
  },
  {
    icon: MessagesSquare,
    title: "مراجعة استراتيجية",
    body: "يصقل استراتيجي النطاق والتسعير والجدول الزمني — لا شيء يصلك دون مراجعة بشرية.",
  },
  {
    icon: FileCheck2,
    title: "الموافقة والانطلاق",
    body: "استلم عرضاً متقناً مع ملف PDF ورابط خاص يمكنك من خلاله المراجعة والموافقة أونلاين.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-10 px-5 pt-28 sm:px-8">
      <div className="max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-ember-300">كيف تعمل الخدمة</p>
        <h2 className="text-balance-safe mt-4 font-display text-[32px] leading-[1.3] text-ivory sm:text-[44px]">
          من الفكرة الأولى إلى خطة معتمدة، <span className="text-ember-gradient">دون جولات لا تنتهي من التواصل.</span>
        </h2>
      </div>
      <ol className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <li key={step.title} className="glass edge-light group relative rounded-3xl p-6 transition-transform duration-500 ease-out-expo hover:-translate-y-1">
            <span className="flex items-center justify-between">
              <span className="grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-ember-300">
                <step.icon className="size-5" strokeWidth={1.6} />
              </span>
              <span className="font-display text-[44px] leading-none text-white/[0.07] transition-colors group-hover:text-ember-400/20">
                0{index + 1}
              </span>
            </span>
            <h3 className="mt-8 font-display text-[21px] tracking-tight text-ivory">{step.title}</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-mist">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
