import { describe, expect, it } from "vitest";
import { estimateProject } from "@/lib/pricing/estimate";

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
});
