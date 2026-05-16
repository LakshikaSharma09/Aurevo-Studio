"use client";

import Link from "next/link";
import { useState } from "react";
import { TurnstileField } from "@/components/TurnstileField";
import type { AnalysisPayload } from "@/lib/types";

export default function AnalyzePage() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisPayload | null>(null);
  const [finalUrl, setFinalUrl] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setFinalUrl(null);
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken) {
      setError("Complete the captcha first.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, turnstileToken: turnstileToken || undefined }),
      });
      const data = (await res.json()) as
        | { ok: true; structured: AnalysisPayload; finalUrl: string }
        | { error: string };
      if (!res.ok || !("ok" in data) || !data.ok) {
        setError("error" in data ? data.error : "Request failed");
        return;
      }
      setResult(data.structured);
      setFinalUrl(data.finalUrl);
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <h1 className="text-3xl font-semibold text-white">Site automation analyzer</h1>
        <p className="mt-3 text-gray-400">
          Paste a public URL you have permission to analyze. We fetch readable text, then an AI
          model suggests automation opportunities. Heavy JavaScript sites or bot protection may
          reduce quality—book a call for a deeper pass.
        </p>
      </div>

      <form onSubmit={run} className="space-y-4 rounded-xl border border-aurevo-border bg-aurevo-surface/40 p-6">
        <label className="block text-sm font-medium text-gray-200">
          Website URL
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="mt-2 w-full rounded-lg border border-aurevo-border bg-aurevo-ink px-3 py-2 text-sm text-white outline-none ring-aurevo-accent/30 focus:ring-2"
          />
        </label>
        {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
          <TurnstileField onToken={setTurnstileToken} />
        ) : null}
        <button
          type="submit"
          disabled={
            busy || (!!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken)
          }
          className="rounded-lg bg-aurevo-accent px-4 py-2 text-sm font-semibold text-aurevo-ink disabled:opacity-40"
        >
          {busy ? "Analyzing…" : "Run analysis"}
        </button>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </form>

      {result ? (
        <div className="space-y-6 rounded-xl border border-aurevo-border bg-aurevo-ink/50 p-6">
          {finalUrl ? (
            <p className="text-xs text-gray-500">
              Resolved: <span className="text-gray-300">{finalUrl}</span>
            </p>
          ) : null}
          <section>
            <h2 className="text-lg font-semibold text-white">Summary</h2>
            <p className="mt-2 text-sm text-gray-300">{result.summary}</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white">Quick wins</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-300">
              {result.quickWins.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white">Tools to consider</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-300">
              {result.toolsToConsider.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </section>
          <section className="grid gap-4 sm:grid-cols-2">
            <div>
              <h2 className="text-lg font-semibold text-white">Complexity (AI estimate)</h2>
              <p className="mt-2 text-sm capitalize text-gray-300">{result.complexity}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Risks / limitations</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-300">
                {result.risksOrLimitations.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white">Visitor narrative</h2>
            <div className="mt-2 whitespace-pre-wrap text-sm text-gray-300">
              {result.narrative}
            </div>
          </section>
          <p className="text-sm text-aurevo-accent">{result.nextStepForHumans}</p>
          <Link
            href="/book"
            className="inline-block rounded-lg border border-aurevo-accent/60 px-4 py-2 text-sm font-semibold text-aurevo-accent no-underline"
          >
            Book a consultation →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
