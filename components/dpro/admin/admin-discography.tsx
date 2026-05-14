"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { X, Plus } from "lucide-react"
import { MagnifyingGlass } from "@phosphor-icons/react"
import { supabase } from "@/lib/supabase"
import type { DiscographyAdminRecord } from "@/types/admin"
import { DiscographyModal } from "./discography-modal"
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

export function AdminDiscography() {
  const [rows, setRows] = useState<DiscographyAdminRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selected, setSelected] = useState<DiscographyAdminRecord | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAddMode, setIsAddMode] = useState(false)

  const fetchRows = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    try {
      let all: DiscographyAdminRecord[] = []
      let page = 0
      let hasMore = true
      while (hasMore) {
        const { data, error } = await supabase
          .from("discography")
          .select(
            "uuid, name, displayname, artist, category, artwork, canon_id, release_date, coach_notes",
          )
          .order("category", { ascending: true })
          .order("canon_id", { ascending: true })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
        if (error) throw error
        if (data?.length) {
          all = [...all, ...(data as DiscographyAdminRecord[])]
          page++
          hasMore = data.length === PAGE_SIZE
        } else {
          hasMore = false
        }
      }
      setRows(all)
    } catch (e) {
      console.error("Error fetching discography:", e)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchRows()
  }, [fetchRows])

  const handleRowClick = (row: DiscographyAdminRecord) => {
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
    return rows.filter((r) => r.name.toLowerCase().includes(q))
  }, [rows, searchQuery])

  return (
    <AdminTabShell>
      <AdminTabToolbar title="Discography">
        <div
          className={cn(
            "wl-home-v2-archive-admin-toolbar-search wl-home-v2-archive-admin-toolbar-search--affix-leading wl-home-v2-archive-admin-toolbar-search--wide",
            searchQuery && "wl-home-v2-archive-admin-toolbar-search--has-clear",
          )}
        >
          <div className="wl-home-v2-archive-admin-toolbar-search__inner">
            <Input
              type="text"
              placeholder="Search by name…"
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
          Add entry
        </Button>
      </AdminTabToolbar>
      <p className="mb-2 text-xs text-muted-foreground">
        Filter rows by the <span className="font-medium">name</span> field. Click
        a row to edit.
      </p>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="flex gap-2">
            <div className="size-4 animate-pulse rounded-full bg-muted" />
            <div className="size-4 animate-pulse rounded-full bg-muted [animation-delay:150ms]" />
            <div className="size-4 animate-pulse rounded-full bg-muted [animation-delay:300ms]" />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Loading discography…
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[10px]">
          <Table className="set-table">
            <TableHeader>
              <TableRow>
                <TableHead className="py-1 text-left text-sm">Name</TableHead>
                <TableHead className="py-1 text-left text-sm">Artist</TableHead>
                <TableHead className="py-1 text-left text-sm">Category</TableHead>
                <TableHead className="w-16 py-1 text-center text-sm">
                  Canon
                </TableHead>
                <TableHead className="py-1 text-left text-sm">Released</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="px-2 py-2 text-center text-xs text-muted-foreground"
                  >
                    {searchQuery.trim()
                      ? "No entries matching this name search"
                      : "No discography entries"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow
                    key={row.uuid}
                    className="cursor-pointer bg-muted/50 text-[0.625rem] hover:bg-muted/80"
                    onClick={() => handleRowClick(row)}
                  >
                    <TableCell className="py-1 text-xs font-medium">
                      {row.name}
                    </TableCell>
                    <TableCell className="py-1 text-xs">{row.artist}</TableCell>
                    <TableCell className="py-1 text-xs">{row.category}</TableCell>
                    <TableCell className="py-1 text-center text-xs tabular-nums">
                      {row.canon_id}
                    </TableCell>
                    <TableCell className="py-1 text-xs text-muted-foreground">
                      {row.release_date ?? "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
      <DiscographyModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        record={selected}
        isAddMode={isAddMode}
      />
    </AdminTabShell>
  )
}
