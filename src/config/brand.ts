/**
 * Brand & public-facing configuration. Safe for the browser: only reads
 * NEXT_PUBLIC_* variables (inlined at build time).
 */
export const brand = {
  name: "AS Design Studio",
  shortName: "AS Design",
  monogram: "AS",
  /** The studio's founder/principal strategist — used in the AI persona, PDF signature and portal. */
  owner: process.env.NEXT_PUBLIC_OWNER_NAME || "Ali Mawla",
  tagline: "Design-led digital studio",
  /** The studio's main marketing site (the Project Builder links back to it). */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://asdesignlb.com",
  /** Where this platform is hosted, e.g. https://automation.asdesignlb.com */
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "alimawla096@gmail.com",
  /** Optional scheduling link (Calendly, Cal.com…) offered after submission / acceptance. */
  bookingUrl: process.env.NEXT_PUBLIC_BOOKING_URL || null,
  /** E.164 digits only (no "+"), e.g. "9613123456" — used by the WhatsApp kickoff button. */
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || null,
  /** Human-readable phone shown in the proposal PDF footer, e.g. "+961 3 123 456". Falls back to a formatted whatsappNumber. */
  phoneDisplay: process.env.NEXT_PUBLIC_PHONE_DISPLAY || (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ? `+${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}` : null),
  /** Optional line shown in footers and the proposal PDF, e.g. "Beirut · Worldwide". */
  location: process.env.NEXT_PUBLIC_STUDIO_LOCATION || null,
  /**
   * Path (from the public/ root) to the icon-only mark, used in the small (~36px)
   * monogram slots in the navbar, client portal and PDF cover. Cropped tightly from
   * the full asdesignlb.com logo lockup (`/brand/logo.png`, kept for larger contexts)
   * since that file is mostly whitespace padding and unrecognisable at avatar size.
   */
  logoPath: "/brand/icon-mark.png",
  /** The full logo lockup (icon + "ALI MAWLA" wordmark), for contexts with room to breathe. */
  logoFullPath: "/brand/logo.png",
  /**
   * Palette mirrored in the PDF renderer (react-pdf cannot read CSS variables).
   * ember + navy are matched exactly to asdesignlb.com's CSS custom properties
   * (--orange / --navy in the portfolio's globals.css) so the two properties
   * read as one brand.
   */
  colors: {
    ink: "#07070b",
    inkSoft: "#12121a",
    ivory: "#f4f1ea",
    mist: "#a9a5a0",
    ember: "#d36707",
    navy: "#07146c",
  },
} as const;

export type Brand = typeof brand;
