import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import { sendNotificationEmail } from "@/lib/email";
import { dbConnect } from "@/lib/mongodb";
import { rateLimitPublic, getClientIpFromRequest } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { Feedback } from "@/models/Feedback";

export const runtime = "nodejs";

const bodySchema = z.object({
  message: z.string().trim().min(5).max(8000),
  email: z.string().trim().email().max(320).optional().or(z.literal("")),
  rating: z.number().int().min(1).max(5).optional(),
  category: z.string().trim().max(80).optional(),
  turnstileToken: z.string().optional(),
});

export async function POST(req: Request) {
  getServerEnv();
  const rl = rateLimitPublic(req, "feedback");
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
  const email =
    parsed.data.email && parsed.data.email.length > 0 ? parsed.data.email : undefined;

  const doc = await Feedback.create({
    message: parsed.data.message,
    email,
    rating: parsed.data.rating,
    category: parsed.data.category,
  });

  const notify = await sendNotificationEmail({
    subject: `[Aurevo] New feedback`,
    html: `
      <p><strong>New feedback</strong></p>
      <ul>
        <li><strong>Rating:</strong> ${parsed.data.rating ?? "—"}</li>
        <li><strong>Email:</strong> ${email ? escapeHtml(email) : "—"}</li>
        <li><strong>Category:</strong> ${escapeHtml(parsed.data.category ?? "—")}</li>
        <li><strong>Message:</strong><br/>${escapeHtml(parsed.data.message)}</li>
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
