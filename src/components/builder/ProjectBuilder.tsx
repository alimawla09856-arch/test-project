"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { estimateProject } from "@/lib/pricing/estimate";
import type { LeadSubmissionInput } from "@/lib/schemas/lead";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import { Blueprint, MobileBlueprint } from "./Blueprint";
import { STEPS, toSubmission, useBuilderDraft, validateStep } from "./state";
import { ContactStep, PlanStep, ReviewStep, ScopeStep, ServicesStep, VisionStep } from "./steps";
import { SuccessScreen, type SubmissionResult } from "./SuccessScreen";

export type BuilderVariant = "page" | "embed";

/** Pull attribution from the page URL (the embed loader forwards the host page's UTMs & URL). */
function readAttribution(variant: BuilderVariant): LeadSubmissionInput["meta"] {
  if (typeof window === "undefined") return { source: variant === "embed" ? "embed" : "builder" };
  const params = new URLSearchParams(window.location.search);
  const utm = Object.fromEntries(
    (["source", "medium", "campaign", "term", "content"] as const)
      .map((key) => [key, params.get(`utm_${key}`)?.slice(0, 200)])
      .filter(([, value]) => value),
  );
  return {
    source: variant === "embed" ? "embed" : "builder",
    utm,
    referrer: (params.get("ref") ?? document.referrer)?.slice(0, 500) || undefined,
    landingPage: (params.get("page") ?? window.location.href).slice(0, 500),
    embedOrigin: params.get("origin")?.slice(0, 200) || undefined,
    locale: navigator.language?.slice(0, 20),
  };
}

function postToHost(message: Record<string, unknown>) {
  if (typeof window === "undefined" || window.parent === window) return;
  const origin = new URLSearchParams(window.location.search).get("origin") || "*";
  window.parent.postMessage({ source: "asd-builder", ...message }, origin);
}

export function ProjectBuilder({ variant = "page" }: { variant?: BuilderVariant }) {
  const { draft, update, reset, restored, dismissRestored } = useBuilderDraft();
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const startedAt = useRef<number>(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const estimate = useMemo(
    () =>
      estimateProject({
        services: draft.project.services,
        features: draft.project.features,
        scale: draft.project.scale,
        timeline: draft.plan.timeline || undefined,
        languages: draft.project.languages,
      }),
    [draft.project.services, draft.project.features, draft.project.scale, draft.plan.timeline, draft.project.languages],
  );

  // Embed: keep the host iframe sized to the content.
  useEffect(() => {
    if (variant !== "embed" || !rootRef.current) return;
    const observer = new ResizeObserver(([entry]) => postToHost({ type: "asd:resize", height: Math.ceil(entry.contentRect.height) + 32 }));
    observer.observe(rootRef.current);
    postToHost({ type: "asd:ready" });
    return () => observer.disconnect();
  }, [variant]);

  const step = STEPS[stepIndex];
  const isReview = step.key === "review";

  const scrollToPanel = () => {
    if (variant === "embed") postToHost({ type: "asd:scroll-top" });
    else panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goTo = (index: number) => {
    setDirection(index > stepIndex ? 1 : -1);
    setErrors({});
    setStepIndex(index);
    scrollToPanel();
  };

  const next = () => {
    if (step.key !== "review") {
      const stepErrors = validateStep(draft, step.key);
      if (Object.keys(stepErrors).length) {
        setErrors(stepErrors);
        return;
      }
    }
    goTo(Math.min(stepIndex + 1, STEPS.length - 1));
  };

  const submit = async () => {
    // Validate everything once more and jump to the first incomplete step.
    for (let i = 0; i < STEPS.length - 1; i++) {
      const key = STEPS[i].key;
      if (key === "review") continue;
      const stepErrors = validateStep(draft, key);
      if (Object.keys(stepErrors).length) {
        goTo(i);
        setErrors(stepErrors);
        toast.error("A few details need your attention.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = toSubmission(draft, { meta: readAttribution(variant), _hp: honeypot || undefined, _t: startedAt.current || undefined });
      const response = await fetch("/api/v1/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 429) toast.error("You've submitted a few briefs already — please try again in a few minutes.");
        else toast.error(body?.error?.message ?? "We couldn't submit your brief. Please try again.");
        return;
      }
      setResult({ reference: body.reference, estimate: body.estimate, name: draft.contact.name.split(" ")[0] ?? "" });
      postToHost({ type: "asd:submitted", reference: body.reference });
      reset();
      scrollToPanel();
    } catch {
      toast.error("Network error — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // A render function (not a nested component) so inputs keep focus across renders.
  const renderStep = () => {
    const props = { draft, update, errors };
    switch (step.key) {
      case "services":
        return <ServicesStep {...props} />;
      case "vision":
        return <VisionStep {...props} />;
      case "scope":
        return <ScopeStep {...props} />;
      case "plan":
        return <PlanStep {...props} />;
      case "contact":
        return <ContactStep {...props} />;
      default:
        return <ReviewStep draft={draft} onEdit={goTo} />;
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div ref={rootRef} className={cn("relative", variant === "embed" ? "p-3 sm:p-5" : "")}>
        <AnimatePresence mode="wait">
          {result ? (
            <SuccessScreen key="success" result={result} variant={variant} onRestart={() => { setResult(null); setStepIndex(0); }} />
          ) : (
            <motion.div key="builder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -12 }} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
              <div ref={panelRef} className="glass edge-light scroll-mt-8 rounded-[28px] p-5 sm:p-8">
                {/* Progress */}
                <nav aria-label="Brief progress" className="mb-8">
                  <ol className="flex items-center gap-1.5">
                    {STEPS.map((item, index) => (
                      <li key={item.key} className="flex-1">
                        <button
                          type="button"
                          disabled={index > stepIndex}
                          onClick={() => goTo(index)}
                          aria-current={index === stepIndex ? "step" : undefined}
                          className="group block w-full text-left disabled:cursor-not-allowed"
                        >
                          <span className="relative block h-1 overflow-hidden rounded-full bg-white/[0.08]">
                            <motion.span
                              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-ember-400 to-ember-300"
                              initial={false}
                              animate={{ width: index < stepIndex ? "100%" : index === stepIndex ? "55%" : "0%" }}
                              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            />
                          </span>
                          <span
                            className={cn(
                              "mt-2 hidden font-mono text-[10px] uppercase tracking-[0.18em] transition-colors md:block",
                              index === stepIndex ? "text-ivory" : index < stepIndex ? "text-mist group-hover:text-ivory" : "text-fog/60",
                            )}
                          >
                            {item.label}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ol>
                </nav>

                {restored && stepIndex === 0 ? (
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-glacier-400/20 bg-glacier-400/[0.06] px-4 py-3 text-[13.5px] text-glacier-200">
                    <span>Welcome back — we restored your draft brief.</span>
                    <span className="flex gap-2">
                      <button type="button" onClick={dismissRestored} className="text-glacier-300 hover:text-glacier-200">
                        Continue
                      </button>
                      <span className="text-glacier-400/40">·</span>
                      <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-mist hover:text-ivory">
                        <RotateCcw className="size-3" /> Start over
                      </button>
                    </span>
                  </div>
                ) : null}

                <AnimatePresence mode="wait" custom={direction} initial={false}>
                  <motion.section
                    key={step.key}
                    custom={direction}
                    initial={{ opacity: 0, x: direction * 36, filter: "blur(6px)" }}
                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, x: direction * -36, filter: "blur(6px)" }}
                    transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                    aria-labelledby={`step-${step.key}-title`}
                  >
                    <header className="mb-7">
                      <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-ember-300">
                        Step {String(stepIndex + 1).padStart(2, "0")} <span className="text-fog">/ {String(STEPS.length).padStart(2, "0")}</span>
                      </p>
                      <h2 id={`step-${step.key}-title`} className="mt-3 font-display text-[30px] leading-[1.08] tracking-tight text-ivory sm:text-[38px]">
                        {step.title}
                      </h2>
                      <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-mist">{step.subtitle}</p>
                    </header>
                    {renderStep()}
                  </motion.section>
                </AnimatePresence>

                {/* Honeypot — hidden from people and assistive tech. */}
                <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-px w-px overflow-hidden">
                  <label>
                    Company website
                    <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} name="company_website" />
                  </label>
                </div>

                <footer className="mt-10 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-6">
                  <Button variant="ghost" onClick={() => goTo(stepIndex - 1)} disabled={stepIndex === 0} className={cn(stepIndex === 0 && "invisible")}>
                    <ArrowLeft className="size-4" /> Back
                  </Button>
                  {isReview ? (
                    <Button size="lg" onClick={submit} loading={submitting}>
                      <Sparkles className="size-4" /> Submit my brief
                    </Button>
                  ) : (
                    <Button size="lg" onClick={next}>
                      Continue <ArrowRight className="size-4" />
                    </Button>
                  )}
                </footer>
              </div>

              <div className="hidden lg:block">
                <div className="sticky top-6">
                  <Blueprint draft={draft} estimate={estimate} />
                </div>
              </div>
              <MobileBlueprint draft={draft} estimate={estimate} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
