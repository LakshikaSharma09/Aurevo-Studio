import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import { LlmNotConfiguredError, streamChatReply } from "@/lib/llm";
import { rateLimitPublic } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";

export const runtime = "nodejs";

const msgSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(8000),
});

const bodySchema = z.object({
  messages: z.array(msgSchema).min(1).max(30),
  turnstileToken: z.string().optional(),
});

export async function POST(req: Request) {
  getServerEnv();
  const rl = rateLimitPublic(req, "chat");
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

  const last = parsed.data.messages[parsed.data.messages.length - 1];
  if (!last || last.role !== "user") {
    return NextResponse.json({ error: "Last message must be from user" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  try {
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of streamChatReply({
            messages: parsed.data.messages,
          })) {
            if (chunk) controller.enqueue(encoder.encode(chunk));
          }
        } catch (e) {
          if (e instanceof LlmNotConfiguredError) {
            controller.enqueue(
              encoder.encode("\n[Assistant unavailable: AI is not configured.]"),
            );
          } else {
            controller.enqueue(encoder.encode("\n[Something went wrong. Please try again.]"));
          }
        } finally {
          controller.close();
        }
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    if (e instanceof LlmNotConfiguredError) {
      return NextResponse.json({ error: "AI not configured" }, { status: 503 });
    }
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
