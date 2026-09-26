import Link from "next/link";
import { brand } from "@/config/brand";
import { cn } from "./cn";

export function Monogram({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-grid size-9 place-items-center rounded-full border border-white/15 bg-white/[0.04] font-display text-[15px] font-medium tracking-tight text-ivory shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]",
        className,
      )}
    >
      <span className="font-soft">{brand.monogram}</span>
      <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-ember-500 shadow-[0_0_12px_rgb(255_138_76/0.9)]" />
    </span>
  );
}

export function Logo({ href = "/", className, subtitle }: { href?: string; className?: string; subtitle?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-3", className)}>
      <Monogram />
      <span className="flex flex-col leading-none">
        <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-ivory">{brand.name}</span>
        {subtitle ? <span className="mt-1 text-[11px] text-fog">{subtitle}</span> : null}
      </span>
    </Link>
  );
}
