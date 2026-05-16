"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useState } from "react";

type Props = {
  onToken: (token: string) => void;
};

export function TurnstileField({ onToken }: Props) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [error, setError] = useState<string | null>(null);

  if (!siteKey) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Turnstile
        siteKey={siteKey}
        onSuccess={(token) => {
          setError(null);
          onToken(token);
        }}
        onError={() => {
          setError("Captcha failed to load. Refresh the page.");
          onToken("");
        }}
        onExpire={() => onToken("")}
      />
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
