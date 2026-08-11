import { drizzle } from 'drizzle-orm/d1'
import type { D1Database, KVNamespace } from '@cloudflare/workers-types'
import * as schema from './schema'

export { schema }

/**
 * Cloudflare environment bindings.
 * Injected at runtime via Cloudflare Pages Functions — not available at build time.
 */
export interface CloudflareEnv {
  DB: D1Database
  RATE_LIMIT_KV: KVNamespace
  SERVER_PEPPER: string
  SESSION_SECRET: string
  TURNSTILE_SECRET_KEY: string
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: string
}

/**
 * Get a Drizzle D1 database instance.
 *
 * Usage in a route handler or server component:
 *   import { getRequestContext } from '@cloudflare/next-on-pages'
 *   import { getDb } from '@/db/index'
 *   const { env } = getRequestContext()
 *   const db = getDb(env.DB)
 */
export function getDb(d1: D1Database) {
  return drizzle(d1, { schema })
}

export type Db = ReturnType<typeof getDb>
