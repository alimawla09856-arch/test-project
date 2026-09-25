/**
 * Brand & public-facing configuration. Safe for the browser: only reads
 * NEXT_PUBLIC_* variables (inlined at build time).
 */
export const brand = {
  name: "AS Design Studio",
  shortName: "AS Design",
  monogram: "AS",
  tagline: "Design-led digital studio",
  /** The studio's main marketing site (the Project Builder links back to it). */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://asdesignlb.com",
  /** Where this platform is hosted, e.g. https://automation.asdesignlb.com */
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@asdesignlb.com",
  /** Optional scheduling link (Calendly, Cal.com…) offered after submission / acceptance. */
  bookingUrl: process.env.NEXT_PUBLIC_BOOKING_URL || null,
  /** Optional line shown in footers and the proposal PDF, e.g. "Beirut · Worldwide". */
  location: process.env.NEXT_PUBLIC_STUDIO_LOCATION || null,
  /** Palette mirrored in the PDF renderer (react-pdf cannot read CSS variables). */
  colors: {
    ink: "#07070b",
    inkSoft: "#12121a",
    ivory: "#f4f1ea",
    mist: "#a9a5a0",
    ember: "#ff8a4c",
    emberSoft: "#ffc59a",
    glacier: "#5eead4",
    iris: "#a99bff",
  },
} as const;

export type Brand = typeof brand;
