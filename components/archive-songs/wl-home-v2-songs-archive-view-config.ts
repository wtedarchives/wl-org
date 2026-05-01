import {
  WL_V2_ARCHIVES_BREADCRUMB_ROOT,
  type BreadcrumbItem,
} from "@/components/setlist-breadcrumb-context"

export type SongsArchiveSortKey = "song" | "song_category" | "song_originalartist"
export type SongsArchiveFilterKind = "cat" | "artist" | "perf"

export const SONGS_ARCHIVE_FILTER_MODAL_META: Record<
  SongsArchiveFilterKind,
  { title: string; description: string }
> = {
  cat: {
    title: "Filter by category",
    description:
      "Show songs from the categories you pick. Clear the filter to include every category again.",
  },
  artist: {
    title: "Filter by original artist",
    description:
      "Show songs credited to any artist you pick. Clear the filter to include all artists.",
  },
  perf: {
    title: "Filter by performer",
    description:
      "Show songs that appear under the selected performers in the archive. Clear the filter to include all.",
  },
}

export function replaceSongsArchiveUrlViewParam(view: "categories" | "list") {
  if (typeof window === "undefined") return
  const url = new URL(window.location.href)
  if (view === "list") url.searchParams.set("view", "list")
  else url.searchParams.delete("view")
  window.history.replaceState(null, "", url)
}

export const SONGS_ARCHIVE_BREADCRUMBS: BreadcrumbItem[] = [
  WL_V2_ARCHIVES_BREADCRUMB_ROOT,
  { label: "Songs", href: "/archive/songs" },
]
