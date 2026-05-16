import dns from "node:dns/promises";
import net from "node:net";

const BLOCKED_HOSTNAMES = new Set(
  [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
    "metadata.google.internal",
    "metadata",
    "169.254.169.254",
  ].map((h) => h.toLowerCase()),
);

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const norm = ip.toLowerCase();
  if (norm === "::1") return true;
  if (norm.startsWith("fe80:")) return true;
  if (norm.startsWith("fc") || norm.startsWith("fd")) return true;
  if (norm.startsWith("::ffff:")) {
    const v4 = norm.replace("::ffff:", "");
    return net.isIPv4(v4) && isPrivateIpv4(v4);
  }
  return false;
}

export class SsrfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SsrfError";
  }
}

/**
 * Normalize user-submitted URL string and ensure it is http(s) with a safe hostname
 * that does not resolve to a private/link-local address.
 */
export async function assertSafeUrl(urlString: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(urlString.trim());
  } catch {
    throw new SsrfError("Invalid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new SsrfError("Only HTTP and HTTPS URLs are allowed");
  }
  const host = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(host)) {
    throw new SsrfError("Host not allowed");
  }
  if (net.isIP(host)) {
    if (net.isIPv4(host) && isPrivateIpv4(host)) throw new SsrfError("IP not allowed");
    if (net.isIPv6(host) && isPrivateIpv6(host)) throw new SsrfError("IP not allowed");
    return url;
  }
  let records: dns.LookupAddress[];
  try {
    records = await dns.lookup(host, { all: true });
  } catch {
    throw new SsrfError("Could not resolve host");
  }
  for (const r of records) {
    if (net.isIPv4(r.address) && isPrivateIpv4(r.address)) {
      throw new SsrfError("Host resolves to a disallowed address");
    }
    if (net.isIPv6(r.address) && isPrivateIpv6(r.address)) {
      throw new SsrfError("Host resolves to a disallowed address");
    }
  }
  return url;
}

const MAX_BYTES = 1_500_000; // ~1.5MB body cap
const MAX_REDIRECTS = 5;
const FETCH_TIMEOUT_MS = 12_000;

export async function fetchHtmlSafe(url: URL): Promise<{ html: string; finalUrl: string }> {
  let current = url.toString();
  let redirects = 0;
  let html = "";
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    while (redirects <= MAX_REDIRECTS) {
      const target = new URL(current);
      await assertSafeUrl(target.toString());
      const res = await fetch(target.toString(), {
        method: "GET",
        redirect: "manual",
        signal: ac.signal,
        headers: {
          "User-Agent": "AurevoStudioBot/1.0 (+https://aurevo.studio)",
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        },
      });
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        if (!loc) throw new SsrfError("Redirect without location");
        const next = new URL(loc, target);
        current = next.toString();
        redirects += 1;
        continue;
      }
      if (!res.ok) throw new SsrfError(`Fetch failed (${res.status})`);
      const buf = await readBodyWithCap(res.body, MAX_BYTES);
      html = new TextDecoder("utf-8", { fatal: false }).decode(buf);
      return { html, finalUrl: target.toString() };
    }
    throw new SsrfError("Too many redirects");
  } finally {
    clearTimeout(timer);
  }
}

async function readBodyWithCap(
  body: ReadableStream<Uint8Array> | null,
  max: number,
): Promise<Uint8Array> {
  if (!body) return new Uint8Array();
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > max) throw new SsrfError("Response too large");
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.byteLength;
  }
  return out;
}
