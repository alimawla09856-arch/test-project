import { z } from "zod";
import {
  FEATURE_KEYS,
  FEATURES,
  SERVICE_KEYS,
  SERVICES,
  type FeatureDefinition,
  type FeatureKey,
  type Range,
  type ServiceDefinition,
  type ServiceKey,
} from "@/config/catalog";

/**
 * Runtime price overrides, editable by an admin from Settings → Pricing.
 *
 * `catalog.ts` stays the shipped default rate card (and the only thing n8n's
 * pre-generated AI workflow embeds — see README). This layer lets an admin
 * override the numbers that actually reach clients — the live builder
 * estimate, new proposals (AI or rule-based) and the AI system prompt —
 * without touching code or redeploying.
 */

const rangeSchema = z.object({ min: z.number().min(0), max: z.number().min(0) }).refine((r) => r.max >= r.min, "max must be ≥ min");

export const ServiceOverrideSchema = z.object({
  price: rangeSchema.optional(),
  weeks: rangeSchema.optional(),
  monthly: rangeSchema.optional(),
});
export type ServiceOverride = z.infer<typeof ServiceOverrideSchema>;

export const FeatureOverrideSchema = z.object({
  price: z.number().min(0).optional(),
  weeks: z.number().min(0).optional(),
  monthly: z.number().min(0).optional(),
});
export type FeatureOverride = z.infer<typeof FeatureOverrideSchema>;

export const PricingOverridesSchema = z.object({
  services: z.record(z.string(), ServiceOverrideSchema).default({}),
  features: z.record(z.string(), FeatureOverrideSchema).default({}),
});
export type PricingOverrides = z.infer<typeof PricingOverridesSchema>;

export const EMPTY_OVERRIDES: PricingOverrides = { services: {}, features: {} };

/** Drops keys that no longer match the current catalog (e.g. a service was renamed/removed). */
export function sanitizeOverrides(overrides: PricingOverrides | null | undefined): PricingOverrides {
  if (!overrides) return EMPTY_OVERRIDES;
  const services = Object.fromEntries(Object.entries(overrides.services ?? {}).filter(([key]) => (SERVICE_KEYS as readonly string[]).includes(key)));
  const features = Object.fromEntries(Object.entries(overrides.features ?? {}).filter(([key]) => (FEATURE_KEYS as readonly string[]).includes(key)));
  return { services, features };
}

export function resolveServices(overrides?: PricingOverrides | null): ServiceDefinition[] {
  if (!overrides?.services || Object.keys(overrides.services).length === 0) return SERVICES;
  return SERVICES.map((service) => {
    const o = overrides.services[service.key];
    if (!o) return service;
    return {
      ...service,
      ...(o.price ? { price: o.price as Range } : {}),
      ...(o.weeks ? { weeks: o.weeks as Range } : {}),
      ...(o.monthly && service.monthly ? { monthly: { ...service.monthly, ...o.monthly } } : {}),
    };
  });
}

export function resolveFeatures(overrides?: PricingOverrides | null): FeatureDefinition[] {
  if (!overrides?.features || Object.keys(overrides.features).length === 0) return FEATURES;
  return FEATURES.map((feature) => {
    const o = overrides.features[feature.key];
    if (!o) return feature;
    return {
      ...feature,
      ...(o.price !== undefined ? { price: o.price } : {}),
      ...(o.weeks !== undefined ? { weeks: o.weeks } : {}),
      ...(o.monthly !== undefined ? { monthly: o.monthly } : {}),
    };
  });
}

export function resolveServiceMap(overrides?: PricingOverrides | null): Record<ServiceKey, ServiceDefinition> {
  return Object.fromEntries(resolveServices(overrides).map((s) => [s.key, s])) as Record<ServiceKey, ServiceDefinition>;
}

export function resolveFeatureMap(overrides?: PricingOverrides | null): Record<FeatureKey, FeatureDefinition> {
  return Object.fromEntries(resolveFeatures(overrides).map((f) => [f.key, f])) as Record<FeatureKey, FeatureDefinition>;
}
