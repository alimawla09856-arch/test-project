import { getRepository } from "@/lib/db";
import { jsonOk, route } from "@/lib/http";
import { EMPTY_OVERRIDES, sanitizeOverrides } from "@/lib/pricing/overrides";

/**
 * GET /api/v1/catalog — public. Current price overrides (admin-set in
 * Settings → Pricing), so the client-side Project Builder's live estimate
 * matches whatever an admin has configured instead of the bundled
 * catalog.ts defaults. Numbers only — safe to expose publicly.
 */
export const GET = route(async () => {
  let overrides = EMPTY_OVERRIDES;
  try {
    overrides = sanitizeOverrides(await getRepository().getPricingOverrides());
  } catch (error) {
    console.error("[catalog] failed to load pricing overrides, serving defaults", error);
  }
  return jsonOk({ overrides }, { headers: { "Cache-Control": "no-store, max-age=0" } });
});
