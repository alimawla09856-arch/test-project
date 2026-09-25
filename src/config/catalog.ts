/**
 * AS Design Studio — service catalog & rate card.
 *
 * This file is the single source of truth for everything price-related:
 *   • the Project Builder's live "indicative range" (client side),
 *   • the rule-based estimator used when no AI provider is configured,
 *   • the rate card injected into the AI system prompt (so Claude/OpenAI anchor
 *     their numbers on the studio's real pricing instead of inventing them),
 *   • the n8n workflow templates (regenerate them with `npm run n8n:build`
 *     after editing this file).
 *
 * All amounts are in `CURRENCY`. The figures below are sensible placeholders for a
 * premium studio — replace them with the studio's actual rates before going live.
 *
 * Keep this module free of server-only imports: it is bundled into the browser.
 */

export const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY ?? "USD";

/* ----------------------------------------------------------------------------
 * Services
 * ------------------------------------------------------------------------- */

export const SERVICE_KEYS = [
  "brand-identity",
  "web-design",
  "ecommerce",
  "ui-ux",
  "mobile-app",
  "ai-automation",
  "seo-content",
  "social-media",
  "motion-3d",
] as const;
export type ServiceKey = (typeof SERVICE_KEYS)[number];

/** Icon names map to lucide-react components in `components/builder/icons.tsx`. */
export type CatalogIcon =
  | "gem"
  | "monitor"
  | "shopping-bag"
  | "pen-tool"
  | "smartphone"
  | "bot"
  | "search"
  | "megaphone"
  | "clapperboard";

export interface Range {
  min: number;
  max: number;
}

export interface ServiceDefinition {
  key: ServiceKey;
  name: string;
  tagline: string;
  icon: CatalogIcon;
  /** One-time project fee range. */
  price: Range;
  /** Typical duration range in weeks for this service on its own. */
  weeks: Range;
  /** Optional recurring retainer (per month) commonly attached to this service. */
  monthly?: Range & { label: string };
  /**
   * Typical deliverables, in delivery order (discovery → design → build → launch).
   * Used by the rule-based estimator and as guidance in the AI prompt.
   */
  deliverables: { title: string; description: string }[];
  /** Features most relevant to this service (shown first in the builder). */
  relatedFeatures: FeatureKey[];
}

export const SERVICES: ServiceDefinition[] = [
  {
    key: "brand-identity",
    name: "Brand Identity",
    tagline: "Strategy, naming, logo systems & guidelines",
    icon: "gem",
    price: { min: 2500, max: 8000 },
    weeks: { min: 3, max: 6 },
    deliverables: [
      { title: "Brand strategy workshop & positioning", description: "Workshops and research to define your positioning, audience, personality and messaging pillars." },
      { title: "Logo suite & visual identity system", description: "A primary logo, variations and marks, built into a flexible identity system." },
      { title: "Typography, colour & iconography", description: "A considered type pairing, colour palette and icon style that work across every touchpoint." },
      { title: "Brand guidelines document", description: "A practical guide your team and partners can use to apply the brand consistently." },
    ],
    relatedFeatures: ["copywriting", "content-production"],
  },
  {
    key: "web-design",
    name: "Website Design & Build",
    tagline: "Custom, high-performance marketing sites",
    icon: "monitor",
    price: { min: 4000, max: 15000 },
    weeks: { min: 4, max: 10 },
    monthly: { label: "Care & hosting plan", min: 150, max: 450 },
    deliverables: [
      { title: "Sitemap & UX wireframes", description: "Information architecture, key user journeys and wireframes for every main template." },
      { title: "Responsive UI design", description: "High-fidelity designs for desktop, tablet and mobile, including interaction details." },
      { title: "Front-end & CMS development", description: "A fast, accessible build with reusable components and an editor-friendly CMS." },
      { title: "Performance, SEO foundations & launch", description: "Speed optimisation, technical SEO, analytics setup and a monitored go-live." },
    ],
    relatedFeatures: ["cms", "multilingual", "booking", "blog", "analytics", "crm", "ai-assistant"],
  },
  {
    key: "ecommerce",
    name: "E-commerce",
    tagline: "Shopify, headless & custom storefronts",
    icon: "shopping-bag",
    price: { min: 6000, max: 25000 },
    weeks: { min: 6, max: 12 },
    monthly: { label: "Store care & optimisation", min: 250, max: 800 },
    deliverables: [
      { title: "Store architecture & product catalogue setup", description: "Catalogue structure, product data model, variants and collections planned for growth." },
      { title: "Storefront UI design", description: "Conversion-focused designs for home, collection, product, cart and checkout experiences." },
      { title: "Checkout, payments & shipping configuration", description: "Payment gateways, taxes, shipping zones and transactional emails configured end to end." },
      { title: "Integrations, QA & launch", description: "Inventory, analytics and marketing integrations, full QA and a smooth store launch." },
    ],
    relatedFeatures: ["payments", "multilingual", "accounts", "analytics", "crm", "integrations"],
  },
  {
    key: "ui-ux",
    name: "UI/UX & Product Design",
    tagline: "Research, prototypes & design systems",
    icon: "pen-tool",
    price: { min: 3000, max: 12000 },
    weeks: { min: 3, max: 8 },
    deliverables: [
      { title: "User research & journey mapping", description: "Interviews, analytics review and journey maps that surface the highest-value opportunities." },
      { title: "Wireframes & interactive prototype", description: "Clickable prototypes to validate flows with real users before visual design." },
      { title: "High-fidelity UI design", description: "Polished interface design for every screen and state, ready for development." },
      { title: "Design system & developer handoff", description: "Components, tokens and documentation so your product scales consistently." },
    ],
    relatedFeatures: ["dashboard", "accounts", "analytics"],
  },
  {
    key: "mobile-app",
    name: "Mobile App",
    tagline: "iOS & Android apps, cross-platform",
    icon: "smartphone",
    price: { min: 12000, max: 45000 },
    weeks: { min: 10, max: 20 },
    monthly: { label: "App maintenance & support", min: 400, max: 1200 },
    deliverables: [
      { title: "Product scoping & technical architecture", description: "Feature prioritisation, technical architecture and a release roadmap for version one." },
      { title: "App UX/UI design", description: "Native-feeling designs for iOS and Android, from onboarding to every core flow." },
      { title: "Cross-platform development & API", description: "A cross-platform app with the backend and APIs it needs, built in iterative sprints." },
      { title: "Store submission & launch support", description: "App Store and Google Play preparation, submission and launch monitoring." },
    ],
    relatedFeatures: ["accounts", "payments", "booking", "integrations", "dashboard", "ai-assistant"],
  },
  {
    key: "ai-automation",
    name: "AI & Automation",
    tagline: "AI agents, n8n workflows & integrations",
    icon: "bot",
    price: { min: 3000, max: 15000 },
    weeks: { min: 3, max: 8 },
    monthly: { label: "Automation monitoring & iteration", min: 200, max: 900 },
    deliverables: [
      { title: "Process audit & automation blueprint", description: "Mapping today's workflows to identify the automations with the highest return." },
      { title: "Workflow implementation (n8n / APIs)", description: "Robust automations connecting your tools, with error handling and alerts." },
      { title: "AI assistant / agent configuration", description: "AI assistants grounded in your content and processes, with sensible guardrails." },
      { title: "Monitoring, documentation & team training", description: "Dashboards, documentation and hands-on training so your team owns the system." },
    ],
    relatedFeatures: ["ai-assistant", "crm", "integrations", "dashboard"],
  },
  {
    key: "seo-content",
    name: "SEO & Content",
    tagline: "Technical SEO, content strategy & copy",
    icon: "search",
    price: { min: 1500, max: 6000 },
    weeks: { min: 3, max: 8 },
    monthly: { label: "SEO & content retainer", min: 600, max: 2000 },
    deliverables: [
      { title: "Technical SEO audit", description: "A crawl-based audit of speed, indexation, structure and on-page issues, prioritised by impact." },
      { title: "Keyword & content strategy", description: "Keyword research, topic clusters and a content calendar aligned with your goals." },
      { title: "On-page optimisation", description: "Optimised titles, structure, internal links and schema across priority pages." },
      { title: "Reporting dashboard", description: "A live dashboard tracking rankings, traffic and conversions." },
    ],
    relatedFeatures: ["copywriting", "blog", "analytics", "multilingual"],
  },
  {
    key: "social-media",
    name: "Social & Performance",
    tagline: "Social content systems & paid campaigns",
    icon: "megaphone",
    price: { min: 1200, max: 5000 },
    weeks: { min: 2, max: 4 },
    monthly: { label: "Social & ads management", min: 800, max: 2500 },
    deliverables: [
      { title: "Channel & audience strategy", description: "Which channels to prioritise, who to reach and what success looks like on each." },
      { title: "Content pillars & templates", description: "Content pillars, formats and branded templates for consistent, efficient production." },
      { title: "Campaign setup & tracking", description: "Campaign structure, audiences, pixels and conversion tracking set up correctly." },
      { title: "Monthly performance reporting", description: "Clear monthly reporting with insights and next actions." },
    ],
    relatedFeatures: ["content-production", "copywriting", "analytics"],
  },
  {
    key: "motion-3d",
    name: "Motion & 3D",
    tagline: "Brand films, product renders & animation",
    icon: "clapperboard",
    price: { min: 2000, max: 10000 },
    weeks: { min: 2, max: 6 },
    deliverables: [
      { title: "Creative concept & storyboard", description: "Concept development and storyboards that align the story before production." },
      { title: "Motion design / 3D production", description: "Animation, 3D modelling and rendering crafted to your brand." },
      { title: "Sound design & edits", description: "Music, sound design and edits that bring the piece to life." },
      { title: "Delivery in all required formats", description: "Final exports optimised for web, social, events and broadcast." },
    ],
    relatedFeatures: ["content-production"],
  },
];

/* ----------------------------------------------------------------------------
 * Feature add-ons
 * ------------------------------------------------------------------------- */

export const FEATURE_KEYS = [
  "cms",
  "multilingual",
  "booking",
  "payments",
  "accounts",
  "blog",
  "crm",
  "ai-assistant",
  "analytics",
  "dashboard",
  "integrations",
  "copywriting",
  "content-production",
  "care-plan",
] as const;
export type FeatureKey = (typeof FEATURE_KEYS)[number];

export interface FeatureDefinition {
  key: FeatureKey;
  name: string;
  description: string;
  /** One-time cost added to the project. */
  price: number;
  /** Additional weeks of effort (partially parallelisable). */
  weeks: number;
  /** Optional recurring cost per month. */
  monthly?: number;
}

export const FEATURES: FeatureDefinition[] = [
  { key: "cms", name: "Content management", description: "Edit pages & content without a developer", price: 900, weeks: 1 },
  { key: "multilingual", name: "Multilingual (EN · AR · FR)", description: "Localised content incl. right-to-left Arabic", price: 1400, weeks: 1.5 },
  { key: "booking", name: "Bookings & appointments", description: "Scheduling, availability & reminders", price: 1500, weeks: 1 },
  { key: "payments", name: "Online payments", description: "Cards, wallets & local gateways", price: 1500, weeks: 1 },
  { key: "accounts", name: "User accounts", description: "Sign-up, login & member areas", price: 2500, weeks: 2 },
  { key: "blog", name: "Blog / journal", description: "Editorial templates & categories", price: 600, weeks: 0.5 },
  { key: "crm", name: "CRM & marketing sync", description: "HubSpot, Airtable, Notion, Mailchimp…", price: 1200, weeks: 1 },
  { key: "ai-assistant", name: "AI assistant", description: "Chat assistant trained on your content", price: 2800, weeks: 2, monthly: 120 },
  { key: "analytics", name: "Analytics & tracking", description: "GA4, pixels, conversion events", price: 600, weeks: 0.5 },
  { key: "dashboard", name: "Custom dashboard", description: "Internal tools & reporting views", price: 3500, weeks: 3 },
  { key: "integrations", name: "API integrations", description: "ERP, POS, logistics & third-party APIs", price: 2200, weeks: 2 },
  { key: "copywriting", name: "Copywriting", description: "Conversion-focused copy in your voice", price: 1200, weeks: 1 },
  { key: "content-production", name: "Photo & video production", description: "Art-directed shoots & edits", price: 1800, weeks: 1.5 },
  { key: "care-plan", name: "Care plan", description: "Hosting, updates, backups & support", price: 0, weeks: 0, monthly: 250 },
];

/* ----------------------------------------------------------------------------
 * Scope scale, budgets, timelines & other brief options
 * ------------------------------------------------------------------------- */

export const SCALE_KEYS = ["starter", "standard", "advanced", "enterprise"] as const;
export type ScaleKey = (typeof SCALE_KEYS)[number];

export const SCALES: {
  key: ScaleKey;
  name: string;
  description: string;
  priceMultiplier: number;
  weeksMultiplier: number;
}[] = [
  { key: "starter", name: "Starter", description: "Lean scope — the essentials, beautifully done", priceMultiplier: 0.8, weeksMultiplier: 0.8 },
  { key: "standard", name: "Standard", description: "A complete, polished launch", priceMultiplier: 1, weeksMultiplier: 1 },
  { key: "advanced", name: "Advanced", description: "Custom interactions, integrations & content depth", priceMultiplier: 1.35, weeksMultiplier: 1.25 },
  { key: "enterprise", name: "Enterprise", description: "Multi-market, complex systems & governance", priceMultiplier: 1.85, weeksMultiplier: 1.6 },
];

export const BUDGET_KEYS = ["under-3k", "3k-7k", "7k-15k", "15k-30k", "30k-60k", "60k-plus", "not-sure"] as const;
export type BudgetKey = (typeof BUDGET_KEYS)[number];

export const BUDGETS: { key: BudgetKey; label: string; min: number | null; max: number | null }[] = [
  { key: "under-3k", label: "Under $3k", min: 0, max: 3000 },
  { key: "3k-7k", label: "$3k – $7k", min: 3000, max: 7000 },
  { key: "7k-15k", label: "$7k – $15k", min: 7000, max: 15000 },
  { key: "15k-30k", label: "$15k – $30k", min: 15000, max: 30000 },
  { key: "30k-60k", label: "$30k – $60k", min: 30000, max: 60000 },
  { key: "60k-plus", label: "$60k +", min: 60000, max: null },
  { key: "not-sure", label: "Not sure yet", min: null, max: null },
];

export const TIMELINE_KEYS = ["asap", "1-2-months", "2-4-months", "4-plus-months", "flexible"] as const;
export type TimelineKey = (typeof TIMELINE_KEYS)[number];

export const TIMELINES: {
  key: TimelineKey;
  label: string;
  description: string;
  /** Rush projects carry a premium; flexible ones get a small scheduling discount. */
  priceMultiplier: number;
  /** Rush projects are compressed (more people in parallel). */
  weeksMultiplier: number;
}[] = [
  { key: "asap", label: "ASAP", description: "Rush delivery, within ~4 weeks", priceMultiplier: 1.25, weeksMultiplier: 0.75 },
  { key: "1-2-months", label: "1–2 months", description: "Fast-tracked schedule", priceMultiplier: 1.1, weeksMultiplier: 0.9 },
  { key: "2-4-months", label: "2–4 months", description: "Our recommended pace", priceMultiplier: 1, weeksMultiplier: 1 },
  { key: "4-plus-months", label: "4+ months", description: "Phased or large-scale programme", priceMultiplier: 1, weeksMultiplier: 1 },
  { key: "flexible", label: "Flexible", description: "We'll plan around our capacity", priceMultiplier: 0.97, weeksMultiplier: 1 },
];

export const PROJECT_TYPES = [
  { key: "new", label: "Something new", description: "A new brand, product or platform" },
  { key: "redesign", label: "A redesign", description: "Evolve what already exists" },
  { key: "extend", label: "Scale an existing product", description: "New features, markets or channels" },
] as const;
export type ProjectTypeKey = (typeof PROJECT_TYPES)[number]["key"];

export const GOALS = [
  { key: "generate-leads", label: "Generate more leads" },
  { key: "sell-online", label: "Sell online" },
  { key: "elevate-brand", label: "Elevate our brand" },
  { key: "launch-product", label: "Launch a new product" },
  { key: "automate-operations", label: "Automate operations" },
  { key: "improve-conversion", label: "Improve conversion" },
  { key: "enter-new-market", label: "Enter a new market" },
  { key: "support-fundraising", label: "Support fundraising" },
] as const;
export type GoalKey = (typeof GOALS)[number]["key"];

export const ASSETS = [
  { key: "logo", label: "Logo" },
  { key: "brand-guidelines", label: "Brand guidelines" },
  { key: "copy", label: "Written content" },
  { key: "photography", label: "Photography / video" },
  { key: "website", label: "Existing website" },
  { key: "domain-hosting", label: "Domain & hosting" },
] as const;
export type AssetKey = (typeof ASSETS)[number]["key"];

export const LANGUAGES = [
  { key: "en", label: "English" },
  { key: "ar", label: "Arabic" },
  { key: "fr", label: "French" },
  { key: "other", label: "Other" },
] as const;
export type LanguageKey = (typeof LANGUAGES)[number]["key"];

export const CONTACT_METHODS = [
  { key: "email", label: "Email" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "phone", label: "Phone call" },
  { key: "video-call", label: "Video call" },
] as const;
export type ContactMethodKey = (typeof CONTACT_METHODS)[number]["key"];

export const INDUSTRIES = [
  "Architecture & interiors",
  "Education",
  "Fashion & retail",
  "Finance & fintech",
  "Food & beverage",
  "Healthcare & wellness",
  "Hospitality & tourism",
  "Non-profit & NGO",
  "Real estate",
  "Technology & SaaS",
  "Other",
];

/* ----------------------------------------------------------------------------
 * Commercial defaults
 * ------------------------------------------------------------------------- */

/** Bundle discount applied when several services are combined. */
export function bundleDiscountRate(serviceCount: number): number {
  if (serviceCount >= 3) return 0.08;
  if (serviceCount === 2) return 0.05;
  return 0;
}

export const DEFAULT_PAYMENT_SCHEDULE = [
  { label: "Project kickoff", percent: 40 },
  { label: "Design approval", percent: 40 },
  { label: "Launch & handover", percent: 20 },
];

/** Standard delivery phases; `share` is the portion of total weeks. */
export const DELIVERY_PHASES = [
  { key: "discovery", name: "Discovery & Strategy", share: 0.15 },
  { key: "design", name: "Design", share: 0.3 },
  { key: "build", name: "Build & Production", share: 0.4 },
  { key: "launch", name: "QA & Launch", share: 0.15 },
] as const;

export const PROPOSAL_VALIDITY_DAYS = 30;

/* ----------------------------------------------------------------------------
 * Lookup helpers
 * ------------------------------------------------------------------------- */

export const SERVICE_MAP = Object.fromEntries(SERVICES.map((s) => [s.key, s])) as Record<ServiceKey, ServiceDefinition>;
export const FEATURE_MAP = Object.fromEntries(FEATURES.map((f) => [f.key, f])) as Record<FeatureKey, FeatureDefinition>;
export const SCALE_MAP = Object.fromEntries(SCALES.map((s) => [s.key, s])) as Record<ScaleKey, (typeof SCALES)[number]>;
export const BUDGET_MAP = Object.fromEntries(BUDGETS.map((b) => [b.key, b])) as Record<BudgetKey, (typeof BUDGETS)[number]>;
export const TIMELINE_MAP = Object.fromEntries(TIMELINES.map((t) => [t.key, t])) as Record<TimelineKey, (typeof TIMELINES)[number]>;

export function labelFor<T extends { key: string; label?: string; name?: string }>(
  list: readonly T[],
  key: string | null | undefined,
): string {
  if (!key) return "—";
  const hit = list.find((item) => item.key === key);
  return hit?.label ?? hit?.name ?? key;
}
