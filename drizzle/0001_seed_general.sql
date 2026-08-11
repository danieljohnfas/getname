-- Seed the General space
-- This is the single, undeletable space that all users can post in.
-- Apply after 0000_init.sql
-- is_general = 1 → this space is pinned and cannot be deleted

INSERT OR IGNORE INTO `spaces` (
  `id`,
  `slug`,
  `title`,
  `description`,
  `is_general`,
  `creator_id`,
  `created_at`
) VALUES (
  'general-space-seed-id-0000000001',
  'general',
  'General',
  'A place for anything. The default space for all users.',
  1,
  NULL,
  unixepoch() * 1000
);
