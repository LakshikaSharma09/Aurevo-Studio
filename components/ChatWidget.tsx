"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TurnstileField } from "@/components/TurnstileField";
import { CHAT_DISCLAIMER_SHORT } from "@/lib/constants";

type Msg = { role: "user" | "assistant"; content: string };

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [pending, setPending] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || pending) return;
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken) return;

    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setPending(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: next,
        turnstileToken: turnstileToken || undefined,
      }),
    });

    if (!res.ok || !res.body) {
      setMessages([
        ...next,
        {
          role: "assistant",
          content: "Sorry, I could not reach the assistant. Try again in a moment.",
        },
      ]);
      setPending(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let acc = "";
    setMessages([...next, { role: "assistant", content: "" }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      acc += decoder.decode(value, { stream: true });
      setMessages([...next, { role: "assistant", content: acc }]);
    }
    setPending(false);
  }, [input, messages, pending, turnstileToken]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-40 rounded-full bg-aurevo-accent px-5 py-3 text-sm font-semibold text-aurevo-ink shadow-lg shadow-aurevo-accent/20 hover:bg-teal-300"
      >
        {open ? "Close" : "Ask Aurevo"}
      </button>

      {open ? (
        <div className="fixed bottom-24 right-6 z-40 flex h-[min(520px,80vh)] w-[min(400px,92vw)] flex-col overflow-hidden rounded-2xl border border-aurevo-border bg-aurevo-surface shadow-2xl">
          <div className="border-b border-aurevo-border px-4 py-3">
            <p className="text-sm font-semibold text-white">Aurevo Assistant</p>
            <p className="text-xs text-gray-400">{CHAT_DISCLAIMER_SHORT}</p>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
            {messages.length === 0 ? (
              <p className="text-gray-400">
                Ask how we automate sites, what an engagement looks like, or what to prepare
                before a discovery call.
              </p>
            ) : null}
            {messages.map((m, i) => (
              <div
                key={`${i}-${m.role}`}
                className={
                  m.role === "user"
                    ? "ml-8 rounded-lg bg-aurevo-border/60 px-3 py-2 text-gray-100"
                    : "mr-8 whitespace-pre-wrap rounded-lg bg-aurevo-ink px-3 py-2 text-gray-200"
                }
              >
                {m.content}
              </div>
            ))}
            <div ref={endRef} />
          </div>
          {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
            <div className="border-t border-aurevo-border px-3 py-2">
              <TurnstileField onToken={setTurnstileToken} />
              {!turnstileToken ? (
                <p className="mt-1 text-xs text-amber-200/90">Complete the check to send.</p>
              ) : null}
            </div>
          ) : null}
          <div className="flex gap-2 border-t border-aurevo-border p-3">
            <input
              className="flex-1 rounded-lg border border-aurevo-border bg-aurevo-ink px-3 py-2 text-sm text-white outline-none ring-aurevo-accent/40 placeholder:text-gray-500 focus:ring-2"
              placeholder="Message…"
              value={input}
              disabled={pending}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={
                pending ||
                !input.trim() ||
                (!!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken)
              }
              className="rounded-lg bg-aurevo-accent px-3 py-2 text-sm font-semibold text-aurevo-ink disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
