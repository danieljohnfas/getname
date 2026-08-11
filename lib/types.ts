// Shared client-side types used across pages and components.
// These mirror the API response shapes (not the full DB schema).

export interface Post {
  id: string
  body: string
  author_name: string
  created_at: number
  parent_post_id: string | null
  space_id: string
}

export interface Space {
  id: string
  slug: string
  title: string
  description: string
  is_general: boolean
  member_count?: number
  created_at?: number
}
