"use client";

import { motion } from "framer-motion";
import { CalendarClock, CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { brand } from "@/config/brand";
import { Button } from "@/components/ui/Button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/Field";

type Status = "open" | "accepted" | "declined" | "expired" | "preview";

export function ProposalResponse({
  token,
  status,
  clientName,
  respondedName,
}: {
  token: string;
  status: Status;
  clientName: string;
  respondedName?: string | null;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"accept" | "decline">("accept");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === "accepted") {
    return (
      <div className="glass edge-light rounded-[28px] p-7 text-center sm:p-10">
        <CheckCircle2 className="mx-auto size-10 text-success" strokeWidth={1.5} />
        <h2 className="mt-4 font-display text-[30px] tracking-tight text-ivory">Proposal accepted — welcome aboard.</h2>
        <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-mist">
          {respondedName ? `Accepted by ${respondedName}. ` : ""}We&apos;ll be in touch shortly to schedule the kickoff and share the detailed plan.
        </p>
        {brand.bookingUrl ? (
          <a href={brand.bookingUrl} target="_blank" rel="noreferrer" className="mt-6 inline-block">
            <Button size="lg">
              <CalendarClock className="size-4" /> Book the kickoff call
            </Button>
          </a>
        ) : null}
      </div>
    );
  }
  if (status === "declined") {
    return (
      <div className="glass rounded-[28px] p-7 text-center sm:p-10">
        <XCircle className="mx-auto size-9 text-mist" strokeWidth={1.5} />
        <h2 className="mt-4 font-display text-[26px] tracking-tight text-ivory">Thanks for letting us know.</h2>
        <p className="mx-auto mt-2 max-w-md text-[15px] text-mist">
          If anything changes, reply to our email or write to {brand.contactEmail} — we&apos;d be glad to revisit the scope.
        </p>
      </div>
    );
  }
  if (status === "expired") {
    return (
      <div className="glass rounded-[28px] p-7 text-center sm:p-10">
        <h2 className="font-display text-[26px] tracking-tight text-ivory">This proposal has expired</h2>
        <p className="mx-auto mt-2 max-w-md text-[15px] text-mist">Pricing and availability may have changed. Contact {brand.contactEmail} for an updated version.</p>
      </div>
    );
  }

  const submit = async () => {
    setError(null);
    if (name.trim().length < 2) return setError("Please type your full name to confirm.");
    if (mode === "accept" && !agree) return setError("Please confirm you agree to the scope and terms.");
    if (status === "preview") return toast.info("Preview mode — the client will respond from their own link.");
    setSubmitting(true);
    try {
      const response = await fetch(`/api/v1/portal/${token}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: mode === "accept" ? "accepted" : "declined", name, note: note || null, agree }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body?.error?.message ?? "Something went wrong — please try again.");
        return;
      }
      toast.success(mode === "accept" ? "Proposal accepted. Thank you!" : "Response sent. Thank you.");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.section
      id="respond"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="glass edge-light scroll-mt-8 rounded-[28px] p-6 sm:p-10"
    >
      <p className="font-mono text-[10.5px] uppercase tracking-[0.28em] text-ember-300">Your decision</p>
      <h2 className="mt-2 font-display text-[30px] leading-tight tracking-tight text-ivory sm:text-[36px]">Ready to move forward, {clientName}?</h2>
      <div className="mt-6 inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1 text-[14px]">
        {(["accept", "decline"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={`rounded-lg px-4 py-2 transition ${mode === value ? "bg-white/10 text-ivory" : "text-mist hover:text-ivory"}`}
          >
            {value === "accept" ? "Accept proposal" : "Decline"}
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="respond-name">Type your full name to sign</Label>
          <Input id="respond-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </div>
        <div>
          <Label htmlFor="respond-note" optional>
            {mode === "accept" ? "Anything we should know before kickoff?" : "What could we do differently?"}
          </Label>
          <Textarea id="respond-note" className="min-h-12" rows={1} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>
      {mode === "accept" ? (
        <label className="mt-5 flex cursor-pointer items-start gap-3 text-[14px] leading-relaxed text-mist">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 size-4 accent-[var(--color-ember-500)]" />
          I confirm the scope, timeline and investment described in this proposal and authorise {brand.name} to begin preparing the kickoff.
        </label>
      ) : null}
      <FieldError message={error} />
      <div className="mt-7 flex flex-wrap items-center gap-3">
        <Button size="lg" variant={mode === "accept" ? "primary" : "outline"} loading={submitting} onClick={submit}>
          {mode === "accept" ? "Accept & sign" : "Send response"}
        </Button>
        <p className="text-[12.5px] text-fog">Your response is timestamped and shared with the {brand.shortName} team.</p>
      </div>
    </motion.section>
  );
}
