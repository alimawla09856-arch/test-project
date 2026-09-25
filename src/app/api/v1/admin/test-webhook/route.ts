import { z } from "zod";
import { authorize } from "@/lib/auth/guard";
import { jsonOk, readJson, route } from "@/lib/http";
import { sendToN8n } from "@/lib/n8n";

/** POST /api/v1/admin/test-webhook — send a `test.ping` to one n8n workflow and report the result. */

const TestSchema = z.object({ target: z.enum(["leadIntake", "analysis", "dispatch", "crmSync"]) });

export const POST = route(async (request) => {
  const principal = await authorize(request, ["admin"]);
  const { target } = await readJson(request, TestSchema);
  const result = await sendToN8n(target, "test.ping", {
    test: true,
    message: "Connection test from the AS Design Studio dashboard",
    requestedBy: principal.kind === "admin" ? principal.email : "n8n",
  });
  return jsonOk({ target, ...result });
});
