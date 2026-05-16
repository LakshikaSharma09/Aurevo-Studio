"use client";

import { useState } from "react";
import { TurnstileField } from "@/components/TurnstileField";

export default function FeedbackPage() {
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [msg, setMsg] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("idle");
    setMsg(null);
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken) {
      setStatus("err");
      setMsg("Complete the captcha.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const ratingRaw = fd.get("rating");
    const payload = {
      message: String(fd.get("message") ?? ""),
      email: String(fd.get("email") ?? ""),
      category: String(fd.get("category") ?? ""),
      rating: ratingRaw ? Number(ratingRaw) : undefined,
      turnstileToken: turnstileToken || undefined,
    };
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      setStatus("err");
      setMsg(data.error ?? "Could not submit. Try again.");
      return;
    }
    setStatus("ok");
    setMsg("Thank you for the feedback—we read every note.");
    (e.target as HTMLFormElement).reset();
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-white">Feedback</h1>
        <p className="mt-3 text-gray-400">
          We use the same structured capture we recommend to clients. Help us improve the studio
          experience.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-xl border border-aurevo-border bg-aurevo-surface/40 p-6"
      >
        <label className="block text-sm font-medium text-gray-200">
          Message
          <textarea
            name="message"
            required
            minLength={5}
            rows={5}
            className="mt-2 w-full rounded-lg border border-aurevo-border bg-aurevo-ink px-3 py-2 text-sm text-white outline-none ring-aurevo-accent/30 focus:ring-2"
          />
        </label>
        <label className="block text-sm font-medium text-gray-200">
          Email (optional)
          <input
            name="email"
            type="email"
            className="mt-2 w-full rounded-lg border border-aurevo-border bg-aurevo-ink px-3 py-2 text-sm text-white outline-none ring-aurevo-accent/30 focus:ring-2"
          />
        </label>
        <label className="block text-sm font-medium text-gray-200">
          Category
          <input
            name="category"
            className="mt-2 w-full rounded-lg border border-aurevo-border bg-aurevo-ink px-3 py-2 text-sm text-white outline-none ring-aurevo-accent/30 focus:ring-2"
            placeholder="e.g. pricing, product, bug"
          />
        </label>
        <label className="block text-sm font-medium text-gray-200">
          Rating (1–5, optional)
          <input
            name="rating"
            type="number"
            min={1}
            max={5}
            className="mt-2 w-full rounded-lg border border-aurevo-border bg-aurevo-ink px-3 py-2 text-sm text-white outline-none ring-aurevo-accent/30 focus:ring-2"
          />
        </label>
        {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
          <TurnstileField onToken={setTurnstileToken} />
        ) : null}
        <button
          type="submit"
          disabled={!!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken}
          className="rounded-lg bg-aurevo-accent px-4 py-2 text-sm font-semibold text-aurevo-ink disabled:opacity-40"
        >
          Send feedback
        </button>
        {status === "ok" ? (
          <p className="text-sm text-aurevo-accent">{msg}</p>
        ) : status === "err" ? (
          <p className="text-sm text-red-400">{msg}</p>
        ) : null}
      </form>
    </div>
  );
}
