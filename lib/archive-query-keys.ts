/** Client-side archive query keys (React Query). */

export const ARCHIVE_QUERY_STALE_MS = 60_000

export const archiveQueryKeys = {
  all: ["archive"] as const,
  setlistCore: (showId: string) =>
    [...archiveQueryKeys.all, "setlist", "core", showId] as const,
  songCore: (songId: string) =>
    [...archiveQueryKeys.all, "song", "core", songId] as const,
  tourCore: (tourId: string, profileId: string | null) =>
    [
      ...archiveQueryKeys.all,
      "tour",
      "core",
      tourId,
      profileId ?? "anonymous",
    ] as const,
}
