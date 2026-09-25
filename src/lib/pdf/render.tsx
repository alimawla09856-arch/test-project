import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";
import { Font, renderToBuffer } from "@react-pdf/renderer";
import type { Lead, Proposal } from "@/lib/types";
import { ProposalDocument } from "./ProposalDocument";

/**
 * Renders the proposal PDF. Brand fonts come from the @fontsource packages
 * (bundled into standalone/serverless output via `outputFileTracingIncludes`
 * in next.config.ts); if they are unavailable we fall back to PDF core fonts.
 */

const FONT_DIR = path.join(process.cwd(), "node_modules", "@fontsource");
const FONT_FILES = {
  display: [
    { file: "fraunces/files/fraunces-latin-400-normal.woff", fontWeight: 400, fontStyle: "normal" as const },
    { file: "fraunces/files/fraunces-latin-600-normal.woff", fontWeight: 600, fontStyle: "normal" as const },
    { file: "fraunces/files/fraunces-latin-400-italic.woff", fontWeight: 400, fontStyle: "italic" as const },
  ],
  sans: [
    { file: "hanken-grotesk/files/hanken-grotesk-latin-400-normal.woff", fontWeight: 400, fontStyle: "normal" as const },
    { file: "hanken-grotesk/files/hanken-grotesk-latin-600-normal.woff", fontWeight: 600, fontStyle: "normal" as const },
    { file: "hanken-grotesk/files/hanken-grotesk-latin-700-normal.woff", fontWeight: 700, fontStyle: "normal" as const },
  ],
};

let fonts: { display: string; sans: string } | null = null;

function registerFonts(): { display: string; sans: string } {
  if (fonts) return fonts;
  const available = [...FONT_FILES.display, ...FONT_FILES.sans].every((f) => existsSync(path.join(FONT_DIR, f.file)));
  if (!available) {
    console.warn("[pdf] brand fonts not found — falling back to Helvetica/Times");
    fonts = { display: "Times-Roman", sans: "Helvetica" };
    return fonts;
  }
  Font.register({
    family: "Fraunces",
    fonts: FONT_FILES.display.map((f) => ({ src: path.join(FONT_DIR, f.file), fontWeight: f.fontWeight, fontStyle: f.fontStyle })),
  });
  Font.register({
    family: "Hanken Grotesk",
    fonts: FONT_FILES.sans.map((f) => ({ src: path.join(FONT_DIR, f.file), fontWeight: f.fontWeight, fontStyle: f.fontStyle })),
  });
  // Keep words intact (react-pdf hyphenates aggressively by default).
  Font.registerHyphenationCallback((word) => [word]);
  fonts = { display: "Fraunces", sans: "Hanken Grotesk" };
  return fonts;
}

export async function renderProposalPdf(params: { proposal: Proposal; lead: Lead; shareUrl: string }): Promise<Buffer> {
  return renderToBuffer(<ProposalDocument {...params} fonts={registerFonts()} />);
}

export function proposalPdfFilename(lead: Pick<Lead, "reference">, proposal: Pick<Proposal, "version">): string {
  return `${lead.reference}-proposal-v${proposal.version}.pdf`;
}
