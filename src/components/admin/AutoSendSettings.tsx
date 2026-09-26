"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/Switch";

/**
 * Settings → Automation. Toggles whether a freshly generated proposal is
 * approved and dispatched to the client immediately (no admin review step)
 * or left in "review" for manual "Approve & send", same as before.
 */
export function AutoSendSettings() {
  const [loading, setLoading] = useState(true);
  const [autoSend, setAutoSend] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/v1/admin/settings")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load settings");
        return res.json();
      })
      .then((body) => setAutoSend(Boolean(body.autoSend)))
      .catch(() => toast.error("Couldn't load automation settings — please refresh."))
      .finally(() => setLoading(false));
  }, []);

  const update = async (next: boolean) => {
    setAutoSend(next);
    setSaving(true);
    try {
      const response = await fetch("/api/v1/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoSend: next }),
      });
      if (!response.ok) throw new Error("Save failed");
      toast.success(next ? "Proposals will now send to clients automatically." : "Proposals now wait for your manual approval.");
    } catch (error) {
      setAutoSend(!next);
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-[13.5px] text-mist">Loading…</p>;

  return (
    <Switch
      id="auto-send"
      checked={autoSend}
      onChange={update}
      label={saving ? "Saving…" : "Auto-send proposals"}
      description="Skip manual review — email/WhatsApp the client the moment a proposal is ready. Turn off to go back to Approve & send."
    />
  );
}
