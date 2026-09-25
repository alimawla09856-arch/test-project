import { cn } from "./cn";

/**
 * Atmosphere layer: drifting aurora light, a faint architectural grid and film
 * grain. Pure CSS (server component); motion is disabled for reduced-motion users.
 */
export function Backdrop({ className, intensity = "full" }: { className?: string; intensity?: "full" | "soft" }) {
  return (
    <div aria-hidden className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink-950", className)}>
      <div
        className="absolute -left-[20%] -top-[25%] h-[75vh] w-[75vw] animate-drift-a rounded-full opacity-60 blur-[120px]"
        style={{ background: "radial-gradient(closest-side, rgb(255 138 76 / 0.55), rgb(240 106 44 / 0.12) 60%, transparent)" }}
      />
      <div
        className="absolute -bottom-[30%] -right-[15%] h-[80vh] w-[70vw] animate-drift-b rounded-full opacity-50 blur-[130px]"
        style={{ background: "radial-gradient(closest-side, rgb(45 212 191 / 0.4), rgb(45 212 191 / 0.08) 60%, transparent)" }}
      />
      {intensity === "full" ? (
        <div
          className="absolute left-[35%] top-[20%] h-[55vh] w-[45vw] animate-drift-c rounded-full blur-[140px]"
          style={{ background: "radial-gradient(closest-side, rgb(139 123 255 / 0.35), transparent)" }}
        />
      ) : null}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgb(255 255 255 / 0.5) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.5) 1px, transparent 1px)",
          backgroundSize: "96px 96px",
          maskImage: "radial-gradient(ellipse at 50% 30%, black 20%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 30%, black 20%, transparent 75%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.16] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink-950 to-transparent" />
    </div>
  );
}
