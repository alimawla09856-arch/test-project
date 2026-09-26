import { describe, expect, it } from "vitest";
import { estimateProject } from "@/lib/pricing/estimate";
import { resolveFeatureMap, resolveServiceMap, sanitizeOverrides } from "@/lib/pricing/overrides";

describe("estimateProject", () => {
  it("returns zeros without services", () => {
    const e = estimateProject({ services: [] });
    expect(e.min).toBe(0);
    expect(e.max).toBe(0);
  });

  it("produces an ordered range rounded to 100 and positive weeks", () => {
    const e = estimateProject({ services: ["web-design"] });
    expect(e.min).toBeGreaterThan(0);
    expect(e.max).toBeGreaterThanOrEqual(e.min);
    expect(e.min % 100).toBe(0);
    expect(e.weeksMin).toBeGreaterThanOrEqual(1);
    expect(e.weeksMax).toBeGreaterThanOrEqual(e.weeksMin);
  });

  it("applies a bundle discount and scale/urgency multipliers", () => {
    const one = estimateProject({ services: ["web-design"] });
    const two = estimateProject({ services: ["web-design", "brand-identity"] });
    expect(two.discountRate).toBe(0.05);
    expect(two.max).toBeGreaterThan(one.max);
    const rush = estimateProject({ services: ["web-design"], timeline: "asap" });
    expect(rush.min).toBeGreaterThan(one.min);
    expect(rush.weeksMax).toBeLessThanOrEqual(one.weeksMax);
    const enterprise = estimateProject({ services: ["web-design"], scale: "enterprise" });
    expect(enterprise.min).toBeGreaterThan(one.min);
  });

  it("charges for extra languages beyond the multilingual feature", () => {
    const base = estimateProject({ services: ["web-design"], features: ["multilingual"], languages: ["en", "ar"] });
    const three = estimateProject({ services: ["web-design"], features: ["multilingual"], languages: ["en", "ar", "fr"] });
    expect(three.lines.some((l) => l.key === "extra-languages")).toBe(true);
    expect(base.lines.some((l) => l.key === "extra-languages")).toBe(false);
    expect(three.min).toBeGreaterThan(base.min);
  });

  it("dedupes repeated services", () => {
    expect(estimateProject({ services: ["web-design", "web-design"] })).toEqual(estimateProject({ services: ["web-design"] }));
  });

  it("applies admin price overrides to the live estimate", () => {
    const base = estimateProject({ services: ["web-design"] });
    const overridden = estimateProject({ services: ["web-design"] }, { services: { "web-design": { price: { min: 100, max: 200 } } }, features: {} });
    expect(overridden.max).toBeLessThan(base.max);
  });

  it("leaves the estimate unchanged when overrides are empty or unrelated", () => {
    const base = estimateProject({ services: ["web-design"] });
    expect(estimateProject({ services: ["web-design"] }, { services: {}, features: {} })).toEqual(base);
    expect(estimateProject({ services: ["web-design"] }, { services: { "ai-automation": { price: { min: 1, max: 2 } } }, features: {} })).toEqual(base);
  });
});

describe("pricing overrides", () => {
  it("resolveServiceMap / resolveFeatureMap apply only the overridden fields", () => {
    const overrides = sanitizeOverrides({ services: { "web-design": { price: { min: 111, max: 222 } } }, features: { cms: { price: 999 } } });
    const services = resolveServiceMap(overrides);
    expect(services["web-design"].price).toEqual({ min: 111, max: 222 });
    expect(services["brand-identity"].price).not.toEqual({ min: 111, max: 222 });

    const features = resolveFeatureMap(overrides);
    expect(features.cms.price).toBe(999);
    expect(features.cms.weeks).toBeGreaterThan(0); // untouched field keeps its catalog.ts default
  });

  it("sanitizeOverrides drops keys that don't match the current catalog", () => {
    const clean = sanitizeOverrides({ services: { "not-a-real-service": { price: { min: 1, max: 2 } } }, features: {} });
    expect(clean.services).toEqual({});
  });

  it("sanitizeOverrides handles null/undefined", () => {
    expect(sanitizeOverrides(null)).toEqual({ services: {}, features: {} });
    expect(sanitizeOverrides(undefined)).toEqual({ services: {}, features: {} });
  });
});
