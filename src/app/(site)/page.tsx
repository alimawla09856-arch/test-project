import { ProjectBuilder } from "@/components/builder/ProjectBuilder";
import { Hero } from "@/components/site/Hero";
import { HowItWorks } from "@/components/site/HowItWorks";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";

export default function HomePage() {
  return (
    <main className="relative">
      <SiteHeader />
      <Hero />
      <section id="builder" aria-label="Project builder" className="mx-auto max-w-6xl scroll-mt-6 px-3 sm:px-8">
        <ProjectBuilder variant="page" />
      </section>
      <HowItWorks />
      <SiteFooter />
    </main>
  );
}
