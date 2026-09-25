import { FileCheck2, MessagesSquare, PenLine, Workflow } from "lucide-react";

const STEPS = [
  {
    icon: PenLine,
    title: "Share your brief",
    body: "Pick services, describe your goals and set a realistic budget and timeline. Your live blueprint prices it as you go.",
  },
  {
    icon: Workflow,
    title: "AI-assisted scoping",
    body: "Our studio assistant maps the brief onto our rate card: deliverables, phases, risks and a recommended investment.",
  },
  {
    icon: MessagesSquare,
    title: "Strategist review",
    body: "A strategist sharpens the scope, pricing and timeline — nothing reaches you without a human sign-off.",
  },
  {
    icon: FileCheck2,
    title: "Accept & kick off",
    body: "Receive a polished proposal with a PDF and a private link where you can review and accept online.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-10 px-5 pt-28 sm:px-8">
      <div className="max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-ember-300">How it works</p>
        <h2 className="text-balance-safe mt-4 font-display text-[36px] leading-[1.05] tracking-tight text-ivory sm:text-[52px]">
          From first idea to a signed&#8209;off plan, <span className="font-wonk italic text-ember-gradient">without the endless back&#8209;and&#8209;forth.</span>
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
