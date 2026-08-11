import type { Config } from 'drizzle-kit'

/**
 * drizzle-kit config for migrations and studio.
 *
 * For local dev migrations, use wrangler directly:
 *   wrangler d1 execute DB --local --file=./drizzle/0000_init.sql
 *   wrangler d1 execute DB --local --file=./drizzle/0001_seed_general.sql
 *
 * For remote (production) migrations:
 *   wrangler d1 execute DB --file=./drizzle/0000_init.sql
 */
export default {
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? '',
    databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID ?? '',
    token: process.env.CLOUDFLARE_API_TOKEN ?? '',
  },
} satisfies Config
