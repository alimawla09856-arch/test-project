import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "./cn";

export const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-[15px] text-ivory placeholder:text-fog/80 shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] outline-none transition-all duration-300 hover:border-white/20 focus:border-ember-400/60 focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgb(255_138_76/0.12)] aria-[invalid=true]:border-danger/60";

export function Label({ htmlFor, children, optional, className }: { htmlFor?: string; children: ReactNode; optional?: boolean; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-2 flex items-baseline justify-between gap-3 text-[13px] font-medium text-mist", className)}>
      <span>{children}</span>
      {optional ? <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog">Optional</span> : null}
    </label>
  );
}

export function FieldError({ id, message }: { id?: string; message?: string | null }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-2 text-[13px] text-danger">
      {message}
    </p>
  );
}

export function Hint({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("mt-2 text-[12.5px] leading-relaxed text-fog", className)}>{children}</p>;
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function Input({ className, invalid, ...props }, ref) {
    return <input ref={ref} aria-invalid={invalid || undefined} className={cn(inputClass, className)} {...props} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  function Textarea({ className, invalid, ...props }, ref) {
    return <textarea ref={ref} aria-invalid={invalid || undefined} className={cn(inputClass, "min-h-32 resize-y leading-relaxed", className)} {...props} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(
  function Select({ className, invalid, children, ...props }, ref) {
    return (
      <select ref={ref} aria-invalid={invalid || undefined} className={cn(inputClass, "appearance-none bg-[length:16px] bg-[right_14px_center] bg-no-repeat pr-10", className)} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23b3aea7' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }} {...props}>
        {children}
      </select>
    );
  },
);
