"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Plus, X } from "lucide-react"
import { MagnifyingGlass } from "@phosphor-icons/react"
import { supabase } from "@/lib/supabase"
import type { ShowPosterRecord } from "@/types/admin"
import { PosterModal } from "./poster-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AdminTabShell } from "./admin-tab-shell"
import { AdminTabToolbar } from "./admin-tab-toolbar"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 1000

function normalizePosterRow(row: Record<string, unknown>): ShowPosterRecord {
  return {
    uuid: String(row.uuid),
    show: Array.isArray(row.show) ? (row.show as string[]) : null,
    tour: Array.isArray(row.tour) ? (row.tour as string[]) : null,
    artist: Array.isArray(row.artist)
      ? (row.artist as ShowPosterRecord["artist"])
      : null,
    print_run:
      typeof row.print_run === "number" ? row.print_run
      : row.print_run == null ? null
      : Number(row.print_run),
    description: typeof row.description === "string" ? row.description : null,
    image: typeof row.image === "string" ? row.image : null,
  }
}

function artistSummary(record: ShowPosterRecord): string {
  const artists = record.artist ?? []
  if (artists.length === 0) return "—"
  return artists
    .map((a) => a.name?.trim())
    .filter(Boolean)
    .join(", ") || "—"
}

export function AdminPoster() {
  const [rows, setRows] = useState<ShowPosterRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selected, setSelected] = useState<ShowPosterRecord | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAddMode, setIsAddMode] = useState(false)

  const fetchRows = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    try {
      let all: ShowPosterRecord[] = []
      let page = 0
      let hasMore = true
      while (hasMore) {
        const { data, error } = await supabase
          .from("show_posters")
          .select("uuid, show, tour, artist, print_run, description, image")
          .order("uuid", { ascending: false })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
        if (error) throw error
        if (data?.length) {
          all = [
            ...all,
            ...data.map((r) => normalizePosterRow(r as Record<string, unknown>)),
          ]
          page++
          hasMore = data.length === PAGE_SIZE
        } else {
          hasMore = false
        }
      }
      setRows(all)
    } catch (e) {
      console.error("Error fetching show posters:", e)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchRows()
  }, [fetchRows])

  const handleRowClick = (row: ShowPosterRecord) => {
    setSelected(row)
    setIsAddMode(false)
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setSelected(null)
    setIsAddMode(true)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelected(null)
    setIsAddMode(false)
  }

  const handleModalSave = () => {
    void fetchRows()
    handleModalClose()
  }

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return rows
    const q = searchQuery.toLowerCase()
    return rows.filter((r) => {
      const desc = (r.description ?? "").toLowerCase()
      const tours = (r.tour ?? []).join(" ").toLowerCase()
      const artists = artistSummary(r).toLowerCase()
      return desc.includes(q) || tours.includes(q) || artists.includes(q)
    })
  }, [rows, searchQuery])

  return (
    <AdminTabShell>
      <AdminTabToolbar title="Posters">
        <div
          className={cn(
            "wl-home-v2-archive-admin-toolbar-search wl-home-v2-archive-admin-toolbar-search--affix-leading wl-home-v2-archive-admin-toolbar-search--wide",
            searchQuery && "wl-home-v2-archive-admin-toolbar-search--has-clear",
          )}
        >
          <div className="wl-home-v2-archive-admin-toolbar-search__inner">
            <Input
              type="text"
              placeholder="Search description, tour, artist…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-full min-w-0 text-xs focus-visible:ring-0"
            />
            <MagnifyingGlass
              className="wl-home-v2-archive-admin-toolbar-search__icon wl-home-v2-archive-admin-toolbar-search__icon--leading"
              aria-hidden
            />
            {searchQuery ?
              <button
                type="button"
                className="wl-home-v2-archive-admin-toolbar-search__clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X className="size-3 shrink-0" aria-hidden />
              </button>
            : null}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAddNew}
          className="wl-home-v2-tours-header-pill shrink-0 gap-1"
        >
          <Plus className="size-3.5 shrink-0 opacity-80" aria-hidden />
          Add poster
        </Button>
      </AdminTabToolbar>
      <p className="mb-2 text-xs text-muted-foreground">
        Click a row to edit. Upload an image or paste a URL.
      </p>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="flex gap-2">
            <div className="size-4 animate-pulse rounded-full bg-muted" />
            <div className="size-4 animate-pulse rounded-full bg-muted [animation-delay:150ms]" />
            <div className="size-4 animate-pulse rounded-full bg-muted [animation-delay:300ms]" />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Loading posters…</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[10px]">
          <Table className="set-table">
            <TableHeader>
              <TableRow>
                <TableHead className="w-14 py-1 text-left text-sm">Img</TableHead>
                <TableHead className="py-1 text-left text-sm">Description</TableHead>
                <TableHead className="py-1 text-left text-sm">Shows</TableHead>
                <TableHead className="py-1 text-left text-sm">Tours</TableHead>
                <TableHead className="py-1 text-left text-sm">Artists</TableHead>
                <TableHead className="w-20 py-1 text-right text-sm">Run</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-2 py-2 text-center text-xs text-muted-foreground"
                  >
                    {searchQuery.trim()
                      ? "No posters match your search."
                      : "No posters yet. Add one to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow
                    key={row.uuid}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(row)}
                  >
                    <TableCell className="py-1.5">
                      {row.image?.trim() ?
                        <span className="relative block size-10 overflow-hidden rounded border border-border">
                          <Image
                            src={row.image}
                            alt=""
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </span>
                      : (
                        <span className="block size-10 rounded border border-dashed border-border bg-muted/40" />
                      )}
                    </TableCell>
                    <TableCell className="max-w-[12rem] truncate py-1.5 text-xs sm:max-w-xs">
                      {row.description?.trim() || "—"}
                    </TableCell>
                    <TableCell className="py-1.5 text-xs tabular-nums">
                      {(row.show ?? []).length}
                    </TableCell>
                    <TableCell className="max-w-[10rem] truncate py-1.5 text-xs">
                      {(row.tour ?? []).join(", ") || "—"}
                    </TableCell>
                    <TableCell className="max-w-[10rem] truncate py-1.5 text-xs">
                      {artistSummary(row)}
                    </TableCell>
                    <TableCell className="py-1.5 text-right text-xs tabular-nums">
                      {row.print_run ?? "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
      <PosterModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        record={selected}
        isAddMode={isAddMode}
      />
    </AdminTabShell>
  )
}
