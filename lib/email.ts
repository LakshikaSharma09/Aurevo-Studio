import { Resend } from "resend";
import { getServerEnv } from "@/lib/env";

export async function sendNotificationEmail(params: {
  subject: string;
  html: string;
}): Promise<{ sent: boolean; error?: string }> {
  const env = getServerEnv();
  if (!env.RESEND_API_KEY || !env.NOTIFY_EMAIL) {
    return { sent: false, error: "Email not configured" };
  }
  const from = env.EMAIL_FROM || "Aurevo Studio <onboarding@resend.dev>";
  try {
    const resend = new Resend(env.RESEND_API_KEY);
    await resend.emails.send({
      from,
      to: env.NOTIFY_EMAIL,
      subject: params.subject,
      html: params.html,
    });
    return { sent: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "send failed";
    return { sent: false, error: msg };
  }
}
