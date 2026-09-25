import { CalendarRange, Clock3, Download, Layers3, Wallet } from "lucide-react";
import { formatDate, formatMoney, formatWeeks } from "@/lib/format";
import { paymentBreakdown, phaseOffsets } from "@/lib/proposals";
import type { Lead, Proposal } from "@/lib/types";
import { cn } from "@/components/ui/cn";

/**
 * Presentational proposal document for the web (client portal & admin preview).
 * Mirrors the PDF structure so the client sees the same thing everywhere.
 */

const PHASE_COLORS = ["from-ember-400 to-ember-500", "from-ember-300 to-ember-400", "from-iris-400 to-iris-500", "from-glacier-400 to-glacier-500"];

function Paragraphs({ text }: { text: string }) {
  return (
    <div className="space-y-4">
      {text
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((paragraph, index) => (
          <p key={index} className="text-[16px] leading-[1.75] text-ivory/85">
            {paragraph}
          </p>
        ))}
    </div>
  );
}

function SectionHeading({ index, label, title }: { index: number; label: string; title: string }) {
  return (
    <header className="mb-6">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.28em] text-ember-300">
        {String(index).padStart(2, "0")} — {label}
      </p>
      <h2 className="mt-2 font-display text-[28px] leading-tight tracking-tight text-ivory sm:text-[34px]">{title}</h2>
    </header>
  );
}

export function ProposalSummaryCard({ proposal, pdfHref }: { proposal: Proposal; pdfHref: string }) {
  const money = (value: number) => formatMoney(value, proposal.currency);
  return (
    <div className="glass edge-light rounded-3xl p-6">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.26em] text-fog">Total investment</p>
      <p className="mt-2 font-display text-[40px] leading-none tracking-tight text-ivory">{money(proposal.totals.total)}</p>
      {proposal.totals.monthlyTotal > 0 ? (
        <p className="mt-2 text-[13.5px] text-mist">+ {money(proposal.totals.monthlyTotal)}/month ongoing</p>
      ) : null}
      <dl className="mt-6 space-y-3 border-t border-white/[0.07] pt-5 text-[14px]">
        <div className="flex items-center justify-between gap-4">
          <dt className="flex items-center gap-2 text-fog">
            <Clock3 className="size-4" /> Timeline
          </dt>
          <dd className="text-ivory">{formatWeeks(proposal.totals.totalWeeks)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="flex items-center gap-2 text-fog">
            <Layers3 className="size-4" /> Phases
          </dt>
          <dd className="text-ivory">{proposal.phases.length}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="flex items-center gap-2 text-fog">
            <CalendarRange className="size-4" /> Valid until
          </dt>
          <dd className="text-ivory">{formatDate(proposal.validUntil)}</dd>
        </div>
      </dl>
      <a
        href={pdfHref}
        className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-[14px] text-ivory transition hover:border-white/25 hover:bg-white/[0.08]"
      >
        <Download className="size-4" /> Download PDF
      </a>
    </div>
  );
}

export function ProposalView({ proposal, lead }: { proposal: Proposal; lead: Lead }) {
  const money = (value: number) => formatMoney(value, proposal.currency);
  const included = proposal.lineItems.filter((item) => item.included);
  const optional = proposal.lineItems.filter((item) => !item.included);
  const totalWeeks = Math.max(proposal.totals.totalWeeks, 0.5);
  const schedule = paymentBreakdown(proposal.totals.total, proposal.paymentSchedule);
  const gantt = phaseOffsets(proposal.phases);
  const sections = { next: 0 };
  const nextSection = () => ++sections.next;

  return (
    <div className="space-y-6">
      <section className="glass edge-light rounded-[28px] p-6 sm:p-10">
        <SectionHeading index={nextSection()} label="Executive summary" title={`Hello ${lead.contact.company ?? lead.contact.name.split(" ")[0]},`} />
        <Paragraphs text={proposal.executiveSummary} />
        {proposal.approach ? (
          <div className="mt-8 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 sm:p-6">
            <p className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.24em] text-fog">Our approach</p>
            <Paragraphs text={proposal.approach} />
          </div>
        ) : null}
      </section>

      <section className="glass edge-light rounded-[28px] p-6 sm:p-10">
        <SectionHeading index={nextSection()} label="Scope" title="What we'll deliver" />
        <div className="space-y-8">
          {proposal.phases.map((phase, index) => {
            const items = included.filter((item) => item.phase === phase.name);
            if (!items.length) return null;
            return (
              <div key={phase.id}>
                <div className="flex items-baseline justify-between gap-4 border-b border-white/15 pb-3">
                  <h3 className="flex items-center gap-3 font-display text-[21px] text-ivory">
                    <span className={cn("size-2.5 rounded-full bg-gradient-to-br", PHASE_COLORS[index % PHASE_COLORS.length])} />
                    {phase.name}
                  </h3>
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-fog">{formatWeeks(phase.weeks)}</span>
                </div>
                <ul className="divide-y divide-white/[0.06]">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-6 py-4">
                      <div className="min-w-0">
                        <p className="text-[15.5px] font-medium text-ivory">{item.title}</p>
                        {item.description ? <p className="mt-1 text-[14px] leading-relaxed text-mist">{item.description}</p> : null}
                      </div>
                      <p className="shrink-0 font-mono text-[14px] text-ivory/90">
                        {money(item.price)}
                        {item.billing === "monthly" ? <span className="text-fog">/mo</span> : null}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {optional.length ? (
            <div className="rounded-2xl border border-dashed border-white/15 p-5">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.24em] text-glacier-300">Optional add-ons · not included in the total</p>
              <ul className="mt-3 divide-y divide-white/[0.06]">
                {optional.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-6 py-3.5">
                    <div className="min-w-0">
                      <p className="text-[15px] text-ivory">{item.title}</p>
                      {item.description ? <p className="mt-1 text-[13.5px] leading-relaxed text-mist">{item.description}</p> : null}
                    </div>
                    <p className="shrink-0 font-mono text-[13.5px] text-mist">
                      {money(item.price)}
                      {item.billing === "monthly" ? "/mo" : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      <section className="glass edge-light rounded-[28px] p-6 sm:p-10">
        <SectionHeading index={nextSection()} label="Timeline" title={`${formatWeeks(proposal.totals.totalWeeks)} from kickoff to launch`} />
        <div className="space-y-4">
          {gantt.map((phase, index) => (
            <div key={phase.id} className="grid items-center gap-2 sm:grid-cols-[180px_1fr_80px] sm:gap-4">
              <p className="text-[14px] text-ivory">{phase.name}</p>
              <div className="relative h-3 rounded-full bg-white/[0.05]">
                <div
                  className={cn("absolute inset-y-0 rounded-full bg-gradient-to-r shadow-[0_0_20px_-4px_rgb(255_138_76/0.6)]", PHASE_COLORS[index % PHASE_COLORS.length])}
                  style={{ left: `${(phase.start / totalWeeks) * 100}%`, width: `${Math.max((phase.weeks / totalWeeks) * 100, 3)}%` }}
                />
              </div>
              <p className="font-mono text-[12px] text-fog sm:text-right">{formatWeeks(phase.weeks)}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {proposal.phases.map((phase) => (
            <div key={phase.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <p className="font-display text-[17px] text-ivory">{phase.name}</p>
              {phase.summary ? <p className="mt-1.5 text-[14px] leading-relaxed text-mist">{phase.summary}</p> : null}
              {phase.milestones.length ? (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {phase.milestones.map((milestone) => (
                    <li key={milestone} className="rounded-full border border-white/10 px-2.5 py-1 text-[12px] text-ivory/80">
                      {milestone}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="glass edge-light rounded-[28px] p-6 sm:p-10">
        <SectionHeading index={nextSection()} label="Investment" title="Your investment" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-ember-500/[0.12] via-transparent to-glacier-400/[0.06] p-6">
            <dl className="space-y-2.5 text-[14.5px]">
              <div className="flex justify-between">
                <dt className="text-mist">Project subtotal</dt>
                <dd className="font-mono text-ivory">{money(proposal.totals.oneTimeSubtotal)}</dd>
              </div>
              {proposal.totals.discountAmount > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-mist">{proposal.discount?.label ?? "Discount"}</dt>
                  <dd className="font-mono text-glacier-300">− {money(proposal.totals.discountAmount)}</dd>
                </div>
              ) : null}
              {proposal.totals.taxAmount > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-mist">Tax ({proposal.taxRate}%)</dt>
                  <dd className="font-mono text-ivory">{money(proposal.totals.taxAmount)}</dd>
                </div>
              ) : null}
            </dl>
            <div className="mt-5 border-t border-white/10 pt-5">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.24em] text-fog">Total project investment</p>
              <p className="mt-2 font-display text-[44px] leading-none tracking-tight text-ivory">
                <Wallet className="mr-3 inline size-7 -translate-y-1 text-ember-300" strokeWidth={1.5} />
                {money(proposal.totals.total)}
              </p>
              {proposal.totals.monthlyTotal > 0 ? (
                <p className="mt-3 text-[14px] text-mist">Plus {money(proposal.totals.monthlyTotal)} per month in ongoing services.</p>
              ) : null}
            </div>
          </div>
          <div>
            <p className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.24em] text-fog">Payment schedule</p>
            <ol className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.08]">
              {schedule.map((milestone, index) => (
                <li key={milestone.label} className="flex items-center gap-4 bg-white/[0.015] px-5 py-4">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full border border-white/10 font-mono text-[12px] text-mist">{index + 1}</span>
                  <span className="flex-1 text-[14.5px] text-ivory">{milestone.label}</span>
                  <span className="font-mono text-[12.5px] text-fog">{milestone.percent}%</span>
                  <span className="w-24 text-right font-mono text-[14px] text-ivory">{money(milestone.amount)}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {proposal.assumptions.length || proposal.nextSteps.length ? (
        <section className="glass edge-light grid gap-8 rounded-[28px] p-6 sm:p-10 lg:grid-cols-2">
          {proposal.assumptions.length ? (
            <div>
              <SectionHeading index={nextSection()} label="Assumptions" title="What this assumes" />
              <ul className="space-y-3">
                {proposal.assumptions.map((assumption) => (
                  <li key={assumption} className="flex gap-3 text-[14.5px] leading-relaxed text-mist">
                    <span className="mt-2.5 h-px w-4 shrink-0 bg-ember-400" />
                    {assumption}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {proposal.nextSteps.length ? (
            <div>
              <SectionHeading index={nextSection()} label="Next steps" title="Let's get started" />
              <ol className="space-y-3">
                {proposal.nextSteps.map((step, index) => (
                  <li key={step} className="flex gap-3 text-[14.5px] leading-relaxed text-ivory/85">
                    <span className="font-mono text-[12px] text-ember-300">0{index + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
          {proposal.notes ? (
            <div className="lg:col-span-2">
              <Paragraphs text={proposal.notes} />
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
