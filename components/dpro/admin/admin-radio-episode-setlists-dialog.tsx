"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "@/components/auth-context"
import { supabase } from "@/lib/supabase"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import type { AdminShowData } from "@/types/admin"
import { useShowData } from "@/hooks/use-show-data"
import { useSetlistOptions } from "@/hooks/use-setlist-options"
import { formatDate } from "@/lib/utils/show-utils"
import {
  collectEpisodeSetlistUpdates,
  collectStagedEpisodeInserts,
  EPISODE_LISTING_STAGED_PREFIX,
  getNextWtedEpisodeEntryAutoFieldsFromState,
  initEpisodeSetlistEditorState,
  removeEditorRow,
  type EpisodeSetlistEditorState,
} from "@/lib/admin-radio-episode-setlist-entries-dnd"
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

function buildStagedEpisodeListingRow(
  entry: SetlistPickerEntry,
  show: AdminShowData,
  tempId: string,
  fields: { set: string; order: number; placement: string | null },
): AdminEpisodeSetlistTableRow {
  const song = entry.entry_song?.trim() || "(no song)"
  return {
    eeUuid: tempId,
    entryId: entry.entry_id,
    entrySong: song,
    songDisplayName: null,
    showDateRaw: show.show_date,
    venueLocation: show.show_venue_location ?? null,
    showGroup: show.show_group,
    wtedSet: fields.set,
    wtedOrder: fields.order,
    wtedPlacement: fields.placement,
  }
}

export function AdminRadioEpisodeSetlistsDialog({
  open,
  onOpenChange,
  episode,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  episode: (ProgramDirectorEpisode & { uuid: string }) | null
}) {
  const { session } = useAuth()
  const token = session?.token ?? null
  const { allShows, loading: showsLoading, loadingProgress } = useShowData()
  const { sets, setnums, placements } = useSetlistOptions()

  const [searchTerm, setSearchTerm] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedShow, setSelectedShow] = useState<AdminShowData | null>(null)
  const [pickerEntries, setPickerEntries] = useState<SetlistPickerEntry[]>([])
  const [loadingPicker, setLoadingPicker] = useState(false)

  const [savedRows, setSavedRows] = useState<AdminEpisodeSetlistTableRow[]>([])
  const [stagedRows, setStagedRows] = useState<AdminEpisodeSetlistTableRow[]>([])
  const [loadingRows, setLoadingRows] = useState(false)
  const [savingAll, setSavingAll] = useState(false)
  const [deletingUuid, setDeletingUuid] = useState<string | null>(null)
  const [panelError, setPanelError] = useState<string | null>(null)
  const [listingEditor, setListingEditor] =
    useState<EpisodeSetlistEditorState>(() => initEpisodeSetlistEditorState([]))
  const listingEditorRef = useRef(listingEditor)
  listingEditorRef.current = listingEditor
  const stagedRowsRef = useRef(stagedRows)
  stagedRowsRef.current = stagedRows

  const radioId = episode?.radio_id?.trim() ?? ""

  const listingDisplayRows = useMemo(
    () => [...savedRows, ...stagedRows],
    [savedRows, stagedRows],
  )

  const reloadRows = useCallback(async () => {
    if (!supabase || !radioId) {
      setSavedRows([])
      setStagedRows([])
      setListingEditor(initEpisodeSetlistEditorState([]))
      return
    }
    setLoadingRows(true)
    setPanelError(null)
    try {
      const next = await loadAdminEpisodeSetlistRows(supabase, radioId)
      setSavedRows(next)
      setListingEditor(initEpisodeSetlistEditorState(next))
    } catch (e) {
      setPanelError(
        e instanceof Error ? e.message : "Failed to load episode entries.",
      )
      setSavedRows([])
      setStagedRows([])
      setListingEditor(initEpisodeSetlistEditorState([]))
    } finally {
      setLoadingRows(false)
    }
  }, [radioId])

  useEffect(() => {
    if (!open) return
    setStagedRows([])
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

  const stagePickerEntry = (entry: SetlistPickerEntry) => {
    if (!radioId) return
    if (!selectedShow) {
      setPanelError("Select a show before adding songs.")
      return
    }
    setPanelError(null)
    const prevEditor = listingEditorRef.current
    const prevStaged = stagedRowsRef.current
    const combinedForSlot = [...savedRows, ...prevStaged]
    const nextFields = getNextWtedEpisodeEntryAutoFieldsFromState(
      combinedForSlot,
      prevEditor,
    )
    const tempId = `${EPISODE_LISTING_STAGED_PREFIX}${crypto.randomUUID()}`
    const newRow = buildStagedEpisodeListingRow(
      entry,
      selectedShow,
      tempId,
      nextFields,
    )
    setStagedRows((prev) => [...prev, newRow])
    setListingEditor({
      orderUuids: [...prevEditor.orderUuids, tempId],
      drafts: {
        ...prevEditor.drafts,
        [tempId]: {
          set: nextFields.set,
          order: nextFields.order,
          placement: nextFields.placement,
        },
      },
    })
  }

  const handleSaveEpisodeListing = async () => {
    const client = supabase
    if (!token) {
      setPanelError("You must be signed in to save episode listings.")
      return
    }
    if (!client || !radioId) return
    const ed = listingEditorRef.current
    const updates = collectEpisodeSetlistUpdates(savedRows, ed)
    const stagedMap = new Map(
      stagedRowsRef.current.map((r) => [r.eeUuid, r]),
    )
    const inserts = collectStagedEpisodeInserts(ed, stagedMap)
    if (updates.length === 0 && inserts.length === 0) return

    setSavingAll(true)
    setPanelError(null)
    try {
      const merged = await Promise.all([
        ...updates.map((u) =>
          invokeDproAdmin(token, {
            action: "wted_episode_entries_update",
            ee_uuid: u.eeUuid,
            patch: {
              set: u.set,
              order: u.order,
              placement: u.placement,
            },
          }),
        ),
        ...inserts.map((ins) =>
          invokeDproAdmin(token, {
            action: "wted_episode_entries_insert",
            row: {
              song: ins.entryId,
              episode: radioId,
              set: ins.set,
              order: ins.order,
              placement: ins.placement,
            },
          }),
        ),
      ])
      const errMsg = merged.find((r) => r.error)?.error
      if (errMsg) throw new Error(errMsg)

      setStagedRows([])
      setLoadingRows(true)
      try {
        const next = await loadAdminEpisodeSetlistRows(client, radioId)
        setSavedRows(next)
        setListingEditor(initEpisodeSetlistEditorState(next))
      } finally {
        setLoadingRows(false)
      }
    } catch (e) {
      setPanelError(
        e instanceof Error ? e.message : "Could not save episode listing.",
      )
    } finally {
      setSavingAll(false)
    }
  }

  const deleteRow = async (eeUuid: string) => {
    if (eeUuid.startsWith(EPISODE_LISTING_STAGED_PREFIX)) {
      setStagedRows((prev) => prev.filter((r) => r.eeUuid !== eeUuid))
      setListingEditor((ed) => removeEditorRow(ed, eeUuid))
      return
    }
    if (!token) {
      setPanelError("You must be signed in to delete rows.")
      return
    }
    if (!supabase) return
    setDeletingUuid(eeUuid)
    setPanelError(null)
    try {
      const { error } = await invokeDproAdmin(token, {
        action: "wted_episode_entries_delete",
        ee_uuid: eeUuid,
      })
      if (error) throw new Error(error)
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
              onPickEntry={(pe) => stagePickerEntry(pe)}
              showDropdownPortalToBody={false}
            />
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-3 sm:px-6">
            <section className="space-y-2">
              <h3 className="text-xs mt-4 font-semibold uppercase tracking-wide text-muted-foreground">
                Episode listing
              </h3>
              <AdminRadioEpisodeSetlistsEntriesTable
                rows={listingDisplayRows}
                editor={listingEditor}
                onEditorChange={setListingEditor}
                loadingRows={loadingRows}
                sets={sets}
                setnums={setnums}
                placements={placements}
                savingAll={savingAll}
                deletingUuid={deletingUuid}
                onSaveListing={() => void handleSaveEpisodeListing()}
                onDeleteRow={(id) => void deleteRow(id)}
              />
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
