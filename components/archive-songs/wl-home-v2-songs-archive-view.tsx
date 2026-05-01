"use client"

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
import {
  replaceSongsArchiveUrlViewParam,
  SONGS_ARCHIVE_BREADCRUMBS,
  SONGS_ARCHIVE_FILTER_MODAL_META,
  type SongsArchiveFilterKind,
  type SongsArchiveSortKey,
} from "@/components/archive-songs/wl-home-v2-songs-archive-view-config"
import { WlHomeV2SongsArchiveListPanel } from "@/components/archive-songs/wl-home-v2-songs-archive-list-panel"
import { SongsArchiveCategoriesGrid } from "@/components/archive-songs/songs-archive-categories-grid"
import {
  buildSongsByCategory,
  groupCategoriesBySection,
  performerOptions,
  songsArchiveSearchHits,
} from "@/components/archive-songs/songs-archive-helpers"
import {
  WlHomeV2ArchiveCrumbsShell,
  WlHomeV2ArchiveCrumbsTrail,
} from "@/components/wl-home-v2/wl-home-v2-archive-crumbs"
import { useWlHomeV2OpenArchiveHub } from "@/components/wl-home-v2/wl-home-v2-open-archive-hub-context"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import {
  type SongsArchiveSong,
  useSongsArchiveData,
} from "@/hooks/use-songs-archive-data"

import "./songs-archive-verbatim.css"

export function WlHomeV2SongsArchiveView() {
  const openArchiveHub = useWlHomeV2OpenArchiveHub()
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

  const [sortKey, setSortKey] = useState<SongsArchiveSortKey>("song")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [selectedCats, setSelectedCats] = useState(() => new Set<string>())
  const [selectedArtists, setSelectedArtists] = useState(() => new Set<string>())
  const [selectedPerfs, setSelectedPerfs] = useState(() => new Set<string>())
  const [openFilter, setOpenFilter] = useState<SongsArchiveFilterKind | null>(
    null,
  )

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)

  useWlHomeV2ScrollLock(searchOpen || openFilter !== null)

  const setView = useCallback((v: "categories" | "list") => {
    setActiveView(v)
    replaceSongsArchiveUrlViewParam(v)
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

  const searchHits = useMemo(
    () => songsArchiveSearchHits(songs, searchQuery),
    [searchQuery, songs],
  )

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

  const toggleFilterSheet = useCallback((kind: SongsArchiveFilterKind) => {
    setSearchOpen(false)
    setSearchQuery("")
    setOpenFilter((prev) => (prev === kind ? null : kind))
  }, [])

  function onSort(key: SongsArchiveSortKey) {
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
      <WlHomeV2ArchiveCrumbsShell
        variant="page-gutter"
        selectorsAriaLabel="Songs view"
        trail={
          <WlHomeV2ArchiveCrumbsTrail
            items={SONGS_ARCHIVE_BREADCRUMBS}
            openArchiveHub={openArchiveHub ?? undefined}
          />
        }
        selectors={
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
              <span>Search</span>
            </button>
          </div>
        }
      />

      <div id="categoriesView" className="min-w-0" hidden={activeView !== "categories"}>
        <SongsArchiveCategoriesGrid
          categoriesBySection={categoriesBySection}
          songsByCategory={songsByCategory}
        />
      </div>

      <WlHomeV2SongsArchiveListPanel
        sortKey={sortKey}
        onSort={onSort}
        openSearch={openSearch}
        toggleFilterSheet={toggleFilterSheet}
        selectedCats={selectedCats}
        selectedArtists={selectedArtists}
        selectedPerfs={selectedPerfs}
        filteredSortedList={filteredSortedList}
        performerBySong={performerBySong}
        catArtworkByName={catArtworkByName}
        listHidden={activeView !== "list"}
      />

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
          title={SONGS_ARCHIVE_FILTER_MODAL_META[openFilter].title}
          description={SONGS_ARCHIVE_FILTER_MODAL_META[openFilter].description}
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
