import { NextResponse } from "next/server";

/**
 * Multi-tier rate limiter for Nihon Quest API endpoints.
 *
 * Strategy:
 * 1. Synchronous `rateLimit()` / `enforceRateLimit()` uses a bounded in-memory fixed-window
 *    store (capped at MAX_BUCKETS = 5,000 keys to prevent memory exhaustion under spoofed IPs).
 * 2. Asynchronous `rateLimitAsync()` / `enforceRateLimitAsync()` uses Upstash Redis REST API
 *    (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`) when configured for multi-instance
 *    or serverless deployments (Vercel / Netlify), falling back cleanly to the in-memory store
 *    when Redis is not configured or temporarily unreachable.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const SWEEP_INTERVAL_MS = 60_000;
const MAX_BUCKETS = 5_000;
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS && buckets.size < MAX_BUCKETS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  // Hard cap: evict oldest inserted keys if still above MAX_BUCKETS
  while (buckets.size >= MAX_BUCKETS) {
    const oldestKey = buckets.keys().next().value;
    if (!oldestKey) break;
    buckets.delete(oldestKey);
  }
}

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSeconds: number };

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: Math.max(0, limit - 1) };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { ok: true, remaining: Math.max(0, limit - existing.count) };
}

/**
 * Distributed rate limit check via Upstash Redis REST pipeline (`INCR` + `PEXPIRE` + `PTTL`)
 * when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set.
 * Falls back to `rateLimit()` if unconfigured or on network error.
 */
export async function rateLimitAsync(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!redisUrl || !redisToken) {
    return rateLimit(key, limit, windowMs);
  }

  try {
    const namespacedKey = `nq:rl:${key}`;
    const res = await fetch(`${redisUrl.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redisToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", namespacedKey],
        ["PEXPIRE", namespacedKey, String(windowMs), "NX"],
        ["PTTL", namespacedKey],
      ]),
      signal: AbortSignal.timeout(2500),
    });

    if (!res.ok) {
      return rateLimit(key, limit, windowMs);
    }

    const data = (await res.json()) as Array<{ result?: number }>;
    const count = Number(data?.[0]?.result ?? 1);
    const pttl = Number(data?.[2]?.result ?? windowMs);

    if (count > limit) {
      return {
        ok: false,
        retryAfterSeconds: Math.max(1, Math.ceil((pttl > 0 ? pttl : windowMs) / 1000)),
      };
    }

    return { ok: true, remaining: Math.max(0, limit - count) };
  } catch {
    return rateLimit(key, limit, windowMs);
  }
}

export function resetRateLimitKey(key: string): void {
  buckets.delete(key);
}

/** Best-effort client identity from proxy headers. */
export function clientKey(req: Request, scope: string): string {
  const headers = req.headers;
  const forwarded = headers.get("x-forwarded-for");
  const ip =
    (forwarded ? forwarded.split(",")[0]?.trim() : null) ??
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    "unknown";
  return `${scope}:${ip}`;
}

/** Standard 429 response with a Retry-After header. */
export function rateLimited(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Vui lòng thử lại sau." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}

/** Convenience guard: returns a 429 response when the limit is exceeded. */
export function enforceRateLimit(req: Request, scope: string, limit: number, windowMs: number) {
  const result = rateLimit(clientKey(req, scope), limit, windowMs);
  if (!result.ok) return rateLimited(result.retryAfterSeconds);
  return null;
}

/** Async convenience guard backed by Upstash Redis REST when available. */
export async function enforceRateLimitAsync(
  req: Request,
  scope: string,
  limit: number,
  windowMs: number,
) {
  const result = await rateLimitAsync(clientKey(req, scope), limit, windowMs);
  if (!result.ok) return rateLimited(result.retryAfterSeconds);
  return null;
}