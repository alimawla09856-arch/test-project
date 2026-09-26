import { ArrowUpRight } from "lucide-react";
import { brand } from "@/config/brand";
import { Logo } from "@/components/ui/Logo";
import { WhatsAppButton } from "./WhatsAppButton";

export function SiteHeader() {
  return (
    <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
      <Logo subtitle="Studio platform" />
      <nav className="flex items-center gap-1 text-[13.5px]">
        <a href="#how-it-works" className="hidden rounded-full px-3 py-2 text-mist transition hover:text-ivory sm:inline-block">
          How it works
        </a>
        <WhatsAppButton />
        <a
          href={brand.siteUrl}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-mist transition hover:border-white/25 hover:text-ivory"
        >
          {new URL(brand.siteUrl).host.replace(/^www\./, "")} <ArrowUpRight className="size-3.5" />
        </a>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative mx-auto mt-24 max-w-6xl px-5 pb-28 sm:px-8 lg:pb-12">
      <div className="flex flex-col gap-6 border-t border-white/[0.07] pt-8 text-[13px] text-fog sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {brand.name}
          {brand.location ? ` · ${brand.location}` : ""}
        </p>
        <p className="max-w-md leading-relaxed">
          Your brief is used only to prepare and discuss your proposal. Questions? <a className="text-mist underline-offset-4 hover:text-ivory hover:underline" href={`mailto:${brand.contactEmail}`}>{brand.contactEmail}</a>
        </p>
      </div>
    </footer>
  );
}
