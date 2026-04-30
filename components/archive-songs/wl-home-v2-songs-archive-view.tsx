"use client"

import Image from "next/image"
import Link from "next/link"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import {
  SongsArchiveListFilterModal,
  SongsArchiveListSearchModal,
} from "@/components/archive-songs/wl-home-v2-songs-archive-list-modals"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { SongsArchiveCategoriesGrid } from "@/components/archive-songs/songs-archive-categories-grid"
import {
  buildSongsByCategory,
  groupCategoriesBySection,
  performerOptions,
} from "@/components/archive-songs/songs-archive-helpers"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  type SongsArchiveSong,
  useSongsArchiveData,
} from "@/hooks/use-songs-archive-data"
import { getSongArchiveUrl } from "@/lib/song-archive-url"

import "./songs-archive-verbatim.css"

type SortKey = "song" | "song_category" | "song_originalartist"
type FilterKind = "cat" | "artist" | "perf"

const FILTER_MODAL_META: Record<
  FilterKind,
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

function replaceUrlViewParam(view: "categories" | "list") {
  if (typeof window === "undefined") return
  const url = new URL(window.location.href)
  if (view === "list") url.searchParams.set("view", "list")
  else url.searchParams.delete("view")
  window.history.replaceState(null, "", url)
}

export function WlHomeV2SongsArchiveView() {
  const { categories, songs, performerBySong, loading, error } =
    useSongsArchiveData()

  const songsByCategory = useMemo(
    () => buildSongsByCategory(categories, songs),
    [categories, songs],
  )
  const categoriesBySection = useMemo(
    () => groupCategoriesBySection(categories),
    [categories],
  )

  const categoryOptions = useMemo(
    () => categories.map((c) => c.category),
    [categories],
  )
  const artistOptions = useMemo(
    () =>
      [...new Set(songs.map((s) => s.song_originalartist?.trim()
        ? s.song_originalartist
        : "—"))].sort((a, b) => {
        if (a === "—") return 1
        if (b === "—") return -1
        return a.localeCompare(b)
      }),
    [songs],
  )
  const perfOpts = useMemo(
    () => performerOptions(performerBySong),
    [performerBySong],
  )

  const [activeView, setActiveView] = useState<"categories" | "list">(
    "categories",
  )

  useEffect(() => {
    try {
      if (
        typeof window !== "undefined" &&
        new URL(window.location.href).searchParams.get("view") === "list"
      ) {
        setActiveView("list")
      }
    } catch {
      /* ignore */
    }
  }, [])

  const [sortKey, setSortKey] = useState<SortKey>("song")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [selectedCats, setSelectedCats] = useState(() => new Set<string>())
  const [selectedArtists, setSelectedArtists] = useState(() => new Set<string>())
  const [selectedPerfs, setSelectedPerfs] = useState(() => new Set<string>())
  const [openFilter, setOpenFilter] = useState<FilterKind | null>(null)

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)

  useWlHomeV2ScrollLock(searchOpen || openFilter !== null)

  const setView = useCallback((v: "categories" | "list") => {
    setActiveView(v)
    replaceUrlViewParam(v)
  }, [])

  const filteredSortedList = useMemo(() => {
    let list: SongsArchiveSong[] = songs.filter((s) => {
      if (selectedCats.size && !selectedCats.has(s.song_category)) return false
      const artistKey = s.song_originalartist?.trim()
        ? s.song_originalartist
        : "—"
      if (selectedArtists.size && !selectedArtists.has(artistKey)) return false
      if (selectedPerfs.size) {
        const perfs = performerBySong[s.song] ?? []
        if (!perfs.some((p) => selectedPerfs.has(p))) return false
      }
      return true
    })

    const mult = sortDir === "asc" ? 1 : -1
    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sortKey === "song") cmp = a.song.localeCompare(b.song)
      else if (sortKey === "song_category")
        cmp = a.song_category.localeCompare(b.song_category)
      else {
        cmp = (a.song_originalartist || "").localeCompare(
          b.song_originalartist || "",
        )
      }
      return cmp * mult
    })
    return list
  }, [
    songs,
    performerBySong,
    selectedCats,
    selectedArtists,
    selectedPerfs,
    sortDir,
    sortKey,
  ])

  const searchHits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let list = [...songs]
    if (q) {
      list = songs.filter(
        (s) =>
          (s.song_displayname || s.song).toLowerCase().includes(q) ||
          s.song.toLowerCase().includes(q) ||
          s.song_category.toLowerCase().includes(q) ||
          (s.song_originalartist || "").toLowerCase().includes(q),
      )
    }
    list.sort((a, b) => a.song.localeCompare(b.song))
    return list.slice(0, 60)
  }, [searchQuery, songs])

  const catArtworkByName = useMemo(() => {
    const m: Record<string, string> = {}
    for (const c of categories) {
      const url = c.category_artwork?.trim()
      if (url) m[c.category] = url
    }
    return m
  }, [categories])

  const closeSearch = useCallback(() => {
    setSearchOpen(false)
    setSearchQuery("")
  }, [])

  const openSearch = useCallback(() => {
    setOpenFilter(null)
    setSearchOpen(true)
    setSearchQuery("")
  }, [])

  const toggleFilterSheet = useCallback((kind: FilterKind) => {
    setSearchOpen(false)
    setSearchQuery("")
    setOpenFilter((prev) => (prev === kind ? null : kind))
  }, [])

  function onSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (searchOpen) {
          setSearchOpen(false)
          setSearchQuery("")
        } else if (openFilter !== null) {
          setOpenFilter(null)
        }
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpenFilter(null)
        setSearchOpen(true)
        setSearchQuery("")
        setTimeout(() => searchInputRef.current?.focus(), 40)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [searchOpen, openFilter])

  useEffect(() => {
    if (!searchOpen) return
    setTimeout(() => searchInputRef.current?.focus(), 40)
  }, [searchOpen])

  if (loading) {
    return (
      <div className="songs-archive-verbatim min-w-0 flex-1">
        <WlHomeV2PageLoading message="Loading songs data…" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="songs-archive-verbatim min-w-0 flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="widget-panel py-10 text-center">
          <p className="text-sm text-white/65">
            Trouble loading songs. Please reload the page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="songs-archive-verbatim wl-home-v2-songs-archive-page box-border flex min-h-0 min-w-0 w-full flex-1 flex-col px-4 py-5 sm:px-5 lg:px-[18px] lg:py-6"
    >
      <div className="wl-home-v2-setlist-crumbs-bar mb-6 md:mb-8">
        <nav
          className="wl-home-v2-setlist-crumbs-trail"
          aria-label="Page"
        >
          <span className="here" aria-current="page">
            Songs
          </span>
        </nav>
        <div
          className="wl-home-v2-setlist-crumbs-selectors"
          aria-label="Songs view"
        >
          <div className="head-controls">
            <div className="view-toggle">
              <button
                type="button"
                id="viewCategories"
                className={activeView === "categories" ? "active" : undefined}
                title="Categories"
                onClick={() => setView("categories")}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
                <span>Categories</span>
              </button>
              <button
                type="button"
                id="viewList"
                title="List"
                className={activeView === "list" ? "active" : undefined}
                onClick={() => setView("list")}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <circle cx="4" cy="6" r="1" />
                  <circle cx="4" cy="12" r="1" />
                  <circle cx="4" cy="18" r="1" />
                </svg>
                <span>List</span>
              </button>
            </div>
            <button
              type="button"
              className="search-btn"
              id="openSearch"
              title="Search songs"
              aria-label="Search songs"
              onClick={openSearch}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div id="categoriesView" className="min-w-0" hidden={activeView !== "categories"}>
        <SongsArchiveCategoriesGrid
          categoriesBySection={categoriesBySection}
          songsByCategory={songsByCategory}
        />
      </div>

      <div
        id="listView"
        className="wl-home-v2-songs-archive-list-view"
        hidden={activeView !== "list"}
      >
        <div className="wl-home-v2-songs-archive-list-inset">
          <div className="widget-panel wl-home-v2-years-shows-panel wl-home-v2-years-shows-panel--natural wl-home-v2-songs-archive-list-panel">
            <div className="wl-home-v2-years-table-scroll wl-home-v2-songs-archive-list-scroll">
              <Table className="wl-home-v2-years-table wl-home-v2-songs-archive-list-table">
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <div className="songs-archive-list-hdr-col">
                      <button
                        type="button"
                        className={cn(
                          "songs-archive-list-hdr-btn",
                          sortKey === "song" &&
                            "songs-archive-list-hdr-btn--active",
                        )}
                        data-sort="song"
                        onClick={() => onSort("song")}
                      >
                        Song
                      </button>
                      <button
                        type="button"
                        className="songs-archive-list-hdr-btn songs-archive-list-hdr-btn--icononly"
                        id="openSearchInTable"
                        aria-label="Search"
                        onClick={openSearch}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <circle cx="11" cy="11" r="7" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                      </button>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="songs-archive-list-hdr-col">
                      <button
                        type="button"
                        className={cn(
                          "songs-archive-list-hdr-btn",
                          sortKey === "song_category" &&
                            "songs-archive-list-hdr-btn--active",
                        )}
                        data-sort="song_category"
                        onClick={() => onSort("song_category")}
                      >
                        Category
                      </button>
                      <button
                        type="button"
                        className={cn(
                          "songs-archive-list-hdr-btn songs-archive-list-hdr-btn--icononly",
                          selectedCats.size > 0 &&
                            "songs-archive-list-hdr-btn--active",
                        )}
                        data-filter="cat"
                        aria-label="Filter category"
                        onClick={() => toggleFilterSheet("cat")}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                        </svg>
                      </button>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="songs-archive-list-hdr-col">
                      <button
                        type="button"
                        className={cn(
                          "songs-archive-list-hdr-btn",
                          sortKey === "song_originalartist" &&
                            "songs-archive-list-hdr-btn--active",
                        )}
                        data-sort="song_originalartist"
                        onClick={() => onSort("song_originalartist")}
                      >
                        Original artist
                      </button>
                      <button
                        type="button"
                        className={cn(
                          "songs-archive-list-hdr-btn songs-archive-list-hdr-btn--icononly",
                          selectedArtists.size > 0 &&
                            "songs-archive-list-hdr-btn--active",
                        )}
                        data-filter="artist"
                        aria-label="Filter artist"
                        onClick={() => toggleFilterSheet("artist")}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                        </svg>
                      </button>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="songs-archive-list-hdr-col">
                      <span className="songs-archive-list-hdr-label">
                        Performed by
                      </span>
                      <button
                        type="button"
                        className={cn(
                          "songs-archive-list-hdr-btn songs-archive-list-hdr-btn--icononly",
                          selectedPerfs.size > 0 &&
                            "songs-archive-list-hdr-btn--active",
                        )}
                        data-filter="perf"
                        aria-label="Filter performer"
                        onClick={() => toggleFilterSheet("perf")}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                        </svg>
                      </button>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody id="listBody">
                {filteredSortedList.map((s) => {
                  const perfs = performerBySong[s.song] ?? []
                  const catArt = catArtworkByName[s.song_category]
                  return (
                    <TableRow key={s.song_id}>
                      <TableCell className="songs-archive-list-song-cell">
                        <Link
                          href={getSongArchiveUrl(s.song_id)}
                          data-song={s.song}
                        >
                          <SongDisplayName
                            song={s.song}
                            songDisplayName={s.song_displayname}
                          />
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="songs-archive-list-cat-cell-inner">
                          {catArt ?
                            <Image
                              src={catArt}
                              alt=""
                              width={22}
                              height={22}
                              className="songs-archive-list-cat-thumb"
                              unoptimized
                            />
                          : <span
                              className="songs-archive-list-cat-thumb-fallback"
                              aria-hidden
                            />}
                          <span className="songs-archive-list-cat-name">
                            {s.song_category}
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="songs-archive-list-artist-cell">
                        {s.song_originalartist || "—"}
                      </TableCell>
                      <TableCell className="songs-archive-list-perf-cell">
                        <span className="songs-archive-list-perf-cell-inner">
                          {perfs.map((p) => (
                            <span key={p} className="songs-archive-perf-pill">
                              {p}
                            </span>
                          ))}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      <SongsArchiveListSearchModal
        open={searchOpen}
        onClose={closeSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchHits={searchHits}
        searchInputRef={searchInputRef}
      />
      {openFilter !== null ?
        <SongsArchiveListFilterModal
          title={FILTER_MODAL_META[openFilter].title}
          description={FILTER_MODAL_META[openFilter].description}
          options={
            openFilter === "cat" ? categoryOptions
            : openFilter === "artist" ? artistOptions
            : perfOpts
          }
          selected={
            openFilter === "cat" ? selectedCats
            : openFilter === "artist" ? selectedArtists
            : selectedPerfs
          }
          setSelected={
            openFilter === "cat" ? setSelectedCats
            : openFilter === "artist" ? setSelectedArtists
            : setSelectedPerfs
          }
          onClose={() => setOpenFilter(null)}
        />
      : null}
    </div>
  )
}
