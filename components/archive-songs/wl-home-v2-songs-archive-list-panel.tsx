"use client"

import Image from "next/image"
import Link from "next/link"

import { SongDisplayName } from "@/components/dpro/song-display-name"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { getSongArchiveUrl } from "@/lib/song-archive-url"
import type { SongsArchiveSong } from "@/hooks/use-songs-archive-data"

import type {
  SongsArchiveFilterKind,
  SongsArchiveSortKey,
} from "@/components/archive-songs/wl-home-v2-songs-archive-view-config"

export function WlHomeV2SongsArchiveListPanel({
  sortKey,
  onSort,
  openSearch,
  toggleFilterSheet,
  selectedCats,
  selectedArtists,
  selectedPerfs,
  filteredSortedList,
  performerBySong,
  catArtworkByName,
  listHidden,
}: {
  sortKey: SongsArchiveSortKey
  onSort: (key: SongsArchiveSortKey) => void
  openSearch: () => void
  toggleFilterSheet: (kind: SongsArchiveFilterKind) => void
  selectedCats: Set<string>
  selectedArtists: Set<string>
  selectedPerfs: Set<string>
  filteredSortedList: SongsArchiveSong[]
  performerBySong: Record<string, string[]>
  catArtworkByName: Record<string, string>
  listHidden: boolean
}) {
  return (
    <div
      id="listView"
      className="wl-home-v2-songs-archive-list-view"
      hidden={listHidden}
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
                        className={cn(
                          "songs-archive-list-hdr-btn",
                          "songs-archive-list-hdr-btn--search",
                        )}
                        id="openSearchInTable"
                        title="Search songs"
                        aria-label="Search songs"
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
                        <span>Search</span>
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
  )
}
