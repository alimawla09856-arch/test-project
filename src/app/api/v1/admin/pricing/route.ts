import { authorize } from "@/lib/auth/guard";
import { getRepository } from "@/lib/db";
import { ApiError, jsonOk, readJson, route } from "@/lib/http";
import { PricingOverridesSchema, resolveFeatures, resolveServices, sanitizeOverrides } from "@/lib/pricing/overrides";

/** GET /api/v1/admin/pricing — current rate card with any admin overrides applied. */
export const GET = route(async (request) => {
  await authorize(request, ["admin"]);
  const overrides = sanitizeOverrides(await getRepository().getPricingOverrides());
  return jsonOk({
    overrides,
    services: resolveServices(overrides).map((s) => ({ key: s.key, name: s.name, price: s.price, weeks: s.weeks, monthly: s.monthly ?? null })),
    features: resolveFeatures(overrides).map((f) => ({ key: f.key, name: f.name, price: f.price, weeks: f.weeks, monthly: f.monthly ?? null })),
  });
});

/** PATCH /api/v1/admin/pricing — replace the stored overrides wholesale. */
export const PATCH = route(async (request) => {
  await authorize(request, ["admin"]);
  const overrides = await readJson(request, PricingOverridesSchema, { maxBytes: 64 * 1024 });
  const clean = sanitizeOverrides(overrides);
  if (!Object.keys(clean.services).length && !Object.keys(clean.features).length && (Object.keys(overrides.services).length || Object.keys(overrides.features).length)) {
    throw new ApiError(422, "invalid_keys", "None of the submitted service/feature keys match the current catalog.");
  }
  await getRepository().savePricingOverrides(clean);
  return jsonOk({ overrides: clean });
});
