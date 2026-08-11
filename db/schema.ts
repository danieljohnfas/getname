import { sqliteTable, text, integer, primaryKey, unique } from 'drizzle-orm/sqlite-core'

// ─── identities ────────────────────────────────────────────────────────────
// One row per anonymous user. The code_hash is the only way to look them up.
export const identities = sqliteTable('identities', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  code_hash: text('code_hash').notNull().unique(),
  created_at: integer('created_at', { mode: 'number' })
    .notNull()
    .$defaultFn(() => Date.now()),
  last_seen_at: integer('last_seen_at', { mode: 'number' })
    .notNull()
    .$defaultFn(() => Date.now()),
})

// ─── spaces ─────────────────────────────────────────────────────────────────
// Discussion spaces (forums/topics). Exactly one row has is_general = 1 — it is
// seeded at deploy time and must never be deleted.
export const spaces = sqliteTable('spaces', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  is_general: integer('is_general', { mode: 'boolean' }).notNull().default(false),
  creator_id: text('creator_id').references(() => identities.id),
  created_at: integer('created_at', { mode: 'number' })
    .notNull()
    .$defaultFn(() => Date.now()),
})

// ─── memberships ────────────────────────────────────────────────────────────
// Tracks which identities have explicitly joined which spaces.
// The General space is implicitly open to all — no membership row required.
export const memberships = sqliteTable(
  'memberships',
  {
    identity_id: text('identity_id')
      .notNull()
      .references(() => identities.id),
    space_id: text('space_id')
      .notNull()
      .references(() => spaces.id),
    role: text('role', { enum: ['creator', 'moderator', 'member'] })
      .notNull()
      .default('member'),
    joined_at: integer('joined_at', { mode: 'number' })
      .notNull()
      .$defaultFn(() => Date.now()),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.identity_id, t.space_id] }),
  }),
)

// ─── posts ──────────────────────────────────────────────────────────────────
// Posts within a space. parent_post_id is nullable — used for flat replies in
// Phase 1 (nested threading is Phase 2).
export const posts = sqliteTable('posts', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  space_id: text('space_id')
    .notNull()
    .references(() => spaces.id),
  identity_id: text('identity_id')
    .notNull()
    .references(() => identities.id),
  parent_post_id: text('parent_post_id'), // self-reference: references posts.id
  body: text('body').notNull(),
  created_at: integer('created_at', { mode: 'number' })
    .notNull()
    .$defaultFn(() => Date.now()),
  deleted_at: integer('deleted_at', { mode: 'number' }), // null = not deleted
})

// ─── reports ────────────────────────────────────────────────────────────────
// Reports submitted by users for problematic posts.
// Reviewed via the D1 table editor in the Cloudflare dashboard for now (Phase 2
// will add an in-app moderation queue).
export const reports = sqliteTable('reports', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  post_id: text('post_id')
    .notNull()
    .references(() => posts.id),
  reporter_id: text('reporter_id')
    .notNull()
    .references(() => identities.id),
  reason: text('reason').notNull(),
  status: text('status', { enum: ['pending', 'reviewed', 'actioned'] })
    .notNull()
    .default('pending'),
  created_at: integer('created_at', { mode: 'number' })
    .notNull()
    .$defaultFn(() => Date.now()),
},
(t) => ({
  uniqReport: unique().on(t.reporter_id, t.post_id),
}))

export type Identity = typeof identities.$inferSelect
export type Space = typeof spaces.$inferSelect
export type Membership = typeof memberships.$inferSelect
export type Post = typeof posts.$inferSelect
export type Report = typeof reports.$inferSelect
