"use client";

import { useState } from "react";
import { TurnstileField } from "@/components/TurnstileField";

export default function BookPage() {
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
    const payload = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      company: String(fd.get("company") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      clientUrl: String(fd.get("clientUrl") ?? ""),
      preferredTime: String(fd.get("preferredTime") ?? ""),
      message: String(fd.get("message") ?? ""),
      source: "book",
      turnstileToken: turnstileToken || undefined,
    };
    const res = await fetch("/api/leads", {
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
    setMsg("Thanks—your request is in. We will follow up by email.");
    (e.target as HTMLFormElement).reset();
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-white">Book a consultation</h1>
        <p className="mt-3 text-gray-400">
          Tell us what you are trying to automate. We will reply with next steps and, if it is a
          fit, a proposed discovery agenda.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-xl border border-aurevo-border bg-aurevo-surface/40 p-6"
      >
        <Field label="Name" name="name" required />
        <Field label="Work email" name="email" type="email" required />
        <Field label="Company" name="company" />
        <Field label="Phone" name="phone" />
        <Field label="Site URL (optional)" name="clientUrl" type="url" placeholder="https://…" />
        <label className="block text-sm font-medium text-gray-200">
          Preferred times / timezone
          <textarea
            name="preferredTime"
            rows={2}
            className="mt-2 w-full rounded-lg border border-aurevo-border bg-aurevo-ink px-3 py-2 text-sm text-white outline-none ring-aurevo-accent/30 focus:ring-2"
            placeholder="e.g. Tue–Thu mornings, Europe/Berlin"
          />
        </label>
        <label className="block text-sm font-medium text-gray-200">
          What should we know?
          <textarea
            name="message"
            rows={4}
            className="mt-2 w-full rounded-lg border border-aurevo-border bg-aurevo-ink px-3 py-2 text-sm text-white outline-none ring-aurevo-accent/30 focus:ring-2"
            placeholder="Goals, stack, constraints, deadlines…"
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
          Request a call
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

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-medium text-gray-200">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-2 w-full rounded-lg border border-aurevo-border bg-aurevo-ink px-3 py-2 text-sm text-white outline-none ring-aurevo-accent/30 focus:ring-2"
      />
    </label>
  );
}
