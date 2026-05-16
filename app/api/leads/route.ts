import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import { sendNotificationEmail } from "@/lib/email";
import { dbConnect } from "@/lib/mongodb";
import { rateLimitPublic, getClientIpFromRequest } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { Lead } from "@/models/Lead";

export const runtime = "nodejs";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320),
  company: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().max(5000).optional(),
  preferredTime: z.string().trim().max(500).optional(),
  clientUrl: z.string().trim().url().max(2000).optional().or(z.literal("")),
  source: z.string().trim().max(200).optional(),
  turnstileToken: z.string().optional(),
});

export async function POST(req: Request) {
  getServerEnv();
  const rl = rateLimitPublic(req, "leads");
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const okTs = await verifyTurnstileToken(parsed.data.turnstileToken);
  if (!okTs) {
    return NextResponse.json({ error: "Captcha verification failed" }, { status: 400 });
  }

  await dbConnect();
  const ip = getClientIpFromRequest(req);
  const clientUrl =
    parsed.data.clientUrl && parsed.data.clientUrl.length > 0
      ? parsed.data.clientUrl
      : undefined;

  const doc = await Lead.create({
    name: parsed.data.name,
    email: parsed.data.email,
    company: parsed.data.company,
    phone: parsed.data.phone,
    message: parsed.data.message,
    preferredTime: parsed.data.preferredTime,
    clientUrl,
    source: parsed.data.source ?? "book",
  });

  const notify = await sendNotificationEmail({
    subject: `[Aurevo] New lead: ${parsed.data.name}`,
    html: `
      <p><strong>New consultation request</strong></p>
      <ul>
        <li><strong>Name:</strong> ${escapeHtml(parsed.data.name)}</li>
        <li><strong>Email:</strong> ${escapeHtml(parsed.data.email)}</li>
        <li><strong>Company:</strong> ${escapeHtml(parsed.data.company ?? "—")}</li>
        <li><strong>Phone:</strong> ${escapeHtml(parsed.data.phone ?? "—")}</li>
        <li><strong>Site URL:</strong> ${escapeHtml(clientUrl ?? "—")}</li>
        <li><strong>Preferred time:</strong> ${escapeHtml(parsed.data.preferredTime ?? "—")}</li>
        <li><strong>Message:</strong><br/>${escapeHtml(parsed.data.message ?? "—")}</li>
        <li><strong>IP:</strong> ${escapeHtml(ip)}</li>
        <li><strong>Id:</strong> ${String(doc._id)}</li>
      </ul>
    `,
  });

  return NextResponse.json({
    ok: true,
    id: String(doc._id),
    emailQueued: notify.sent,
  });
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
