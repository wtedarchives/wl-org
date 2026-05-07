// Types and constants shared between the admin panel and the wted-episodes-admin Edge Function.
// All database operations have moved to supabase/functions/wted-episodes-admin/index.ts.

export type WtedEpisodeRadioSyncRow = {
  uuid: string
  radio_id: string
  episode: string
  artwork: string | null
  status: string | null
  display_name: string | null
  show: string
  order: number | null
  host: unknown
}

export type RadioCoStudioPlaylist = {
  id: number
  name: string
  artwork?: { large_url?: string | null } | null
  metadata?: { artist?: string; title?: string } | null
}

/** `wted_shows.show` for rows inserted by playlist sync (must exist in `wted_shows`). */
export const WTED_EPISODE_RADIO_SYNC_DEFAULT_SHOW = "Unsorted" as const

export const WTED_EPISODE_RADIO_SYNC_SELECT =
  "uuid, radio_id, episode, artwork, status, display_name, show, order, host" as const
