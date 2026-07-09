import type { QueryClient } from "@tanstack/react-query"

import { archiveQueryKeys } from "@/lib/archive-query-keys"
import { fetchSetlistCore } from "@/lib/archive/fetch-setlist-core"
import { fetchSongCore } from "@/lib/archive/fetch-song-core"
import { fetchTourCore } from "@/lib/archive/fetch-tour-core"

import type { ArchivePrefetchTarget } from "./parse-archive-prefetch-target"

const MAX_PREFETCH_IN_FLIGHT = 3

let prefetchInFlight = 0

export async function prefetchArchiveTarget(
  queryClient: QueryClient,
  target: ArchivePrefetchTarget,
  profileId: string | null,
): Promise<void> {
  if (prefetchInFlight >= MAX_PREFETCH_IN_FLIGHT) return

  prefetchInFlight += 1
  try {
    switch (target.kind) {
      case "setlist":
        await queryClient.prefetchQuery({
          queryKey: archiveQueryKeys.setlistCore(target.id),
          queryFn: () => fetchSetlistCore(target.id),
        })
        break
      case "song":
        await queryClient.prefetchQuery({
          queryKey: archiveQueryKeys.songCore(target.id),
          queryFn: () => fetchSongCore(target.id),
        })
        break
      case "tour":
        await queryClient.prefetchQuery({
          queryKey: archiveQueryKeys.tourCore(target.id, profileId),
          queryFn: () => fetchTourCore(target.id, profileId),
        })
        break
    }
  } finally {
    prefetchInFlight -= 1
  }
}
