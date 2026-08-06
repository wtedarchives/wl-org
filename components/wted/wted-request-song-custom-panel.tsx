"use client"

import type { ReactNode } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
  Check,
  CircleNotch,
  MagnifyingGlass,
  X,
} from "@phosphor-icons/react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  type WtedRadioIdRow,
  wtedRadioIdsRowArtworkUrl,
} from "@/lib/wted-radio-ids-sync"

function normalize(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase()
}

const thumbFrame =
  "relative size-9 shrink-0 overflow-hidden rounded border border-wl-dark-grey/50"

/** Row min height + TanStack Virtual estimate (Request a Song catalog only). */
const CATALOG_ROW_HEIGHT_PX = 44

/**
 * Tier 3. Reached only when `wted_radio_ids_catalog.artwork` is null — i.e. the
 * track has no Radio.co custom art AND no show with a release to borrow artwork
 * from (63 of 6,451 rows as of 2026-08-06).
 */
const REQUEST_CATALOG_ARTWORK_FALLBACK = "/WL.png"

function CatalogRowThumbnail({ row }: { row: WtedRadioIdRow }) {
  const dbArtwork = wtedRadioIdsRowArtworkUrl(row)
  if (dbArtwork) {
    return (
      <div className={thumbFrame}>
        <Image
          src={dbArtwork}
          alt=""
          width={44}
          height={44}
          className="size-full object-cover"
          unoptimized
        />
      </div>
    )
  }

  return (
    <div className={cn(thumbFrame, "bg-black/20")}>
      <Image
        src={REQUEST_CATALOG_ARTWORK_FALLBACK}
        alt=""
        width={44}
        height={44}
        className="size-full object-contain p-0.5"
        unoptimized
      />
    </div>
  )
}

function CatalogTrackRow({
  row,
  busy,
  onPickTrack,
}: {
  row: WtedRadioIdRow
  busy: boolean
  onPickTrack: (row: WtedRadioIdRow) => void | Promise<void>
}) {
  return (
    <div
      className={cn(
        "flex border-b border-wl-dark-grey/50 !px-2 py-0.5 transition-colors hover:bg-[#3d4842]",
      )}
      style={{ minHeight: CATALOG_ROW_HEIGHT_PX }}
    >
      <div className="flex min-h-0 w-full items-center gap-2 sm:gap-3">
        <CatalogRowThumbnail row={row} />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[11px] font-medium leading-3.5 text-wl-white sm:text-[12px]">
            {row.track_title?.trim() || "—"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {row.track_artist?.trim() ?
            <span
              className="inline-block max-w-[100px] truncate rounded-full border border-wl-dark-grey/50 bg-wl-orange/40 !px-1.5 !py-0.5 text-left align-middle text-[10px] font-semibold text-wl-white"
              title={row.track_artist.trim()}
            >
              {row.track_artist.trim()}
            </span>
          : null}
          <button
            type="button"
            onClick={() => void onPickTrack(row)}
            disabled={busy}
            className="flex size-6 min-h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm transition-transform duration-200 ease-out hover:bg-emerald-700 enabled:active:scale-95 disabled:opacity-70 motion-reduce:transition-none motion-reduce:enabled:active:scale-100 sm:size-6 sm:min-h-6 sm:min-w-6"
            aria-label="Request this song"
            aria-busy={busy}
          >
            {busy ?
              <CircleNotch className="size-4 animate-spin" aria-hidden />
            : (
              <Check
                className="size-4"
                weight="bold"
                aria-hidden
              />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export function WtedRequestSongCustomPanel({
  rows,
  loading,
  error,
  onPickTrack,
  busyRadioId,
  className,
  aboveListSlot,
}: {
  rows: WtedRadioIdRow[]
  loading: boolean
  error: string | null
  onPickTrack: (row: WtedRadioIdRow) => void | Promise<void>
  /** While resolving setlist context for this `radio_id`, the row button shows a spinner. */
  busyRadioId?: string | null
  className?: string
  /** Rendered between the search field and the scrollable track list. */
  aboveListSlot?: ReactNode
}) {
  const [query, setQuery] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const q = normalize(query)
    if (!q) return rows
    return rows.filter((r) => {
      const t = normalize(r.track_title)
      const a = normalize(r.track_artist)
      return t.includes(q) || a.includes(q)
    })
  }, [rows, query])

  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => CATALOG_ROW_HEIGHT_PX,
    overscan: 12,
  })

  useEffect(() => {
    if (loading || error || filtered.length === 0) return
    const el = scrollRef.current
    if (el) el.scrollTop = 0
  }, [query, rows, loading, error, filtered.length])

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col bg-[#313a34]",
        className,
      )}
    >
      <div className="shrink-0 border-b border-wl-dark-grey/50 !px-2 !py-1.5">
        <div className="relative">
          <MagnifyingGlass
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-wl-white/55"
            aria-hidden
          />
          <Input
            type="text"
            inputMode="search"
            enterKeyHint="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className={cn(
              "h-8 border-wl-dark-grey/50 !bg-white/10 py-0 !pl-9 text-[11px] leading-tight text-wl-white placeholder:text-wl-white/45",
              query ? "!pr-9" : "!pr-2",
            )}
            autoComplete="off"
            aria-label="Filter tracks"
          />
          {query ?
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-1 top-1/2 z-10 flex size-8 min-h-8 min-w-8 -translate-y-1/2 items-center justify-center rounded-md text-white transition-opacity hover:opacity-90"
              aria-label="Clear search"
            >
              <X
                className="size-3.5 shrink-0 text-white"
                weight="bold"
                aria-hidden
              />
            </button>
          : null}
        </div>
      </div>

      {aboveListSlot}

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        {loading ? (
          <div className="flex min-h-[120px] items-center justify-center gap-2 py-8">
            <CircleNotch className="size-5 animate-spin text-wl-white/55" aria-hidden />
            <span className="text-[11px] text-wl-white/70">
              Loading catalog…
            </span>
          </div>
        ) : error ? (
          <p className="px-3 py-4 text-center text-[11px] text-red-400">
            {error}
          </p>
        ) : filtered.length === 0 ? (
          <p className="px-3 py-6 text-center text-[11px] text-wl-white/70">
            {query.trim() ? "No tracks match your search." : "No tracks yet."}
          </p>
        ) : (
          <div
            className="relative w-full"
            style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = filtered[virtualRow.index]
              if (!row) return null
              const busy = busyRadioId != null && busyRadioId === row.radio_id
              return (
                <div
                  key={row.uuid}
                  className="absolute top-0 left-0 w-full"
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <CatalogTrackRow
                    row={row}
                    busy={busy}
                    onPickTrack={onPickTrack}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
