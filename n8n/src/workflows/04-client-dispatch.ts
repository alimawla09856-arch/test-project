import { code, config, email, http, ifNode, noop, reportEvent, respond, sticky, switchNode, telegram, webhook, WorkflowBuilder } from "../builder";
import { EMAIL_LAYOUT_JS, ESCAPE_JS } from "../snippets";

const NAME = "ASD 04 · Client Dispatch & Admin Alerts";

const whatsapp = (name: string, position: [number, number], textExpression: string) => ({
  ...http(name, position, {
    url: "=https://graph.facebook.com/v21.0/{{ $('Config').first().json.whatsappPhoneNumberId }}/messages",
    auth: "whatsapp",
    jsonBody: `={{ JSON.stringify({ messaging_product: 'whatsapp', to: $('Config').first().json.adminWhatsappNumber, type: 'text', text: { preview_url: true, body: ${textExpression} } }) }}`,
  }),
  onError: "continueRegularOutput" as const,
});

export function clientDispatchWorkflow() {
  const wf = new WorkflowBuilder(
    NAME,
    "Receives proposal lifecycle events. On approval: fetches the PDF (workflow 03), emails the client, reports proposal.sent and alerts the team on Telegram/WhatsApp. Also handles acceptance, decline and draft-ready alerts.",
    ["AS Design Studio", "Dispatch"],
  );

  wf.add(
    sticky("Note · Overview", [-480, -320], [
      "## 04 · Client Dispatch & Admin Alerts",
      "**Trigger:** the app POSTs proposal events here.",
      "",
      "- `proposal.approved` → PDF from workflow 03 → **email to client** with PDF + private link → `proposal.sent` reported to the app → Telegram / WhatsApp alert",
      "- `proposal.accepted` → 🎉 alert + **welcome email** with kickoff link",
      "- `proposal.declined` → alert with the client's note",
      "- `proposal.created` → *draft ready for review* alert (only sent when the app runs the AI itself)",
      "",
      "**Credentials:** *ASD · Webhook auth* (also used to call workflow 03), *ASD · App API*, *ASD · SMTP*, *ASD · Telegram bot*, *ASD · WhatsApp Cloud API token*.",
    ].join("\n"), { width: 440, height: 380 }, 6),
  );

  wf.add(webhook("Dispatch Webhook", "asd-proposal-dispatch", [0, 0], NAME));
  wf.add(respond("Respond 202", [220, 0], "={{ JSON.stringify({ accepted: true, executionId: $execution.id }) }}"));
  wf.add(
    config("Config", [440, 0], [
      { name: "appBaseUrl", value: "https://automation.asdesignlb.com" },
      { name: "n8nWebhookBase", value: "https://n8n.asdesignlb.com/webhook" },
      { name: "telegramChatId", value: "REPLACE_WITH_TELEGRAM_CHAT_ID" },
      { name: "whatsappEnabled", value: false },
      { name: "whatsappPhoneNumberId", value: "REPLACE_WITH_META_PHONE_NUMBER_ID" },
      { name: "adminWhatsappNumber", value: "9617XXXXXXX" },
      { name: "fromEmail", value: "hello@asdesignlb.com" },
      { name: "fromName", value: "AS Design Studio" },
      { name: "replyTo", value: "hello@asdesignlb.com" },
      { name: "bookingUrl", value: "" },
    ], NAME),
  );
  wf.add(
    switchNode(
      "Route Event",
      [660, 0],
      "={{ $('Dispatch Webhook').first().json.body.type }}",
      [
        { key: "approved", equals: "proposal.approved" },
        { key: "accepted", equals: "proposal.accepted" },
        { key: "declined", equals: "proposal.declined" },
        { key: "draft ready", equals: "proposal.created" },
      ],
      NAME,
    ),
  );
  wf.add(noop("Ignore (test / other)", [900, 480]));

  /* ---------------------------- approved → send ---------------------------- */
  wf.add(
    http("Get PDF (workflow 03)", [900, -240], {
      url: "={{ $('Config').first().json.n8nWebhookBase }}/asd-proposal-pdf",
      auth: "webhookAuth",
      jsonBody: "={{ JSON.stringify({ proposalId: $('Dispatch Webhook').first().json.body.proposal.id }) }}",
      responseFile: true,
      timeout: 90_000,
    }),
  );
  wf.add(
    code(
      "Compose Proposal Email",
      [1120, -240],
      ESCAPE_JS +
        "\n" +
        EMAIL_LAYOUT_JS +
        String.raw`
const body = $('Dispatch Webhook').first().json.body;
const lead = body.lead, p = body.proposal;
const first = String(lead.contact.name).split(" ")[0];
const html = emailLayout({
  title: p.title,
  bodyHtml: "<p>Hi " + esc(first) + ",</p>" +
    "<p>Thank you for your patience — your tailored proposal is ready. It covers the full scope, a timeline of " + esc(p.display.duration) + " and a total investment of <b>" + esc(p.display.total) + "</b>" + (p.display.monthly ? " (plus " + esc(p.display.monthly) + ")" : "") + ".</p>" +
    "<p>The PDF is attached. You can also review it online and accept it in a couple of clicks — the link is private to you and valid until " + esc(p.display.validUntil || p.validUntil) + ".</p>" +
    "<p>Happy to walk you through it on a call — just reply to this email.</p>",
  ctaUrl: body.links.proposal,
  ctaLabel: "Review & accept your proposal",
});
const binary = $input.first().binary || {};
if (binary.data) binary.data.fileName = lead.reference + "-proposal-v" + p.version + ".pdf";
return [{ json: { to: lead.contact.email, subject: "Your proposal from " + $('Config').first().json.fromName + " · " + lead.reference, html }, binary }];`,
    ),
  );
  wf.add(email("Email Proposal to Client", [1340, -240], { to: "={{ $json.to }}", subject: "={{ $json.subject }}", html: "={{ $json.html }}", attachments: "data" }));
  wf.add(
    reportEvent(
      "Report proposal.sent",
      [1560, -240],
      "{ type: 'proposal.sent', proposalId: $('Dispatch Webhook').first().json.body.proposal.id, data: { channel: 'email', to: $('Compose Proposal Email').first().json.to, executionId: $execution.id } }",
    ),
  );
  wf.add(
    telegram(
      "Telegram · Sent",
      [1780, -300],
      "={{ '📤 <b>Proposal sent</b> · ' + $('Dispatch Webhook').first().json.body.lead.reference + '\\n' + $('Dispatch Webhook').first().json.body.lead.display.name + ' — ' + $('Dispatch Webhook').first().json.body.proposal.display.total + '\\n<a href=\"' + $('Dispatch Webhook').first().json.body.links.admin + '\">Open lead →</a>' }}",
    ),
  );
  wf.add(ifNode("WhatsApp? (sent)", [1780, -160], { left: "={{ $('Config').first().json.whatsappEnabled }}", op: "true" }, NAME));
  wf.add(whatsapp("WhatsApp · Sent", [2000, -160], "'Proposal sent: ' + $('Dispatch Webhook').first().json.body.lead.reference + ' · ' + $('Dispatch Webhook').first().json.body.proposal.display.total"));

  /* --------------------------- accepted → celebrate ------------------------ */
  wf.add(
    telegram(
      "Telegram · Accepted",
      [900, 0],
      "={{ '🎉 <b>Proposal accepted!</b> · ' + $('Dispatch Webhook').first().json.body.lead.reference + '\\n' + $('Dispatch Webhook').first().json.body.lead.display.name + ' signed ' + $('Dispatch Webhook').first().json.body.proposal.display.total + ($('Dispatch Webhook').first().json.body.proposal.clientResponse && $('Dispatch Webhook').first().json.body.proposal.clientResponse.note ? '\\n“' + $('Dispatch Webhook').first().json.body.proposal.clientResponse.note + '”' : '') + '\\n<a href=\"' + $('Dispatch Webhook').first().json.body.links.admin + '\">Plan the kickoff →</a>' }}",
    ),
  );
  wf.add(ifNode("WhatsApp? (accepted)", [1120, -60], { left: "={{ $('Config').first().json.whatsappEnabled }}", op: "true" }, NAME));
  wf.add(whatsapp("WhatsApp · Accepted", [1340, -60], "'🎉 Accepted: ' + $('Dispatch Webhook').first().json.body.lead.reference + ' · ' + $('Dispatch Webhook').first().json.body.proposal.display.total"));
  wf.add(
    code(
      "Compose Welcome Email",
      [1120, 80],
      ESCAPE_JS +
        "\n" +
        EMAIL_LAYOUT_JS +
        String.raw`
const body = $('Dispatch Webhook').first().json.body;
const cfg = $('Config').first().json;
const lead = body.lead;
const first = String(lead.contact.name).split(" ")[0];
const html = emailLayout({
  title: "Welcome aboard, " + first,
  bodyHtml: "<p>We're thrilled to be working together on <b>" + esc(body.proposal.title) + "</b>.</p>" +
    "<p>Here's what happens next:</p><ol>" + body.proposal.nextSteps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol>" +
    "<p>Your first invoice (" + esc(body.proposal.paymentSchedule[0] ? body.proposal.paymentSchedule[0].label : "kickoff") + ") will follow separately.</p>",
  ctaUrl: cfg.bookingUrl || body.links.proposal,
  ctaLabel: cfg.bookingUrl ? "Book your kickoff call" : "View your signed proposal",
});
return [{ json: { to: lead.contact.email, subject: "Welcome to " + cfg.fromName + " · next steps", html } }];`,
    ),
  );
  wf.add(email("Send Welcome Email", [1340, 80], { to: "={{ $json.to }}", subject: "={{ $json.subject }}", html: "={{ $json.html }}" }));
  wf.add(reportEvent("Report Welcome Email", [1560, 80], "{ type: 'email.sent', proposalId: $('Dispatch Webhook').first().json.body.proposal.id, data: { kind: 'welcome', to: $('Compose Welcome Email').first().json.to } }"));

  /* ----------------------------- declined / draft ------------------------- */
  wf.add(
    telegram(
      "Telegram · Declined",
      [900, 220],
      "={{ '🕊 <b>Proposal declined</b> · ' + $('Dispatch Webhook').first().json.body.lead.reference + '\\n' + $('Dispatch Webhook').first().json.body.lead.display.name + ($('Dispatch Webhook').first().json.body.proposal.clientResponse && $('Dispatch Webhook').first().json.body.proposal.clientResponse.note ? '\\n“' + $('Dispatch Webhook').first().json.body.proposal.clientResponse.note + '”' : '') + '\\n<a href=\"' + $('Dispatch Webhook').first().json.body.links.admin + '\">Open lead →</a>' }}",
    ),
  );
  wf.add(
    telegram(
      "Telegram · Draft Ready",
      [900, 360],
      "={{ '✨ <b>Proposal draft ready</b> · ' + $('Dispatch Webhook').first().json.body.lead.reference + '\\n' + $('Dispatch Webhook').first().json.body.proposal.title + '\\n💰 ' + $('Dispatch Webhook').first().json.body.proposal.display.total + '\\n<a href=\"' + $('Dispatch Webhook').first().json.body.links.admin + '\">Review & approve →</a>' }}",
    ),
  );

  wf.chain("Dispatch Webhook", "Respond 202", "Config", "Route Event");
  wf.connect("Route Event", "Get PDF (workflow 03)", 0);
  wf.connect("Route Event", "Telegram · Accepted", 1);
  wf.connect("Route Event", "Compose Welcome Email", 1);
  wf.connect("Route Event", "Telegram · Declined", 2);
  wf.connect("Route Event", "Telegram · Draft Ready", 3);
  wf.connect("Route Event", "Ignore (test / other)", 4);
  wf.chain("Get PDF (workflow 03)", "Compose Proposal Email", "Email Proposal to Client", "Report proposal.sent");
  wf.connect("Report proposal.sent", "Telegram · Sent");
  wf.connect("Report proposal.sent", "WhatsApp? (sent)");
  wf.connect("WhatsApp? (sent)", "WhatsApp · Sent", 0);
  wf.connect("Telegram · Accepted", "WhatsApp? (accepted)");
  wf.connect("WhatsApp? (accepted)", "WhatsApp · Accepted", 0);
  wf.chain("Compose Welcome Email", "Send Welcome Email", "Report Welcome Email");

  return wf.build();
}
