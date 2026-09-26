import Link from "next/link";
import { brand } from "@/config/brand";
import { cn } from "./cn";

export function Monogram({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-block size-9 overflow-hidden rounded-xl border border-white/15 shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- small fixed-size brand mark, not worth next/image's overhead */}
      <img src={brand.logoPath} alt={brand.owner} className="size-full object-cover" />
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
