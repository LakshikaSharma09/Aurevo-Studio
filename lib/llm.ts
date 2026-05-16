import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import type { AnalysisPayload } from "@/lib/types";
import { getLlmProvider, getServerEnv } from "@/lib/env";
import { CHAT_DISCLAIMER, SITE_KNOWLEDGE } from "@/lib/site-knowledge";

export class LlmNotConfiguredError extends Error {
  constructor() {
    super("LLM API key not configured");
    this.name = "LlmNotConfiguredError";
  }
}

function requireOpenAI() {
  const key = getServerEnv().OPENAI_API_KEY;
  if (!key) throw new LlmNotConfiguredError();
  return new OpenAI({ apiKey: key });
}

function requireGemini() {
  const key = getServerEnv().GEMINI_API_KEY;
  if (!key) throw new LlmNotConfiguredError();
  return new GoogleGenerativeAI(key);
}

const ANALYSIS_SCHEMA_INSTRUCTION = `You are an automation consultant for Aurevo Studio. Given extracted text from a public webpage, respond with a single JSON object only (no markdown fences) with this shape:
{
  "summary": "2-3 sentences about what the site appears to do",
  "quickWins": ["3-8 concrete automation ideas"],
  "toolsToConsider": ["relevant categories: e.g. chat, CRM, scheduling, analytics, email, internal APIs"],
  "complexity": "low|medium|high",
  "risksOrLimitations": ["privacy, accuracy, misuse, integration constraints"],
  "nextStepForHumans": "one sentence CTA to book a consult",
  "narrative": "short markdown list or paragraphs for the visitor (non-technical friendly)"
}
Be honest if content is thin. Do not invent features not supported by the text.`;

function parseAnalysisJson(text: string): AnalysisPayload {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  }
  return JSON.parse(t) as AnalysisPayload;
}

export async function runSiteAnalysis(params: {
  pageText: string;
  pageTitle: string;
  finalUrl: string;
}): Promise<{ model: string; structured: AnalysisPayload; rawJson: string }> {
  const provider = getLlmProvider();
  const clipped = params.pageText.slice(0, 24_000);
  const userContent = `URL: ${params.finalUrl}\nTitle: ${params.pageTitle}\n\nExtracted text:\n${clipped}`;

  if (provider === "gemini") {
    const gen = requireGemini();
    const model = gen.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: `${ANALYSIS_SCHEMA_INSTRUCTION}\n\n${userContent}` }] },
      ],
      generationConfig: { temperature: 0.4 },
    });
    const text = result.response.text().trim();
    const structured = parseAnalysisJson(text);
    return { model: "gemini-2.5-flash", structured, rawJson: text };
  }

  const openai = requireOpenAI();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    messages: [
      { role: "system", content: ANALYSIS_SCHEMA_INSTRUCTION },
      { role: "user", content: userContent },
    ],
  });
  const text = completion.choices[0]?.message?.content?.trim() ?? "{}";
  const structured = parseAnalysisJson(text);
  return { model: "gpt-4o-mini", structured, rawJson: text };
}

export async function* streamChatReply(params: {
  messages: { role: "user" | "assistant"; content: string }[];
}): AsyncGenerator<string> {
  const provider = getLlmProvider();
  const system = `You are "Aurevo Assistant", a helpful guide for Aurevo Studio visitors.

Knowledge about Aurevo:
${SITE_KNOWLEDGE}

Rules:
- Stay on topic: Aurevo services, website automation, lead capture, AI assistants, feedback workflows, and related integration topics.
- If off-topic, briefly refuse and steer back.
- End with a short line: ${CHAT_DISCLAIMER}`;

  if (provider === "gemini") {
    const gen = requireGemini();
    const model = gen.getGenerativeModel({ model: "gemini-2.5-flash" });
    const history = params.messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    const last = params.messages[params.messages.length - 1];
    if (!last || last.role !== "user") {
      yield "";
      return;
    }
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: system }] },
        { role: "model", parts: [{ text: "Understood. I will follow these rules." }] },
        ...history,
      ],
    });
    const stream = await chat.sendMessageStream(last.content);
    for await (const chunk of stream.stream) {
      const t = chunk.text();
      if (t) yield t;
    }
    return;
  }

  const openai = requireOpenAI();
  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.5,
    stream: true,
    messages: [
      { role: "system", content: system },
      ...params.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ],
  });
  for await (const part of stream) {
    const delta = part.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}
