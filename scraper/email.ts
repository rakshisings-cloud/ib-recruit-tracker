import { Resend } from "resend";

let resendClient: Resend | null = null;

function getClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is not set");
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export async function sendAlertEmail(params: {
  firmName: string;
  newStatus: string;
  url: string;
}): Promise<void> {
  const to = process.env.ALERT_TO_EMAIL;
  const from = process.env.ALERT_FROM_EMAIL;
  if (!to || !from) {
    throw new Error("ALERT_TO_EMAIL / ALERT_FROM_EMAIL is not set");
  }

  const subject =
    params.newStatus === "open"
      ? `Application open: ${params.firmName}`
      : `Status update: ${params.firmName} -> ${params.newStatus}`;

  await getClient().emails.send({
    to,
    from,
    subject,
    text: `${params.firmName} just changed status to "${params.newStatus}".\n\nCheck it here: ${params.url}\n\nThis is an automated alert — verify manually before acting on it.`,
  });
}
