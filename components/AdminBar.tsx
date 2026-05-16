"use client";

import { signOut } from "next-auth/react";

export function AdminBar() {
  return (
    <button
      type="button"
      onClick={() => void signOut({ callbackUrl: "/admin/login" })}
      className="rounded-md border border-aurevo-border px-3 py-1.5 text-xs text-gray-200 hover:border-aurevo-accent/50"
    >
      Sign out
    </button>
  );
}
