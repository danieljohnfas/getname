/**
 * KV-based sliding window rate limiter.
 *
 * Stores an array of request timestamps under a KV key. On each call:
 *  1. Fetch existing timestamps
 *  2. Filter out those older than the window
 *  3. If count < limit, push the current timestamp and save back
 *  4. Return { allowed, remaining }
 *
 * KV keys use expirationTtl = windowSeconds to auto-clean.
 */

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetInSeconds: number
}

export async function checkRateLimit(
  kv: KVNamespace,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const now = Date.now()
  const windowStart = now - windowSeconds * 1000

  // Fetch existing window
  const raw = await kv.get(key, 'text')
  let timestamps: number[] = raw ? (JSON.parse(raw) as number[]) : []

  // Slide the window — discard old timestamps
  timestamps = timestamps.filter((t) => t > windowStart)

  const count = timestamps.length
  const allowed = count < limit

  if (allowed) {
    timestamps.push(now)
    await kv.put(key, JSON.stringify(timestamps), {
      expirationTtl: windowSeconds,
    })
  }

  // Time until the oldest request in this window expires
  const oldestInWindow = timestamps[0] ?? now
  const resetInSeconds = Math.max(
    0,
    Math.ceil((oldestInWindow + windowSeconds * 1000 - now) / 1000),
  )

  return {
    allowed,
    remaining: Math.max(0, limit - timestamps.length),
    resetInSeconds,
  }
}

/**
 * Helpers pre-configured with the limits defined in AGENTS.md.
 */
export const GENERATION_LIMIT = { limit: 20, windowSeconds: 3600 } // 20/hour
export const LOGIN_LIMIT = { limit: 10, windowSeconds: 60 }        // 10/minute
