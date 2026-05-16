import { convert } from "html-to-text";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import { LlmNotConfiguredError, runSiteAnalysis } from "@/lib/llm";
import { dbConnect } from "@/lib/mongodb";
import { rateLimitPublic, getClientIpFromRequest } from "@/lib/rate-limit";
import { assertSafeUrl, fetchHtmlSafe, SsrfError } from "@/lib/ssrf";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { Analysis } from "@/models/Analysis";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  url: z.string().trim().min(4).max(2000),
  turnstileToken: z.string().optional(),
});

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m
    ? m[1]
        .replace(/\s+/g, " ")
        .replace(/&nbsp;/g, " ")
        .trim()
        .slice(0, 240)
    : "";
}

export async function POST(req: Request) {
  getServerEnv();
  const rl = rateLimitPublic(req, "analyze");
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

  let safeUrl: URL;
  try {
    safeUrl = await assertSafeUrl(parsed.data.url);
  } catch (e) {
    const msg = e instanceof SsrfError ? e.message : "Invalid URL";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  let html: string;
  let finalUrl: string;
  try {
    const fetched = await fetchHtmlSafe(safeUrl);
    html = fetched.html;
    finalUrl = fetched.finalUrl;
  } catch (e) {
    const msg = e instanceof SsrfError ? e.message : "Could not fetch URL";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const pageTitle = extractTitle(html);
  const pageText = convert(html, {
    wordwrap: false,
    selectors: [
      { selector: "a", options: { ignoreHref: true } },
      { selector: "img", format: "skip" },
    ],
  }).slice(0, 50_000);

  const ip = getClientIpFromRequest(req);
  await dbConnect();

  try {
    const result = await runSiteAnalysis({
      pageText,
      pageTitle,
      finalUrl,
    });
    const preview = pageText.slice(0, 12_000);
    const doc = await Analysis.create({
      url: parsed.data.url,
      finalUrl,
      pageTitle,
      extractedPreview: preview,
      model: result.model,
      structured: result.structured,
      rawJson: result.rawJson,
      clientIp: ip,
    });
    return NextResponse.json({
      ok: true,
      id: String(doc._id),
      finalUrl,
      structured: result.structured,
    });
  } catch (e) {
    if (e instanceof LlmNotConfiguredError) {
      return NextResponse.json(
        { error: "AI analysis is not configured on this server" },
        { status: 503 },
      );
    }
    const msg = e instanceof Error ? e.message : "Analysis failed";
    await Analysis.create({
      url: parsed.data.url,
      finalUrl,
      pageTitle,
      extractedPreview: pageText.slice(0, 4000),
      model: "none",
      structured: {
        summary: "Analysis could not be completed.",
        quickWins: [],
        toolsToConsider: [],
        complexity: "unknown",
        risksOrLimitations: [],
        nextStepForHumans: "Book a call with Aurevo and we will review your site manually.",
        narrative: "",
      },
      error: msg,
      clientIp: ip,
    }).catch(() => {});
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
