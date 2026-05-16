type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 60_000;
const MAX_PUBLIC = 30;

function keyFor(ip: string, route: string): string {
  return `${route}:${ip}`;
}

function getClientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

/**
 * Simple in-memory sliding window per IP + route label.
 * For multi-instance production deployments, prefer Upstash or similar.
 */
export function rateLimitPublic(req: Request, routeLabel: string): { ok: true } | { ok: false } {
  const ip = getClientIp(req);
  const key = keyFor(ip, routeLabel);
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    b = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, b);
  }
  b.count += 1;
  if (b.count > MAX_PUBLIC) {
    return { ok: false };
  }
  return { ok: true };
}

export function getClientIpFromRequest(req: Request): string {
  return getClientIp(req);
}
