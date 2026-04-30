"use client"

import Link from "next/link"
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { SongDisplayName } from "@/components/dpro/song-display-name"
import { SongsArchiveCategoriesGrid } from "@/components/archive-songs/songs-archive-categories-grid"
import {
  buildSongsByCategory,
  groupCategoriesBySection,
  performerOptions,
  performerPillClass,
} from "@/components/archive-songs/songs-archive-helpers"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import {
  type SongsArchiveSong,
  useSongsArchiveData,
} from "@/hooks/use-songs-archive-data"
import { getSongArchiveUrl } from "@/lib/song-archive-url"

import "./songs-archive-verbatim.css"

type SortKey = "song" | "song_category" | "song_originalartist"
type FilterKind = "cat" | "artist" | "perf"

function toggleInSet(copy: Set<string>, value: string, on: boolean) {
  const n = new Set(copy)
  if (on) n.add(value)
  else n.delete(value)
  return n
}

function replaceUrlViewParam(view: "categories" | "list") {
  if (typeof window === "undefined") return
  const url = new URL(window.location.href)
  if (view === "list") url.searchParams.set("view", "list")
  else url.searchParams.delete("view")
  window.history.replaceState(null, "", url)
}

function SongsArchiveFilterPopover({
  kind,
  id,
  options,
  selected,
  setSelected,
  openFilter,
  setOpenFilter,
}: {
  kind: FilterKind
  id: string
  options: readonly string[]
  selected: Set<string>
  setSelected: Dispatch<SetStateAction<Set<string>>>
  openFilter: FilterKind | null
  setOpenFilter: Dispatch<SetStateAction<FilterKind | null>>
}) {
  return (
    <div
      className={`filter-pop ${openFilter === kind ? "open" : ""}`}
      id={id}
    >
      {options.map((opt) => (
        <label key={opt} className="fopt">
          <input
            type="checkbox"
            checked={selected.has(opt)}
            onChange={(e) => {
              setSelected((prev) => toggleInSet(prev, opt, e.target.checked))
            }}
            value={opt}
          />
          <span>{opt}</span>
        </label>
      ))}
      <button
        type="button"
        className="clear"
        onClick={(e) => {
          e.stopPropagation()
          setSelected(new Set())
          setOpenFilter(null)
        }}
      >
        Clear filter
      </button>
    </div>
  )
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
    return list.slice(0, 60)
  }, [searchQuery, songs])

  const catColorByName = useMemo(() => {
    const m: Record<string, string> = {}
    for (const c of categories) {
      m[c.category] = c.category_color1
    }
    return m
  }, [categories])

  const openSearch = useCallback(() => {
    setSearchOpen(true)
    setSearchQuery("")
  }, [])

  function onSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target
      if (!(t instanceof Element)) return
      if (!t.closest(".filter-pop") && !t.closest(".filter-btn"))
        setOpenFilter(null)
    }
    document.addEventListener("click", onDocClick)
    return () => document.removeEventListener("click", onDocClick)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false)
        setSearchQuery("")
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setSearchOpen(true)
        setTimeout(() => searchInputRef.current?.focus(), 40)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [searchOpen])

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

      <div id="listView" className="min-w-0 flex-1" hidden={activeView !== "list"}>
        <div className="list-card">
            <div style={{ position: "relative" }}>
              <table className="list-table">
                <thead>
                  <tr>
                    <th>
                      <div className="col">
                        <button
                          type="button"
                          className={
                            sortKey === "song" ? "sort-btn active" : "sort-btn"
                          }
                          data-sort="song"
                          onClick={() => onSort("song")}
                        >
                          Song
                          <svg
                            id="sortIconSong"
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
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="search-btn"
                          style={{ width: 28, height: 28 }}
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
                    </th>
                    <th>
                      <div className="col">
                        <button
                          type="button"
                          data-sort="song_category"
                          className={
                            sortKey === "song_category" ?
                              "sort-btn active"
                            : "sort-btn"
                          }
                          onClick={() => onSort("song_category")}
                        >
                          Category{" "}
                          <svg
                            id="sortIconCat"
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
                            <polyline points="8 12 16 12" opacity=".4" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className={
                            selectedCats.size > 0 ?
                              "filter-btn active"
                            : "filter-btn"
                          }
                          data-filter="cat"
                          aria-label="Filter category"
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenFilter((k) =>
                              k === "cat" ? null : "cat",
                            )
                          }}
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
                        <SongsArchiveFilterPopover
                          kind="cat"
                          id="filterCat"
                          options={categoryOptions}
                          selected={selectedCats}
                          setSelected={setSelectedCats}
                          openFilter={openFilter}
                          setOpenFilter={setOpenFilter}
                        />
                      </div>
                    </th>
                    <th>
                      <div className="col">
                        <button
                          type="button"
                          data-sort="song_originalartist"
                          className={
                            sortKey === "song_originalartist" ?
                              "sort-btn active"
                            : "sort-btn"
                          }
                          onClick={() => onSort("song_originalartist")}
                        >
                          Original artist{" "}
                          <svg
                            id="sortIconArtist"
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
                            <polyline points="8 12 16 12" opacity=".4" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className={
                            selectedArtists.size > 0 ?
                              "filter-btn active"
                            : "filter-btn"
                          }
                          data-filter="artist"
                          aria-label="Filter artist"
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenFilter((k) =>
                              k === "artist" ? null : "artist",
                            )
                          }}
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
                        <SongsArchiveFilterPopover
                          kind="artist"
                          id="filterArtist"
                          options={artistOptions}
                          selected={selectedArtists}
                          setSelected={setSelectedArtists}
                          openFilter={openFilter}
                          setOpenFilter={setOpenFilter}
                        />
                      </div>
                    </th>
                    <th>
                      <div className="col">
                        <span style={{ padding: "4px 6px" }}>
                          Performed by
                        </span>
                        <button
                          type="button"
                          className={
                            selectedPerfs.size > 0 ?
                              "filter-btn active"
                            : "filter-btn"
                          }
                          data-filter="perf"
                          aria-label="Filter performer"
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenFilter((k) =>
                              k === "perf" ? null : "perf",
                            )
                          }}
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
                        <SongsArchiveFilterPopover
                          kind="perf"
                          id="filterPerf"
                          options={perfOpts}
                          selected={selectedPerfs}
                          setSelected={setSelectedPerfs}
                          openFilter={openFilter}
                          setOpenFilter={setOpenFilter}
                        />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody id="listBody">
                  {filteredSortedList.map((s) => {
                    const perfs = performerBySong[s.song] ?? []
                    const catColor =
                      catColorByName[s.song_category] ?? "#888"
                    return (
                      <tr key={s.song_id}>
                        <td className="song-cell">
                          <Link
                            href={getSongArchiveUrl(s.song_id)}
                            data-song={s.song}
                          >
                            <SongDisplayName
                              song={s.song}
                              songDisplayName={s.song_displayname}
                            />
                          </Link>
                        </td>
                        <td className="cat-cell">
                          <span
                            className="dot"
                            style={{ background: catColor }}
                          />
                          {s.song_category}
                        </td>
                        <td className="artist-cell">
                          {s.song_originalartist || "—"}
                        </td>
                        <td className="pill-cell">
                          {perfs.map((p) => (
                            <span key={p} className={`pill ${performerPillClass(p)}`}>
                              {p}
                            </span>
                          ))}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      <div
        className={`modal-overlay ${searchOpen ? "open" : ""}`}
        id="searchModal"
        role="dialog"
        aria-modal="true"
        aria-label="Search songs"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSearchOpen(false)
            setSearchQuery("")
          }
        }}
      >
        <div className="modal">
          <div className="modal-search">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchInputRef}
              type="search"
              id="searchInput"
              placeholder="Search songs…"
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="kbd">ESC</span>
          </div>
          <div className="modal-list" id="searchResults">
            {searchQuery.trim().length > 0 && searchHits.length === 0 ?
              <div className="modal-empty">
                No songs match &quot;{searchQuery}&quot;.
              </div>
            : searchHits.map((s) => (
                <Link
                  key={s.song_id}
                  href={getSongArchiveUrl(s.song_id)}
                  className="modal-row"
                  data-song={s.song}
                  onClick={() => {
                    setSearchOpen(false)
                    setSearchQuery("")
                  }}
                >
                  <span className="mr-title">
                    <SongDisplayName
                      song={s.song}
                      songDisplayName={s.song_displayname}
                    />
                  </span>
                  <span className="mr-cat">{s.song_category}</span>
                </Link>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}
