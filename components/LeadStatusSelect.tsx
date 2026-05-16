"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const statuses = ["new", "contacted", "closed"] as const;

export function LeadStatusSelect({
  id,
  status,
}: {
  id: string;
  status: (typeof statuses)[number];
}) {
  const router = useRouter();
  const [value, setValue] = useState<string>(status);
  const [busy, setBusy] = useState(false);

  async function onChange(next: string) {
    setValue(next);
    setBusy(true);
    await fetch(`/api/admin/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <select
      className="rounded-md border border-aurevo-border bg-aurevo-ink px-2 py-1 text-xs text-white disabled:opacity-50"
      value={value}
      disabled={busy}
      onChange={(e) => void onChange(e.target.value)}
    >
      {statuses.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
