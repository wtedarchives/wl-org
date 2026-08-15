"use client"

import { useEffect, useMemo, useState } from "react"

import { SetlistShareCaptureProvider } from "@/components/dpro/admin/setlist/setlist-share-capture"
import { SetlistShowEventActions } from "@/components/dpro/admin/setlist/setlist-show-event-actions"
import { Button } from "@/components/ui/button"
import { useBrainsSetlist } from "@/hooks/use-brains-setlist"
import { compareBrainsSets, sortBrainsSetKeys, BRAINS_ALL_SETS } from "@/lib/brains-sets"
import { cn } from "@/lib/utils"
import type { AdminSetlistEntryData, ShowData } from "@/types/admin"

import { BrainsDeleteSetDialog } from "./brains-delete-set-dialog"
import { BrainsEntryForm } from "./brains-entry-form"
import { useBrainsOptions } from "./brains-options-context"
import { BrainsSetlistBoard } from "./brains-setlist-board"
import { useBrainsWork } from "./brains-work-context"

export function BrainsSetlistSection() {
  const { showId, show, readOnly } = useBrainsWork()
  const options = useBrainsOptions()
  const {
    entries,
    loading,
    insertEntry,
    updateEntry,
    deleteEntry,
    deleteEntries,
    reorder,
    rebuildStatus,
    rebuildNow,
  } = useBrainsSetlist(showId)

  const [emptySets, setEmptySets] = useState<string[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AdminSetlistEntryData | null>(null)
  const [targetSet, setTargetSet] = useState<string | null>(null)
  const [deleteSetKey, setDeleteSetKey] = useState<string | null>(null)

  useEffect(() => {
    setEmptySets([])
    setFormOpen(false)
    setEditing(null)
    setTargetSet(null)
    setDeleteSetKey(null)
  }, [showId])

  const populatedSets = useMemo(
    () => new Set(entries.map((e) => e.entry_set ?? "1")),
    [entries],
  )

  const visualSets = useMemo(() => {
    const empty = emptySets.filter((s) => !populatedSets.has(s))
    return sortBrainsSetKeys([...populatedSets, ...empty])
  }, [emptySets, populatedSets])

  const availableSets = useMemo(() => {
    const used = new Set(visualSets)
    const catalog = options.sets.length > 0 ? options.sets : [...BRAINS_ALL_SETS]
    return catalog.filter((s) => !used.has(s)).sort(compareBrainsSets)
  }, [options.sets, visualSets])

  const showData: ShowData | null = useMemo(() => {
    if (!showId) return null
    return {
      show_id: showId,
      show_date: show?.show_date ?? "",
      show_group: show?.show_group ?? "",
      show_subvenue: show?.show_subvenue ?? "",
      show_venue_location: show?.show_venue_location ?? null,
      show_canonid: null,
    }
  }, [showId, show])

  if (!showId) return null

  const openAdd = (setKey: string) => {
    setEditing(null)
    setTargetSet(setKey)
    setFormOpen(true)
  }

  const openEdit = (entry: AdminSetlistEntryData) => {
    setEditing(entry)
    setTargetSet(entry.entry_set)
    setFormOpen(true)
  }

  const handleDeleteSet = async (setKey: string) => {
    const inSet = entries.filter((e) => e.entry_set === setKey)
    if (inSet.length > 0) {
      const ok = await deleteEntries(inSet.map((e) => e.entry_id))
      if (!ok) return
    }
    setEmptySets((prev) => prev.filter((s) => s !== setKey))
    setDeleteSetKey(null)
  }

  const handleDeletedEntry = async (entryId: string) => {
    const row = entries.find((e) => e.entry_id === entryId)
    const ok = await deleteEntry(entryId)
    if (ok && row) {
      const remaining = entries.filter(
        (e) => e.entry_id !== entryId && e.entry_set === row.entry_set,
      )
      if (remaining.length === 0) {
        const setKey = row.entry_set ?? "1"
        setEmptySets((prev) =>
          prev.includes(setKey) ? prev : [...prev, setKey],
        )
      }
    }
    return ok
  }

  return (
    <SetlistShareCaptureProvider showId={showId}>
      <div className="widget-panel wl-home-v2-years-shows-panel wl-home-v2-years-shows-panel--natural flex min-h-0 min-w-0 flex-1 flex-col">
        <div
          className={cn(
            "wp-head wl-home-v2-years-shows-wp-head wl-home-v2-tours-shows-wp-head",
            "flex w-full min-w-0 shrink-0 flex-row flex-wrap items-center gap-x-3 gap-y-2 border-b border-[rgb(29,32,30)] pb-3",
          )}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span className="wp-head-date min-w-0 truncate">Setlist</span>
            {rebuildStatus !== "idle" ?
              <span
                className="font-mono text-[10px] uppercase tracking-[0.06em] text-white/45"
                aria-live="polite"
              >
                {rebuildStatus === "running" ?
                  "Updating stats…"
                : rebuildStatus === "queued" ?
                  "Stats update queued"
                : "Stats update failed"}
              </span>
            : null}
          </span>
          {!readOnly ?
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="wl-home-v2-tours-header-pill min-h-11"
              onClick={rebuildNow}
              disabled={rebuildStatus === "running"}
              title="Rebuild statistics now — takes about 45 seconds, and respects the cooldown"
            >
              Update
            </Button>
          : null}
        </div>

        {!readOnly && showData ?
          <div className="wl-home-v2-brains-setlist-events">
            <SetlistShowEventActions selectedShow={showData} />
          </div>
        : null}

        {loading ?
          <div className="px-1 py-8 text-center text-xs text-white/65">
            <p className="m-0">Loading setlist…</p>
          </div>
        : <div className="wl-home-v2-years-table-scroll min-h-0 min-w-0 flex-1">
            <BrainsSetlistBoard
              entries={entries}
              visualSets={visualSets}
              availableSets={availableSets}
              showId={showId}
              readOnly={readOnly}
              songs={options.songs}
              onAddSet={(setKey) =>
                setEmptySets((prev) =>
                  prev.includes(setKey) ? prev : [...prev, setKey],
                )
              }
              onAddSong={openAdd}
              onEdit={openEdit}
              onDeleteSet={setDeleteSetKey}
              onReorder={(activeId, overId) => {
                const moving = entries.find((e) => e.entry_id === activeId)
                const oldSet = moving?.entry_set
                if (
                  oldSet &&
                  entries.every(
                    (e) => e.entry_id === activeId || e.entry_set !== oldSet,
                  )
                ) {
                  setEmptySets((prev) =>
                    prev.includes(oldSet) ? prev : [...prev, oldSet],
                  )
                }
                void reorder(activeId, overId)
              }}
            />
          </div>
        }

        <BrainsEntryForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          entry={editing}
          targetSet={targetSet}
          existing={entries}
          options={options}
          onSubmit={(patch) =>
            editing ?
              updateEntry(editing.entry_id, patch).then((ok) =>
                ok ? editing.entry_id : null,
              )
            : insertEntry(patch)
          }
          onDelete={handleDeletedEntry}
        />

        <BrainsDeleteSetDialog
          setKey={deleteSetKey}
          entries={entries.filter((e) => e.entry_set === deleteSetKey)}
          onClose={() => setDeleteSetKey(null)}
          onConfirm={(setKey) => void handleDeleteSet(setKey)}
        />
      </div>
    </SetlistShareCaptureProvider>
  )
}
