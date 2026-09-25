import {
  Defs,
  Document,
  Link,
  Page,
  RadialGradient,
  Rect,
  Stop,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import { brand } from "@/config/brand";
import { formatDate, formatMoney, formatWeeks } from "@/lib/format";
import { paymentBreakdown, phaseOffsets } from "@/lib/proposals";
import type { Lead, Proposal } from "@/lib/types";

/**
 * The client-facing proposal PDF (A4). Rendered on the server with
 * @react-pdf/renderer — see `render.ts` for font registration.
 */

export interface ProposalDocumentProps {
  proposal: Proposal;
  lead: Lead;
  shareUrl: string;
  fonts: { display: string; sans: string };
}

/** A4 in PDF points — the cover art must not exceed the page or it spills onto its own page. */
const A4 = { width: 595.28, height: 841.89 };

const C = {
  ink: brand.colors.ink,
  inkSoft: "#1b1b24",
  paper: "#fbfaf7",
  line: "#e7e2d9",
  muted: "#6f6a63",
  ivory: brand.colors.ivory,
  mist: brand.colors.mist,
  ember: brand.colors.ember,
  emberSoft: brand.colors.emberSoft,
  glacier: brand.colors.glacier,
};

function createStyles(fonts: ProposalDocumentProps["fonts"]) {
  return StyleSheet.create({
    cover: { backgroundColor: C.ink, color: C.ivory, fontFamily: fonts.sans, padding: 0 },
    coverInner: { flex: 1, paddingHorizontal: 56, paddingVertical: 52, justifyContent: "space-between" },
    brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    monogram: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: "#3a3a46",
      alignItems: "center",
      justifyContent: "center",
    },
    monogramText: { fontFamily: fonts.display, fontSize: 13, color: C.ivory },
    brandName: { fontSize: 9, letterSpacing: 2.4, color: C.mist, textTransform: "uppercase" },
    eyebrow: { fontSize: 8.5, letterSpacing: 2.2, color: C.ember, textTransform: "uppercase", marginBottom: 14 },
    coverTitle: { fontFamily: fonts.display, fontSize: 34, lineHeight: 1.12, color: C.ivory, maxWidth: 440 },
    coverFor: { marginTop: 18, fontSize: 11, color: C.mist },
    metaGrid: { flexDirection: "row", flexWrap: "wrap", borderTopWidth: 1, borderTopColor: "#2a2a34", paddingTop: 18 },
    metaCell: { width: "20%", paddingRight: 8 },
    metaLabel: { fontSize: 7, letterSpacing: 1.6, color: "#8d8983", textTransform: "uppercase", marginBottom: 5 },
    metaValue: { fontSize: 10.5, color: C.ivory },

    page: { backgroundColor: C.paper, color: C.ink, fontFamily: fonts.sans, fontSize: 9.5, paddingTop: 54, paddingBottom: 64, paddingHorizontal: 56, lineHeight: 1.5 },
    header: { position: "absolute", top: 24, left: 56, right: 56, flexDirection: "row", justifyContent: "space-between" },
    headerText: { fontSize: 7, letterSpacing: 1.6, color: C.muted, textTransform: "uppercase" },
    footer: { position: "absolute", bottom: 28, left: 56, right: 56, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: C.line, paddingTop: 8 },
    footerText: { fontSize: 7, color: C.muted },

    section: { marginBottom: 26 },
    sectionLabel: { fontSize: 7.5, letterSpacing: 1.8, color: C.ember, textTransform: "uppercase", marginBottom: 6 },
    sectionTitle: { fontFamily: fonts.display, fontSize: 19, marginBottom: 10, color: C.ink },
    paragraph: { fontSize: 10, color: "#2c2a27", marginBottom: 8, lineHeight: 1.6 },

    phaseBlock: { marginBottom: 14 },
    phaseHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", borderBottomWidth: 1, borderBottomColor: C.ink, paddingBottom: 4, marginBottom: 2 },
    phaseName: { fontFamily: fonts.display, fontSize: 12 },
    phaseWeeks: { fontSize: 8, color: C.muted, letterSpacing: 1, textTransform: "uppercase" },
    row: { flexDirection: "row", paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: C.line },
    rowMain: { flex: 1, paddingRight: 16 },
    rowTitle: { fontSize: 10, fontWeight: 600, color: C.ink },
    rowDescription: { fontSize: 8.5, color: C.muted, marginTop: 2 },
    rowPrice: { width: 90, textAlign: "right", fontSize: 10 },
    tag: { fontSize: 6.5, letterSpacing: 1, textTransform: "uppercase", color: C.ember, marginTop: 3 },

    ganttRow: { flexDirection: "row", alignItems: "center", marginBottom: 7 },
    ganttLabel: { width: 130, fontSize: 8.5, color: "#2c2a27" },
    ganttTrack: { flex: 1, height: 12, backgroundColor: "#efebe4", borderRadius: 6, position: "relative" },
    ganttBar: { position: "absolute", top: 0, height: 12, borderRadius: 6, backgroundColor: C.ember },
    ganttWeeks: { width: 58, textAlign: "right", fontSize: 8, color: C.muted },

    totalsCard: { backgroundColor: C.ink, color: C.ivory, borderRadius: 10, padding: 20, marginTop: 4 },
    totalsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
    totalsLabel: { fontSize: 9, color: C.mist },
    totalsValue: { fontSize: 9.5, color: C.ivory },
    totalsBig: { fontFamily: fonts.display, fontSize: 28, color: C.ivory, marginTop: 6 },
    scheduleRow: { flexDirection: "row", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.line },

    bullet: { flexDirection: "row", marginBottom: 5 },
    bulletMark: { width: 14, color: C.ember },
    bulletText: { flex: 1, fontSize: 9.5, color: "#2c2a27" },
    acceptBox: { borderWidth: 1, borderColor: C.ink, borderRadius: 10, padding: 18, marginTop: 8 },
    acceptLink: { color: C.ember, textDecoration: "none", fontSize: 10 },
  });
}

type Styles = ReturnType<typeof createStyles>;

function Section({ index, label, title, styles, children }: { index: number; label: string; title: string; styles: Styles; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View wrap={false}>
        <Text style={styles.sectionLabel}>{`${String(index).padStart(2, "0")} — ${label}`}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Paragraphs({ text, styles }: { text: string; styles: Styles }) {
  return (
    <>
      {text
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((paragraph, i) => (
          <Text key={i} style={styles.paragraph}>
            {paragraph}
          </Text>
        ))}
    </>
  );
}

export function ProposalDocument({ proposal, lead, shareUrl, fonts }: ProposalDocumentProps) {
  const styles = createStyles(fonts);
  const money = (value: number) => formatMoney(value, proposal.currency);
  const client = lead.contact.company ?? lead.contact.name;
  const included = proposal.lineItems.filter((item) => item.included);
  const optional = proposal.lineItems.filter((item) => !item.included);
  const totalWeeks = Math.max(proposal.totals.totalWeeks, 0.5);
  const schedule = paymentBreakdown(proposal.totals.total, proposal.paymentSchedule);
  const gantt = phaseOffsets(proposal.phases);
  const sections = { next: 0 };
  const nextSection = () => ++sections.next;

  const chrome = (
    <>
      <View style={styles.header} fixed>
        <Text style={styles.headerText}>{brand.name}</Text>
        <Text style={styles.headerText}>{`Proposal · ${lead.reference}`}</Text>
      </View>
      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>{`${proposal.title} · v${proposal.version}`}</Text>
        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </View>
    </>
  );

  return (
    <Document title={`${proposal.title} — ${brand.name}`} author={brand.name} subject={`Proposal ${lead.reference}`} creator={brand.name}>
      {/* Cover */}
      <Page size="A4" style={styles.cover}>
        <Svg style={{ position: "absolute", top: 0, left: 0 }} width={A4.width} height={A4.height} fixed>
          <Defs>
            <RadialGradient id="ember" cx="0.15" cy="0.2" r="0.6">
              <Stop offset="0" stopColor={C.ember} stopOpacity={0.45} />
              <Stop offset="1" stopColor={C.ink} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="glacier" cx="0.95" cy="0.85" r="0.55">
              <Stop offset="0" stopColor={C.glacier} stopOpacity={0.28} />
              <Stop offset="1" stopColor={C.ink} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={A4.width} height={A4.height} fill="url(#ember)" />
          <Rect x={0} y={0} width={A4.width} height={A4.height} fill="url(#glacier)" />
        </Svg>
        <View style={styles.coverInner}>
          <View style={styles.brandRow}>
            <View style={styles.monogram}>
              <Text style={styles.monogramText}>{brand.monogram}</Text>
            </View>
            <Text style={styles.brandName}>{brand.name}</Text>
          </View>
          <View>
            <Text style={styles.eyebrow}>Project proposal</Text>
            <Text style={styles.coverTitle}>{proposal.title}</Text>
            <Text style={styles.coverFor}>{`Prepared for ${lead.contact.name}${lead.contact.company ? ` · ${lead.contact.company}` : ""}`}</Text>
          </View>
          <View style={styles.metaGrid}>
            {[
              ["Reference", lead.reference],
              ["Issued", formatDate(proposal.approvedAt ?? proposal.createdAt)],
              ["Valid until", formatDate(proposal.validUntil)],
              ["Investment", money(proposal.totals.total)],
              ["Timeline", formatWeeks(proposal.totals.totalWeeks)],
            ].map(([label, value]) => (
              <View key={label} style={styles.metaCell}>
                <Text style={styles.metaLabel}>{label}</Text>
                <Text style={styles.metaValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>
      </Page>

      {/* Body */}
      <Page size="A4" style={styles.page} wrap>
        {chrome}

        <Section index={nextSection()} label="Executive summary" title={`Hello ${client},`} styles={styles}>
          <Paragraphs text={proposal.executiveSummary} styles={styles} />
        </Section>

        {proposal.approach ? (
          <Section index={nextSection()} label="Our approach" title="How we'll work together" styles={styles}>
            <Paragraphs text={proposal.approach} styles={styles} />
          </Section>
        ) : null}

        <Section index={nextSection()} label="Scope" title="Deliverables" styles={styles}>
          {proposal.phases.map((phase) => {
            const items = included.filter((item) => item.phase === phase.name);
            if (!items.length) return null;
            return (
              <View key={phase.id} style={styles.phaseBlock}>
                <View style={styles.phaseHeader} wrap={false}>
                  <Text style={styles.phaseName}>{phase.name}</Text>
                  <Text style={styles.phaseWeeks}>{formatWeeks(phase.weeks)}</Text>
                </View>
                {items.map((item) => (
                  <View key={item.id} style={styles.row} wrap={false}>
                    <View style={styles.rowMain}>
                      <Text style={styles.rowTitle}>{item.title}</Text>
                      {item.description ? <Text style={styles.rowDescription}>{item.description}</Text> : null}
                    </View>
                    <Text style={styles.rowPrice}>{item.billing === "monthly" ? `${money(item.price)}/mo` : money(item.price)}</Text>
                  </View>
                ))}
              </View>
            );
          })}
          {included.filter((item) => !proposal.phases.some((p) => p.name === item.phase)).map((item) => (
            <View key={item.id} style={styles.row} wrap={false}>
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                {item.description ? <Text style={styles.rowDescription}>{item.description}</Text> : null}
              </View>
              <Text style={styles.rowPrice}>{item.billing === "monthly" ? `${money(item.price)}/mo` : money(item.price)}</Text>
            </View>
          ))}
          {optional.length ? (
            <View style={{ marginTop: 10 }}>
              <View style={styles.phaseHeader} wrap={false}>
                <Text style={styles.phaseName}>Optional add-ons</Text>
                <Text style={styles.phaseWeeks}>Not included in total</Text>
              </View>
              {optional.map((item) => (
                <View key={item.id} style={styles.row} wrap={false}>
                  <View style={styles.rowMain}>
                    <Text style={styles.rowTitle}>{item.title}</Text>
                    {item.description ? <Text style={styles.rowDescription}>{item.description}</Text> : null}
                    <Text style={styles.tag}>Optional</Text>
                  </View>
                  <Text style={styles.rowPrice}>{item.billing === "monthly" ? `${money(item.price)}/mo` : money(item.price)}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </Section>

        <Section index={nextSection()} label="Timeline" title={`${formatWeeks(proposal.totals.totalWeeks)} from kickoff to launch`} styles={styles}>
          <View wrap={false}>
            {gantt.map((phase) => (
              <View key={phase.id} style={styles.ganttRow}>
                <Text style={styles.ganttLabel}>{phase.name}</Text>
                <View style={styles.ganttTrack}>
                  <View
                    style={[
                      styles.ganttBar,
                      { left: `${(phase.start / totalWeeks) * 100}%`, width: `${Math.max((phase.weeks / totalWeeks) * 100, 3)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.ganttWeeks}>{formatWeeks(phase.weeks)}</Text>
              </View>
            ))}
          </View>
          {proposal.phases.map((phase) =>
            phase.summary ? (
              <View key={phase.id} style={styles.bullet} wrap={false}>
                <Text style={styles.bulletMark}>—</Text>
                <Text style={styles.bulletText}>
                  <Text style={{ fontWeight: 600 }}>{`${phase.name}. `}</Text>
                  {phase.summary}
                  {phase.milestones.length ? ` Milestones: ${phase.milestones.join(", ")}.` : ""}
                </Text>
              </View>
            ) : null,
          )}
        </Section>

        <Section index={nextSection()} label="Investment" title="Your investment" styles={styles}>
          <View style={styles.totalsCard} wrap={false}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Project subtotal</Text>
              <Text style={styles.totalsValue}>{money(proposal.totals.oneTimeSubtotal)}</Text>
            </View>
            {proposal.totals.discountAmount > 0 ? (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>{proposal.discount?.label ?? "Discount"}</Text>
                <Text style={styles.totalsValue}>{`− ${money(proposal.totals.discountAmount)}`}</Text>
              </View>
            ) : null}
            {proposal.totals.taxAmount > 0 ? (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>{`Tax (${proposal.taxRate}%)`}</Text>
                <Text style={styles.totalsValue}>{money(proposal.totals.taxAmount)}</Text>
              </View>
            ) : null}
            <Text style={[styles.totalsLabel, { marginTop: 8 }]}>Total project investment</Text>
            <Text style={styles.totalsBig}>{money(proposal.totals.total)}</Text>
            {proposal.totals.monthlyTotal > 0 ? (
              <Text style={[styles.totalsLabel, { marginTop: 6 }]}>{`Plus ${money(proposal.totals.monthlyTotal)} per month in ongoing services`}</Text>
            ) : null}
          </View>
          <View style={{ marginTop: 14 }} wrap={false}>
            <Text style={[styles.sectionLabel, { marginBottom: 4 }]}>Payment schedule</Text>
            {schedule.map((milestone) => (
              <View key={milestone.label} style={styles.scheduleRow}>
                <Text style={{ flex: 1 }}>{milestone.label}</Text>
                <Text style={{ width: 50, textAlign: "right", color: C.muted }}>{`${milestone.percent}%`}</Text>
                <Text style={{ width: 90, textAlign: "right" }}>{money(milestone.amount)}</Text>
              </View>
            ))}
          </View>
        </Section>

        {proposal.assumptions.length ? (
          <Section index={nextSection()} label="Assumptions" title="What this proposal assumes" styles={styles}>
            {proposal.assumptions.map((assumption, i) => (
              <View key={i} style={styles.bullet} wrap={false}>
                <Text style={styles.bulletMark}>—</Text>
                <Text style={styles.bulletText}>{assumption}</Text>
              </View>
            ))}
          </Section>
        ) : null}

        <Section index={nextSection()} label="Next steps" title="Let's get started" styles={styles}>
          {proposal.nextSteps.map((step, i) => (
            <View key={i} style={styles.bullet} wrap={false}>
              <Text style={styles.bulletMark}>{`${i + 1}.`}</Text>
              <Text style={styles.bulletText}>{step}</Text>
            </View>
          ))}
          {proposal.notes ? <Paragraphs text={proposal.notes} styles={styles} /> : null}
          <View style={styles.acceptBox} wrap={false}>
            <Text style={{ fontFamily: fonts.display, fontSize: 13, marginBottom: 6 }}>Ready to go?</Text>
            <Text style={styles.paragraph}>
              {`Review and accept this proposal online before ${formatDate(proposal.validUntil)}. Questions? Write to ${brand.contactEmail}.`}
            </Text>
            <Link src={shareUrl} style={styles.acceptLink}>
              {shareUrl}
            </Link>
          </View>
        </Section>
      </Page>
    </Document>
  );
}
