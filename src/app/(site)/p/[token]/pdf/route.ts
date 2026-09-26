import { getRepository } from "@/lib/db";
import { getConfig } from "@/lib/env";
import { ApiError, route } from "@/lib/http";
import { proposalPdfFilename, renderProposalPdf } from "@/lib/pdf/render";
import { isShareable } from "@/lib/proposals";

/** GET /p/:token/pdf — the client's PDF download (share-token access, approved proposals only). */
export const GET = route<RouteContext<"/p/[token]/pdf">>(async (_request, context) => {
  const { token } = await context.params;
  const repo = getRepository();
  const proposal = await repo.getProposalByToken(token);
  if (!proposal || !isShareable(proposal)) throw new ApiError(404, "not_found", "Proposal not found");
  const lead = await repo.getLead(proposal.leadId);
  if (!lead) throw new ApiError(404, "not_found", "Proposal not found");

  const pdf = await renderProposalPdf({ proposal, lead, shareUrl: `${getConfig().appUrl}/p/${token}` });
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${proposalPdfFilename(lead, proposal)}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
});
