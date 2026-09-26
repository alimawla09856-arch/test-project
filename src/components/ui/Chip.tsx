"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "./cn";

export function Chip({
  selected,
  onToggle,
  children,
  icon,
  disabled,
  className,
}: {
  selected: boolean;
  onToggle: () => void;
  children: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "group inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13.5px] transition-all duration-300 ease-out-expo active:scale-[0.97] disabled:opacity-40",
        selected
          ? "border-ember-400/60 bg-ember-500/15 text-ivory shadow-[0_0_24px_-8px_rgb(255_138_76/0.8)]"
          : "border-white/10 bg-white/[0.03] text-mist hover:border-white/25 hover:text-ivory",
        className,
      )}
    >
      <span
        className={cn(
          "grid size-4 place-items-center rounded-full border transition-all",
          selected ? "border-ember-400 bg-ember-400 text-ink-950" : "border-white/25",
        )}
      >
        {selected ? <Check className="size-3" strokeWidth={3} /> : null}
      </span>
      {icon}
      {children}
    </button>
  );
}
