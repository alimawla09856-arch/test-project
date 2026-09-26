"use client";

import { Loader2, RotateCcw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Field";

/**
 * Settings → Pricing. Edits are stored server-side (Settings → Pricing API,
 * persisted via the repository) and take effect immediately for the live
 * builder estimate and any new proposal (AI or rule-based) — no redeploy.
 *
 * Not reflected here: proposals already sent (their line items are frozen at
 * the price when they were created — intentional, so a client's proposal
 * never changes under them), and n8n's own copy of the rate card if
 * ANALYSIS_RUNNER=n8n (that's a build-time snapshot — see README).
 */

interface Range {
  min: number;
  max: number;
}
interface ServiceRow {
  key: string;
  name: string;
  price: Range;
  weeks: Range;
  monthly: Range | null;
}
interface FeatureRow {
  key: string;
  name: string;
  price: number;
  weeks: number;
  monthly: number | null;
}

function NumberField({ value, onChange, step = 1 }: { value: number; onChange: (value: number) => void; step?: number }) {
  return (
    <input
      type="number"
      min={0}
      step={step}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(e.target.valueAsNumber || 0)}
      className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[13px] text-ivory outline-none transition focus:border-ember-400/60"
    />
  );
}

function RangeField({ label, value, onChange, step = 1 }: { label: string; value: Range; onChange: (value: Range) => void; step?: number }) {
  return (
    <div>
      <Label className="mb-1 text-[10.5px]">{label}</Label>
      <div className="flex items-center gap-1.5">
        <NumberField value={value.min} step={step} onChange={(min) => onChange({ ...value, min })} />
        <span className="text-fog">–</span>
        <NumberField value={value.max} step={step} onChange={(max) => onChange({ ...value, max })} />
      </div>
    </div>
  );
}

export function PricingSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [features, setFeatures] = useState<FeatureRow[]>([]);

  const load = () => {
    fetch("/api/v1/admin/pricing")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load pricing");
        return res.json();
      })
      .then((body) => {
        setServices(body.services);
        setFeatures(body.features);
      })
      .catch(() => toast.error("Couldn't load pricing — please refresh."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const overrides = {
        services: Object.fromEntries(
          services.map((s) => [s.key, { price: s.price, weeks: s.weeks, ...(s.monthly ? { monthly: s.monthly } : {}) }]),
        ),
        features: Object.fromEntries(
          features.map((f) => [f.key, { price: f.price, weeks: f.weeks, ...(f.monthly !== null ? { monthly: f.monthly } : {}) }]),
        ),
      };
      const response = await fetch("/api/v1/admin/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(overrides),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error?.message ?? "Save failed");
      toast.success("Pricing updated — new briefs use these rates immediately.");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    setResetting(true);
    try {
      const response = await fetch("/api/v1/admin/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services: {}, features: {} }),
      });
      if (!response.ok) throw new Error("Reset failed");
      toast.success("Reverted to the catalog.ts defaults.");
      load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-[13.5px] text-mist">
        <Loader2 className="size-4 animate-spin" /> Loading current rates…
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2.5">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-fog">Services</p>
        {services.map((service) => (
          <div key={service.key} className="grid items-end gap-3 rounded-xl border border-white/[0.06] bg-white/[0.015] p-3 sm:grid-cols-[minmax(0,140px)_1fr_1fr_1fr]">
            <p className="truncate text-[13.5px] text-ivory" title={service.name}>
              {service.name}
            </p>
            <RangeField label="Price ($)" value={service.price} onChange={(price) => setServices((prev) => prev.map((s) => (s.key === service.key ? { ...s, price } : s)))} step={50} />
            <RangeField label="Weeks" value={service.weeks} onChange={(weeks) => setServices((prev) => prev.map((s) => (s.key === service.key ? { ...s, weeks } : s)))} step={0.5} />
            {service.monthly ? (
              <RangeField
                label="Monthly ($)"
                value={service.monthly}
                onChange={(monthly) => setServices((prev) => prev.map((s) => (s.key === service.key ? { ...s, monthly } : s)))}
                step={10}
              />
            ) : (
              <span />
            )}
          </div>
        ))}
      </div>

      <div className="space-y-2.5">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-fog">Feature add-ons</p>
        {features.map((feature) => (
          <div key={feature.key} className="grid items-end gap-3 rounded-xl border border-white/[0.06] bg-white/[0.015] p-3 sm:grid-cols-[minmax(0,140px)_1fr_1fr_1fr]">
            <p className="truncate text-[13.5px] text-ivory" title={feature.name}>
              {feature.name}
            </p>
            <div>
              <Label className="mb-1 text-[10.5px]">Price ($)</Label>
              <NumberField value={feature.price} step={50} onChange={(price) => setFeatures((prev) => prev.map((f) => (f.key === feature.key ? { ...f, price } : f)))} />
            </div>
            <div>
              <Label className="mb-1 text-[10.5px]">Weeks</Label>
              <NumberField value={feature.weeks} step={0.5} onChange={(weeks) => setFeatures((prev) => prev.map((f) => (f.key === feature.key ? { ...f, weeks } : f)))} />
            </div>
            {feature.monthly !== null ? (
              <div>
                <Label className="mb-1 text-[10.5px]">Monthly ($)</Label>
                <NumberField value={feature.monthly} step={10} onChange={(monthly) => setFeatures((prev) => prev.map((f) => (f.key === feature.key ? { ...f, monthly } : f)))} />
              </div>
            ) : (
              <span />
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-4">
        <Button onClick={save} loading={saving}>
          <Save className="size-4" /> Save pricing
        </Button>
        <Button variant="ghost" onClick={resetToDefaults} loading={resetting}>
          <RotateCcw className="size-4" /> Reset to catalog.ts defaults
        </Button>
        <p className="text-[12px] text-fog">Applies to new briefs and proposals immediately. Already-sent proposals keep their original prices.</p>
      </div>
    </div>
  );
}
