/** One WTED episode listing line (same performance may appear in multiple episodes). */
export interface SongWtedAirplayEpisodeLine {
  eeUuid: string
  /** `wted_episodes.uuid` — use with `getWtedEpisodeUrl`. */
  episodeUuid: string
  episodeCode: string
  episodeDisplayName: string | null
  wtedSeries: string
}

/** Rows in `wted_episode_entries` grouped by one setlist performance (`entry_id`). */
export interface SongWtedAirplayGroup {
  setlistEntryId: string
  showId: string | null
  showDate: string | null
  venueLocation: string | null
  episodes: SongWtedAirplayEpisodeLine[]
}

/** @internal Flat row before grouping */
export interface SongWtedAirplayRow {
  eeUuid: string
  setlistEntryId: string
  showId: string | null
  showDate: string | null
  venueLocation: string | null
  episodeUuid: string
  episodeCode: string
  episodeDisplayName: string | null
  wtedSeries: string
}
