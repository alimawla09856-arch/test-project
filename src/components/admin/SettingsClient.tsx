"use client";

import { Check, Copy, Database, PlugZap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

export function CopyBlock({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed — select the text manually.");
    }
  };
  return (
    <div className="group relative">
      {label ? <p className="mb-1.5 text-[12px] text-fog">{label}</p> : null}
      <pre className="overflow-x-auto rounded-xl border border-white/[0.08] bg-ink-950/70 p-3.5 pr-12 font-mono text-[12px] leading-relaxed text-ivory/85">{value}</pre>
      <button onClick={copy} aria-label="Copy" className="absolute bottom-2.5 right-2.5 rounded-lg border border-white/10 bg-ink-850 p-1.5 text-mist transition hover:text-ivory">
        {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  );
}

export function TestWebhookButton({ target, disabled }: { target: "leadIntake" | "analysis" | "dispatch" | "crmSync"; disabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/v1/admin/test-webhook", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target }) });
      const body = await response.json();
      if (body.ok) toast.success(`n8n answered ${body.status} in ${body.durationMs} ms`);
      else toast.error(body.error ?? body?.error?.message ?? "Delivery failed");
    } catch {
      toast.error("Request failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button size="sm" variant="outline" disabled={disabled} loading={busy} onClick={run}>
      <PlugZap className="size-3.5" /> Test
    </Button>
  );
}

export function SeedDemoButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/v1/admin/demo-seed", { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message ?? "Failed");
      toast.success(`Loaded ${body.created} demo leads`);
      router.push("/admin");
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button size="sm" variant="secondary" loading={busy} onClick={run}>
      <Database className="size-3.5" /> Load demo leads
    </Button>
  );
}
