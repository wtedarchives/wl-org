"use client"

import { useMemo, useState } from "react"
import { Plus } from "@phosphor-icons/react"

import { SetlistShareCaptureProvider } from "@/components/dpro/admin/setlist/setlist-share-capture"
import { SetlistShowEventActions } from "@/components/dpro/admin/setlist/setlist-show-event-actions"
import { Button } from "@/components/ui/button"
import { useBrainsSetlist } from "@/hooks/use-brains-setlist"
import type { AdminSetlistEntryData, ShowData } from "@/types/admin"

import { BrainsEntryForm } from "./brains-entry-form"
import { useBrainsOptions } from "./brains-options-context"
import { BrainsSetlistTable } from "./brains-setlist-table"
import { useBrainsWork } from "./brains-work-context"

/**
 * The setlist half of wted-brains: the table, the row editor, and the show-timing
 * announcements.
 *
 * `SetlistShowEventActions` and `SetlistEntryDiscourseBrain` are reused unchanged
 * from the Admin Panel rather than reimplemented, so the messages a setlister
 * posts to Discourse, push, Bluesky and Instagram are byte-for-byte the ones an
 * admin posts. `SetlistShareCaptureProvider` has to wrap them — it is what renders
 * the offscreen share image the brain button attaches.
 */
export function BrainsSetlistSection() {
  const { showId, show, readOnly } = useBrainsWork()
  // Shared with the add-to-archive panels, so an added song is selectable here
  // straight away and the ~1.3k-song list is fetched once.
  const options = useBrainsOptions()
  const {
    entries,
    loading,
    insertEntry,
    updateEntry,
    deleteEntry,
    savePersonnel,
    reorder,
    rebuildStatus,
    rebuildNow,
  } = useBrainsSetlist(showId)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AdminSetlistEntryData | null>(null)

  /**
   * `SetlistShowEventActions` wants a ShowData. Only `show_id` and the identity
   * fields are read for the announcement, and the brains context already carries
   * those from the assignment.
   */
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

  const openAdd = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (entry: AdminSetlistEntryData) => {
    setEditing(entry)
    setFormOpen(true)
  }

  return (
    <SetlistShareCaptureProvider showId={showId}>
      <section className="flex min-w-0 flex-col gap-3">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <span className="flex min-w-0 items-center gap-2">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-white/90">
              Setlist
            </span>
            {/*
              Stats rebuild on their own after every edit. This says so quietly
              rather than blocking the save — the rebuild takes 30–45 seconds and
              nobody should be waiting on it mid-show.
            */}
            {rebuildStatus !== "idle" && (
              <span
                className="font-mono text-[10px] uppercase tracking-[0.06em] text-white/45"
                aria-live="polite"
              >
                {rebuildStatus === "running"
                  ? "Updating stats…"
                  : rebuildStatus === "queued"
                    ? "Stats update queued"
                    : "Stats update failed"}
              </span>
            )}
          </span>
          {!readOnly && (
            <span className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="wl-home-v2-tours-header-pill"
                onClick={rebuildNow}
                disabled={rebuildStatus === "running"}
                title="Rebuild statistics now — takes about 45 seconds"
              >
                Update
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="wl-home-v2-tours-header-pill gap-1"
                onClick={openAdd}
                title="Add a song"
              >
                <Plus className="size-3.5 shrink-0 opacity-80" aria-hidden />
                Add song
              </Button>
            </span>
          )}
        </div>

        {/* Onstage / Set Break / Encore Break / End Show. */}
        {!readOnly && <SetlistShowEventActions selectedShow={showData} />}

        {loading ? (
          <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-white/50">
            Loading setlist…
          </p>
        ) : (
          <BrainsSetlistTable
            entries={entries}
            showId={showId}
            readOnly={readOnly}
            onEdit={openEdit}
            onReorder={(activeId, overId) => void reorder(activeId, overId)}
          />
        )}

        <BrainsEntryForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          entry={editing}
          existing={entries}
          options={options}
          onSubmit={(patch) =>
            editing
              ? updateEntry(editing.entry_id, patch).then((ok) =>
                  ok ? editing.entry_id : null,
                )
              : insertEntry(patch)
          }
          onSavePersonnel={savePersonnel}
          onDelete={deleteEntry}
        />
      </section>
    </SetlistShareCaptureProvider>
  )
}
