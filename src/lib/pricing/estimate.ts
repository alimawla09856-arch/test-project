import {
  bundleDiscountRate,
  DELIVERY_PHASES,
  FEATURE_MAP,
  SCALE_MAP,
  SERVICE_MAP,
  TIMELINE_MAP,
  type FeatureKey,
  type LanguageKey,
  type ScaleKey,
  type ServiceKey,
  type TimelineKey,
} from "@/config/catalog";

/**
 * Indicative ("ballpark") estimate computed from the rate card.
 *
 * Pure and deterministic so it can run in the browser (live Blueprint panel),
 * on the server (stored with each lead), and inside tests.
 */

export interface EstimateInput {
  services: readonly ServiceKey[];
  features?: readonly FeatureKey[];
  scale?: ScaleKey;
  timeline?: TimelineKey;
  languages?: readonly LanguageKey[];
}

export interface EstimateLine {
  key: string;
  label: string;
  kind: "service" | "feature" | "adjustment";
  min: number;
  max: number;
}

export interface Estimate {
  min: number;
  max: number;
  monthlyMin: number;
  monthlyMax: number;
  weeksMin: number;
  weeksMax: number;
  discountRate: number;
  lines: EstimateLine[];
  phases: { key: string; name: string; weeks: number }[];
}

const roundTo = (value: number, step: number) => Math.round(value / step) * step;

/**
 * Rate-card ranges span tiny to very large engagements. The indicative estimate
 * quotes the typical band inside each range (scale & urgency are applied as
 * multipliers on top), which keeps the range useful for the client.
 */
const PRICE_BAND = { low: 0.15, high: 0.7 };
const WEEKS_BAND = { low: 0.2, high: 0.75 };
const band = (range: { min: number; max: number }, position: number) => range.min + (range.max - range.min) * position;

export function estimateProject(input: EstimateInput): Estimate {
  const services = [...new Set(input.services)].map((key) => SERVICE_MAP[key]).filter(Boolean);
  const features = [...new Set(input.features ?? [])].map((key) => FEATURE_MAP[key]).filter(Boolean);
  const scale = SCALE_MAP[input.scale ?? "standard"];
  const timeline = TIMELINE_MAP[input.timeline ?? "2-4-months"];
  const extraLanguages = Math.max(0, new Set(input.languages ?? ["en"]).size - 1);

  if (services.length === 0) {
    return {
      min: 0,
      max: 0,
      monthlyMin: 0,
      monthlyMax: 0,
      weeksMin: 0,
      weeksMax: 0,
      discountRate: 0,
      lines: [],
      phases: DELIVERY_PHASES.map((phase) => ({ key: phase.key, name: phase.name, weeks: 0 })),
    };
  }

  const multiplier = scale.priceMultiplier * timeline.priceMultiplier;
  const lines: EstimateLine[] = [];

  for (const service of services) {
    lines.push({
      key: service.key,
      label: service.name,
      kind: "service",
      min: band(service.price, PRICE_BAND.low) * multiplier,
      max: band(service.price, PRICE_BAND.high) * multiplier,
    });
  }
  for (const feature of features) {
    if (feature.price <= 0) continue;
    lines.push({
      key: feature.key,
      label: feature.name,
      kind: "feature",
      min: feature.price * 0.85 * scale.priceMultiplier,
      max: feature.price * 1.15 * scale.priceMultiplier,
    });
  }
  // Localisation effort scales with each extra language beyond the first. If the
  // multilingual feature is already selected it covers the first extra language.
  const billableLanguages = features.some((f) => f.key === "multilingual") ? extraLanguages - 1 : extraLanguages;
  if (billableLanguages > 0) {
    const perLanguage = FEATURE_MAP.multilingual.price * scale.priceMultiplier;
    lines.push({
      key: "extra-languages",
      label: `Localisation (+${billableLanguages} language${billableLanguages > 1 ? "s" : ""})`,
      kind: "adjustment",
      min: perLanguage * 0.8 * billableLanguages,
      max: perLanguage * 1.1 * billableLanguages,
    });
  }

  const discountRate = bundleDiscountRate(services.length);
  let min = lines.reduce((sum, line) => sum + line.min, 0) * (1 - discountRate);
  let max = lines.reduce((sum, line) => sum + line.max, 0) * (1 - discountRate);
  min = roundTo(min, 100);
  max = Math.max(min, roundTo(max, 100));

  const monthlyMin = roundTo(
    services.reduce((sum, s) => sum + (s.monthly?.min ?? 0), 0) +
      features.reduce((sum, f) => sum + (f.monthly ?? 0), 0),
    10,
  );
  const monthlyMax = roundTo(
    services.reduce((sum, s) => sum + (s.monthly?.max ?? 0), 0) +
      features.reduce((sum, f) => sum + (f.monthly ?? 0), 0),
    10,
  );

  // Services run as parallel tracks: the longest one sets the pace and each
  // additional track adds ~30% of its own duration for coordination.
  const byLength = [...services].sort((a, b) => b.weeks.max - a.weeks.max);
  const [lead, ...others] = byLength;
  const featureWeeks = features.reduce((sum, f) => sum + f.weeks, 0) * 0.6;
  const weeksFactor = scale.weeksMultiplier * timeline.weeksMultiplier;
  const weeksAt = (range: { min: number; max: number }, position: number) => band(range, position);
  const rawMin =
    (weeksAt(lead.weeks, WEEKS_BAND.low) +
      others.reduce((s, o) => s + weeksAt(o.weeks, WEEKS_BAND.low) * 0.3, 0) +
      featureWeeks * 0.8) *
    weeksFactor;
  const rawMax =
    (weeksAt(lead.weeks, WEEKS_BAND.high) +
      others.reduce((s, o) => s + weeksAt(o.weeks, WEEKS_BAND.high) * 0.3, 0) +
      featureWeeks) *
    weeksFactor;
  const weeksMin = Math.max(1, Math.round(rawMin));
  const weeksMax = Math.max(weeksMin, Math.round(rawMax));

  const midWeeks = (weeksMin + weeksMax) / 2;
  const phases = DELIVERY_PHASES.map((phase) => ({
    key: phase.key,
    name: phase.name,
    weeks: Math.max(0.5, Math.round(midWeeks * phase.share * 2) / 2),
  }));

  return {
    min,
    max,
    monthlyMin,
    monthlyMax,
    weeksMin,
    weeksMax,
    discountRate,
    lines: lines.map((line) => ({ ...line, min: roundTo(line.min, 50), max: roundTo(line.max, 50) })),
    phases,
  };
}
