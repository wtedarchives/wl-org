"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { AdminShowData } from "@/types/admin"
import { useShowData } from "@/hooks/use-show-data"
import { useSetlistOptions } from "@/hooks/use-setlist-options"
import { formatDate } from "@/lib/utils/show-utils"
import {
  loadAdminEpisodeSetlistRows,
  type AdminEpisodeSetlistTableRow,
} from "@/lib/admin-radio-episode-setlists-enrich"
import { getWtedEpisodeDisplayName } from "@/lib/wted-episode-display-name"
import { AdminRadioEpisodeSetlistsEntriesTable } from "@/components/dpro/admin/admin-radio-episode-setlists-entries-table"
import {
  AdminRadioEpisodeSetlistsPickerSection,
  type SetlistPickerEntry,
} from "@/components/dpro/admin/admin-radio-episode-setlists-picker-section"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ProgramDirectorEpisode } from "@/hooks/use-program-director-data"

export function AdminRadioEpisodeSetlistsDialog({
  open,
  onOpenChange,
  episode,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  episode: (ProgramDirectorEpisode & { uuid: string }) | null
}) {
  const { allShows, loading: showsLoading, loadingProgress } = useShowData()
  const { sets, setnums, placements } = useSetlistOptions()

  const [searchTerm, setSearchTerm] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedShow, setSelectedShow] = useState<AdminShowData | null>(null)
  const [pickerEntries, setPickerEntries] = useState<SetlistPickerEntry[]>([])
  const [loadingPicker, setLoadingPicker] = useState(false)

  const [rows, setRows] = useState<AdminEpisodeSetlistTableRow[]>([])
  const [loadingRows, setLoadingRows] = useState(false)
  const [savingUuid, setSavingUuid] = useState<string | null>(null)
  const [deletingUuid, setDeletingUuid] = useState<string | null>(null)
  const [panelError, setPanelError] = useState<string | null>(null)

  const radioId = episode?.radio_id?.trim() ?? ""

  const reloadRows = useCallback(async () => {
    if (!supabase || !radioId) {
      setRows([])
      return
    }
    setLoadingRows(true)
    setPanelError(null)
    try {
      const next = await loadAdminEpisodeSetlistRows(supabase, radioId)
      setRows(next)
    } catch (e) {
      setPanelError(
        e instanceof Error ? e.message : "Failed to load episode entries.",
      )
      setRows([])
    } finally {
      setLoadingRows(false)
    }
  }, [radioId])

  useEffect(() => {
    if (!open) return
    setSelectedShow(null)
    setPickerEntries([])
    setSearchTerm("")
    setIsDropdownOpen(false)
    reloadRows()
  }, [open, reloadRows])

  const fetchPickerEntries = useCallback(async (showId: string) => {
    if (!supabase) return
    setLoadingPicker(true)
    setPanelError(null)
    try {
      const { data, error } = await supabase
        .from("setlist_entries")
        .select(
          "entry_id, entry_set, entry_setnum, entry_setorder, entry_song, entry_short, entry_segue, entry_placement",
        )
        .eq("entry_show", showId)
        .order("entry_set", { ascending: true })
        .order("entry_setnum", { ascending: true })
        .order("entry_setorder", { ascending: true })
      if (error) throw error
      setPickerEntries((data ?? []) as SetlistPickerEntry[])
    } catch (e) {
      setPickerEntries([])
      setPanelError(
        e instanceof Error ? e.message : "Failed to load setlist for show.",
      )
    } finally {
      setLoadingPicker(false)
    }
  }, [])

  const filteredShows = useMemo(() => {
    const t = searchTerm.toLowerCase()
    return allShows.filter((show) => {
      const dateStr = formatDate(show.show_date)
      return (
        dateStr.includes(t) ||
        show.show_canonid?.toString().includes(t) ||
        show.show_group.toLowerCase().includes(t) ||
        show.show_venue_location?.toLowerCase().includes(t) ||
        show.show_subvenue.toLowerCase().includes(t)
      )
    })
  }, [allShows, searchTerm])

  const handleShowPick = useCallback(
    (show: AdminShowData) => {
      setSelectedShow(show)
      setIsDropdownOpen(false)
      setSearchTerm("")
      fetchPickerEntries(show.show_id)
    },
    [fetchPickerEntries],
  )

  const addEntry = async (entry: SetlistPickerEntry) => {
    if (!supabase || !radioId) return
    setPanelError(null)
    try {
      const { error } = await supabase.from("wted_episode_entries").insert({
        song: entry.entry_id,
        episode: radioId,
        set: null,
        order: null,
        placement: null,
      })
      if (error) throw error
      await reloadRows()
    } catch (e) {
      setPanelError(
        e instanceof Error ? e.message : "Could not add setlist entry.",
      )
    }
  }

  const saveRowFields = async (
    eeUuid: string,
    fields: {
      set: string | null
      order: number | null
      placement: string | null
    },
  ) => {
    if (!supabase) return
    setSavingUuid(eeUuid)
    setPanelError(null)
    try {
      const { error } = await supabase
        .from("wted_episode_entries")
        .update({
          set: fields.set,
          order: fields.order,
          placement: fields.placement,
        })
        .eq("uuid", eeUuid)
      if (error) throw error
      await reloadRows()
    } catch (e) {
      setPanelError(
        e instanceof Error ? e.message : "Could not update row.",
      )
    } finally {
      setSavingUuid(null)
    }
  }

  const deleteRow = async (eeUuid: string) => {
    if (!supabase) return
    setDeletingUuid(eeUuid)
    setPanelError(null)
    try {
      const { error } = await supabase
        .from("wted_episode_entries")
        .delete()
        .eq("uuid", eeUuid)
      if (error) throw error
      await reloadRows()
    } catch (e) {
      setPanelError(
        e instanceof Error ? e.message : "Could not delete row.",
      )
    } finally {
      setDeletingUuid(null)
    }
  }

  const title = episode ?
      getWtedEpisodeDisplayName(episode.episode, episode.display_name)
    : ""

  /** Main scroll lives on #main-inset-scroll, not document.body — lock it while open. */
  useEffect(() => {
    if (!open) return
    const main = document.getElementById("main-inset-scroll")
    const prev = main?.style.overflow ?? ""
    if (main) main.style.overflow = "hidden"
    return () => {
      if (main) main.style.overflow = prev
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex h-[90vh] max-w-[calc(100vw-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl md:max-w-5xl"
      >
        <DialogHeader className="shrink-0 space-y-1 border-b px-4 py-3 sm:px-6">
          <DialogTitle className="text-base sm:text-lg">Episode setlist</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {episode ?
              <>
                Manage <span className="font-medium text-foreground">{title}</span>{" "}
                · radio_id{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-[0.7rem]">
                  {radioId || "—"}
                </code>
              </>
            : null}
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 space-y-4 px-4 pt-3 sm:px-6">
            {!radioId && episode ?
              <p className="text-sm text-amber-700 dark:text-amber-400">
                This episode has no{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">radio_id</code>
                . Add one in the database before attaching setlist entries.
              </p>
            : null}

            {panelError ?
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1.5 text-sm text-destructive transition-all duration-200">
                {panelError}
              </p>
            : null}

            <AdminRadioEpisodeSetlistsPickerSection
              allShows={allShows}
              showsLoading={showsLoading}
              loadingProgress={loadingProgress}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              isDropdownOpen={isDropdownOpen}
              onToggleDropdown={() => setIsDropdownOpen((o) => !o)}
              filteredShows={filteredShows}
              onShowSelect={handleShowPick}
              selectedShow={selectedShow}
              pickerEntries={pickerEntries}
              loadingPicker={loadingPicker}
              radioId={radioId}
              onPickEntry={(pe) => void addEntry(pe)}
              showDropdownPortalToBody={false}
            />
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-3 sm:px-6">
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Episode listing
              </h3>
              <AdminRadioEpisodeSetlistsEntriesTable
                rows={rows}
                loadingRows={loadingRows}
                sets={sets}
                setnums={setnums}
                placements={placements}
                savingUuid={savingUuid}
                deletingUuid={deletingUuid}
                onSaveRow={(id, f) => void saveRowFields(id, f)}
                onDeleteRow={(id) => void deleteRow(id)}
              />
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
