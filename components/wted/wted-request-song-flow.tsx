"use client"

import { useCallback, useEffect, useState } from "react"

import { SetlistWtedPanel } from "@/components/dpro/setlist/setlist-wted-panel"
import { SetlistWtedSheet } from "@/components/dpro/setlist/setlist-wted-sheet"
import { WtedRequestSongCustomPanel } from "@/components/wted/wted-request-song-custom-panel"
import { useWtedRadioIdsCatalog } from "@/hooks/use-wted-radio-ids-catalog"
import { supabase } from "@/lib/supabase"
import { resolveWtedRequestFromRadioId } from "@/lib/wted-resolve-radio-request-context"
import { setlistEntryFromWtedRadioRow } from "@/lib/wted-synthetic-setlist-entry"
import { cn } from "@/lib/utils"
import {
  type WtedRadioIdRow,
  wtedRadioIdsRowArtworkUrl,
} from "@/lib/wted-radio-ids-sync"
import type { SetlistEntry } from "@/types/setlist"

export type WtedSheetShowProps = {
  show_date: string
  show_venue_location: string | null
  show_group: string | null
}

export const HOME_WTED_SHEET_SHOW: WtedSheetShowProps = {
  show_date: "",
  show_venue_location: null,
  show_group: null,
}

function resetWtedSelectionState() {
  return {
    entry: null as SetlistEntry | null,
    setlist: [] as SetlistEntry[],
    show: HOME_WTED_SHEET_SHOW,
    fallbackArtwork: null as string | null,
  }
}

/**
 * Catalog search + WTED request sheet (same behavior as {@link WtedRequestSongCard} body).
 */
export function WtedRequestSongFlow({
  catalogFetchEnabled = true,
  panelClassName,
  panelWrapperClassName,
  wlHomeV2LoginDialog = false,
  focusSearch = false,
}: {
  catalogFetchEnabled?: boolean
  panelClassName?: string
  /** Optional outer flex wrapper (e.g. modal body min-height). */
  panelWrapperClassName?: string
  /** Render the request panel inline (homepage request modal) instead of a sheet. */
  wlHomeV2LoginDialog?: boolean
  /** Focus the catalog search field (homepage request modal). */
  focusSearch?: boolean
}) {
  const catalogQueryEnabled = catalogFetchEnabled
  const { rows, loading, error } = useWtedRadioIdsCatalog(catalogQueryEnabled)
  const catalogDeferred = !catalogFetchEnabled
  const panelLoading = loading || catalogDeferred
  const inlineInRequestModal = wlHomeV2LoginDialog

  const [wtedSheetOpen, setWtedSheetOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<SetlistEntry | null>(null)
  const [selectedSetlist, setSelectedSetlist] = useState<SetlistEntry[]>([])
  const [selectedShow, setSelectedShow] =
    useState<WtedSheetShowProps>(HOME_WTED_SHEET_SHOW)
  const [fallbackArtwork, setFallbackArtwork] = useState<string | null>(null)
  const [busyRadioId, setBusyRadioId] = useState<string | null>(null)

  const clearSelection = useCallback(() => {
    const reset = resetWtedSelectionState()
    setSelectedEntry(reset.entry)
    setSelectedSetlist(reset.setlist)
    setSelectedShow(reset.show)
    setFallbackArtwork(reset.fallbackArtwork)
  }, [])

  useEffect(() => {
    if (!catalogFetchEnabled) {
      clearSelection()
      setWtedSheetOpen(false)
    }
  }, [catalogFetchEnabled, clearSelection])

  const applyResolvedSelection = useCallback(
    (
      entry: SetlistEntry,
      setlist: SetlistEntry[],
      show: WtedSheetShowProps,
      artwork: string | null,
    ) => {
      setFallbackArtwork(artwork)
      setSelectedEntry(entry)
      setSelectedSetlist(setlist)
      setSelectedShow(show)
    },
    [],
  )

  const pickTrack = useCallback(
    async (row: WtedRadioIdRow) => {
      const art = wtedRadioIdsRowArtworkUrl(row)

      const finishPick = (
        entry: SetlistEntry,
        setlist: SetlistEntry[],
        show: WtedSheetShowProps,
        artwork: string | null,
      ) => {
        applyResolvedSelection(entry, setlist, show, artwork)
        if (!inlineInRequestModal) setWtedSheetOpen(true)
      }

      if (!supabase) {
        const syn = setlistEntryFromWtedRadioRow(row)
        finishPick(syn, [syn], HOME_WTED_SHEET_SHOW, art)
        return
      }

      setBusyRadioId(row.radio_id)
      try {
        const resolved = await resolveWtedRequestFromRadioId(
          supabase,
          row.radio_id,
          art,
        )
        if (resolved) {
          finishPick(
            resolved.entry,
            resolved.setlist,
            resolved.show,
            resolved.fallbackReleaseArtwork,
          )
        } else {
          const syn = setlistEntryFromWtedRadioRow(row)
          finishPick(syn, [syn], HOME_WTED_SHEET_SHOW, art)
        }
      } catch {
        const syn = setlistEntryFromWtedRadioRow(row)
        finishPick(syn, [syn], HOME_WTED_SHEET_SHOW, art)
      } finally {
        setBusyRadioId(null)
      }
    },
    [inlineInRequestModal, applyResolvedSelection],
  )

  const panelOpen = inlineInRequestModal
    ? catalogFetchEnabled && selectedEntry != null
    : wtedSheetOpen

  return (
    <>
      <div
        className={cn(
          "relative flex min-h-0 flex-1 flex-col",
          panelWrapperClassName,
        )}
      >
        <WtedRequestSongCustomPanel
          rows={rows}
          loading={panelLoading}
          error={error}
          onPickTrack={pickTrack}
          busyRadioId={busyRadioId}
          focusSearch={focusSearch}
          className={cn("min-h-0 flex-1 rounded-b-xl", panelClassName)}
          aboveListSlot={
            inlineInRequestModal && selectedEntry ?
              <div className="wted-request-inline-panel shrink-0">
                <SetlistWtedPanel
                  open={panelOpen}
                  onOpenChange={(open) => {
                    if (!open) clearSelection()
                  }}
                  onRequestAnother={clearSelection}
                  entry={selectedEntry}
                  setlist={selectedSetlist}
                  show={selectedShow}
                  fallbackReleaseArtwork={fallbackArtwork}
                  variant="modal"
                  scrollClassName="wted-request-inline-panel-scroll"
                  autoRequestOnOpen
                />
              </div>
            : null
          }
        />
      </div>

      {!inlineInRequestModal ?
        <SetlistWtedSheet
          open={wtedSheetOpen}
          onOpenChange={(open) => {
            setWtedSheetOpen(open)
            if (!open) clearSelection()
          }}
          entry={selectedEntry}
          setlist={selectedSetlist}
          show={selectedShow}
          fallbackReleaseArtwork={fallbackArtwork}
        />
      : null}
    </>
  )
}
