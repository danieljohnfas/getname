# Anonboard — Agent Architecture Reference

This file is the authoritative reference for all agents working on this codebase.
Read it before writing any code.

---

## Runtime

This project runs on **Cloudflare Workers** (via Cloudflare Pages + OpenNext), NOT Node.js.

Critical consequences:
- Use **Web Crypto API** (`crypto.subtle`, `crypto.getRandomValues`) for all cryptography — never `require('crypto')` or `crypto.createHmac`
- No `fs`, `Buffer`, `process.env` in route handlers — use Cloudflare `env` bindings
- No Node-specific APIs. If in doubt, check the [Workers runtime compatibility list](https://developers.cloudflare.com/workers/runtime-apis/)

## Cloudflare Bindings

Accessed via `getCloudflareContext()` from `@opennextjs/cloudflare` in route handlers.

```typescript
import { getCloudflareContext } from '@opennextjs/cloudflare'
const { env } = await getCloudflareContext()
// env.DB            → D1Database
// env.RATE_LIMIT_KV → KVNamespace
// env.SERVER_PEPPER → string (secret, never log)
// env.SESSION_SECRET → string (secret, never log)
// env.TURNSTILE_SECRET_KEY → string
```

In local dev, bindings come from `wrangler.toml` + `.dev.vars`.

## Database

- **Engine**: Cloudflare D1 (SQLite-compatible)
- **ORM**: Drizzle ORM with `drizzle-orm/d1` adapter
- **Access**: Always via `getDb(env.DB)` from `@/db/index` — never import db directly in client components
- **Schema file**: `db/schema.ts`
- **Migrations**: Apply with `npm run db:migrate:local` (local) or `npm run db:migrate:remote` (production)
- **IDs**: All PKs are `text` using `crypto.randomUUID()` as default

## Identity System

### Code Format
`word1-word2-word3-word4-word5-NN` — 5 words from the EFF long wordlist + zero-padded 2-digit number.
Example: `amber-falcon-brook-marsh-quill-92`
Entropy: ~71 bits. Effectively unguessable by brute force.

### Hashing (HMAC-SHA-256 via Web Crypto)
```typescript
// lib/identity/generate.ts
export async function hashCode(code: string, pepper: string): Promise<string>
```
- Normalise first: `code.trim().toLowerCase()`
- Uses `crypto.subtle` — NOT Node `crypto.createHmac`
- The `pepper` is `env.SERVER_PEPPER` — **NEVER rotate it** — doing so invalidates all user codes
- Storage: `code_hash` column in `identities` table, unique + indexed. Login is a direct `WHERE code_hash = ?` lookup (O(1))

**NEVER log the plaintext code anywhere.**

### Per-Space Pseudonyms
```typescript
// lib/identity/generate.ts
export async function deriveSpacePseudonym(
  identityId: string, spaceId: string, pepper: string
): Promise<string>
```
- Deterministic: same `(identityId, spaceId)` → same display name always
- Isolated: different `spaceId` → completely different name (prevents cross-space correlation)
- No DB column — derived at read time
- Format: `"Quiet Falcon 42"` (Adjective + Animal + 2-digit number)

## Session

- Library: `iron-session`
- Cookie name: `anonboard_session`
- Cookie flags: `httpOnly: true`, `secure: true`, `sameSite: 'lax'`, `maxAge: 30 days`
- Session data shape: `{ identityId: string }`
- Session secret from: `env.SESSION_SECRET`

## Rate Limiting

- Implementation: KV-based sliding window in `lib/ratelimit.ts`
- KV namespace binding: `RATE_LIMIT_KV`
- Limits:
  - Code generation (`/api/generate-code`): 20 requests/hour per IP
  - Login (`/api/login`): 10 requests/minute per IP

## Auth Rules

- All `/api/*` routes except `/api/generate-code`, `/api/login`, and `/api/me` require a valid session
- Check session before ANY database operation
- Generic 401 on auth failure — never reveal whether a code exists vs. is malformed
- Middleware in `middleware.ts` redirects unauthenticated users away from `/general` and `/spaces/*`

## Build & Deploy Commands

```bash
npm run dev                 # Local dev (Turbopack)
npm run pages:build         # Build for Cloudflare Pages (OpenNext)
npm run pages:preview       # Build + local Wrangler preview
npm run pages:deploy        # Build + deploy to Cloudflare Pages
npm run db:migrate:local    # Apply migrations to local D1
npm run db:seed:local       # Seed General space locally
npm run db:migrate:remote   # Apply migrations to production D1
npm run db:seed:remote      # Seed General space in production
npm test                    # Run Vitest unit tests
```

## Phase Boundary

**Phase 1 (built):** Code generation, login, session, rate limiting, General space, create/browse/join spaces, post + flat replies, per-space pseudonyms, report-a-post, Terms page.

**Phase 2 (do NOT build yet):** Nested replies, in-app moderation queue, notifications, search, reactions, private spaces.
