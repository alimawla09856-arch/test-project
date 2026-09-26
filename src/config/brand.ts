/**
 * Brand & public-facing configuration. Safe for the browser: only reads
 * NEXT_PUBLIC_* variables (inlined at build time).
 */
export const brand = {
  name: "AS Design Studio",
  shortName: "AS Design",
  monogram: "AM",
  /** The studio's founder/principal strategist — used in the AI persona, PDF signature and portal. */
  owner: process.env.NEXT_PUBLIC_OWNER_NAME || "Ali Mawla",
  tagline: "Design-led digital studio",
  /** The studio's main marketing site (the Project Builder links back to it). */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://asdesignlb.com",
  /** Where this platform is hosted, e.g. https://automation.asdesignlb.com */
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "proposals@asdesignlb.com",
  /** Optional scheduling link (Calendly, Cal.com…) offered after submission / acceptance. */
  bookingUrl: process.env.NEXT_PUBLIC_BOOKING_URL || null,
  /** E.164 digits only (no "+"), e.g. "9613123456" — used by the WhatsApp kickoff button. */
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || null,
  /** Optional line shown in footers and the proposal PDF, e.g. "Beirut · Worldwide". */
  location: process.env.NEXT_PUBLIC_STUDIO_LOCATION || null,
  /** Path (from the public/ root) to the AM logo mark, used in the navbar, portal and PDF cover. */
  logoPath: "/brand/am-logo.png",
  /**
   * Palette mirrored in the PDF renderer (react-pdf cannot read CSS variables).
   * ember + navy are extracted directly from the AM logo mark.
   */
  colors: {
    ink: "#07070b",
    inkSoft: "#12121a",
    ivory: "#f4f1ea",
    mist: "#a9a5a0",
    ember: "#d86f10",
    navy: "#091873",
  },
} as const;

export type Brand = typeof brand;
