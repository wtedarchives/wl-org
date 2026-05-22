"use client"

import { useCallback, useState } from "react"

import { useAuth } from "@/components/auth-context"
import { SetlistWtedSheet } from "@/components/dpro/setlist/setlist-wted-sheet"
import { useWlHomeV2OpenLogin } from "@/components/wl-home-v2/wl-home-v2-open-login-context"
import { SetlistWtedLoginRequiredDialog } from "@/components/dpro/setlist/setlist-wted-login-required-dialog"
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

/**
 * Catalog search + WTED request sheet + login gate (same behavior as {@link WtedRequestSongCard} body).
 */
export function WtedRequestSongFlow({
  catalogFetchEnabled = true,
  panelClassName,
  panelWrapperClassName,
  wlHomeV2LoginDialog = false,
}: {
  catalogFetchEnabled?: boolean
  panelClassName?: string
  /** Optional outer flex wrapper (e.g. modal body min-height). */
  panelWrapperClassName?: string
  /** Use WL Home v2 login gate styling when opening the WTED login-required dialog. */
  wlHomeV2LoginDialog?: boolean
}) {
  const { session } = useAuth()
  const openLogin = useWlHomeV2OpenLogin()
  const catalogQueryEnabled = catalogFetchEnabled
  const { rows, loading, error } = useWtedRadioIdsCatalog(catalogQueryEnabled)
  const catalogDeferred = !catalogFetchEnabled
  const panelLoading = loading || catalogDeferred

  const [wtedSheetOpen, setWtedSheetOpen] = useState(false)
  const [wtedSheetEntry, setWtedSheetEntry] = useState<SetlistEntry | null>(
    null,
  )
  const [wtedSheetSetlist, setWtedSheetSetlist] = useState<SetlistEntry[]>([])
  const [wtedSheetShow, setWtedSheetShow] =
    useState<WtedSheetShowProps>(HOME_WTED_SHEET_SHOW)
  const [fallbackArtwork, setFallbackArtwork] = useState<string | null>(null)
  const [wtedLoginRequiredOpen, setWtedLoginRequiredOpen] = useState(false)
  const [busyRadioId, setBusyRadioId] = useState<string | null>(null)

  const openRequestSheet = useCallback(
    async (row: WtedRadioIdRow) => {
      if (!session) {
        if (wlHomeV2LoginDialog) {
          openLogin?.()
        } else {
          setWtedLoginRequiredOpen(true)
        }
        return
      }
      const art = wtedRadioIdsRowArtworkUrl(row)
      if (!supabase) {
        setFallbackArtwork(art)
        const syn = setlistEntryFromWtedRadioRow(row)
        setWtedSheetEntry(syn)
        setWtedSheetSetlist([syn])
        setWtedSheetShow(HOME_WTED_SHEET_SHOW)
        setWtedSheetOpen(true)
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
          setFallbackArtwork(resolved.fallbackReleaseArtwork)
          setWtedSheetEntry(resolved.entry)
          setWtedSheetSetlist(resolved.setlist)
          setWtedSheetShow(resolved.show)
        } else {
          setFallbackArtwork(art)
          const syn = setlistEntryFromWtedRadioRow(row)
          setWtedSheetEntry(syn)
          setWtedSheetSetlist([syn])
          setWtedSheetShow(HOME_WTED_SHEET_SHOW)
        }
        setWtedSheetOpen(true)
      } catch {
        setFallbackArtwork(art)
        const syn = setlistEntryFromWtedRadioRow(row)
        setWtedSheetEntry(syn)
        setWtedSheetSetlist([syn])
        setWtedSheetShow(HOME_WTED_SHEET_SHOW)
        setWtedSheetOpen(true)
      } finally {
        setBusyRadioId(null)
      }
    },
    [session, wlHomeV2LoginDialog, openLogin],
  )

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
          onPickTrack={openRequestSheet}
          busyRadioId={busyRadioId}
          className={cn("min-h-0 flex-1 rounded-b-xl", panelClassName)}
        />
      </div>

      {!wlHomeV2LoginDialog ?
        <SetlistWtedLoginRequiredDialog
          open={wtedLoginRequiredOpen}
          onOpenChange={setWtedLoginRequiredOpen}
        />
      : null}
      <SetlistWtedSheet
        open={wtedSheetOpen}
        onOpenChange={(open) => {
          setWtedSheetOpen(open)
          if (!open) {
            setWtedSheetEntry(null)
            setWtedSheetSetlist([])
            setWtedSheetShow(HOME_WTED_SHEET_SHOW)
            setFallbackArtwork(null)
          }
        }}
        entry={wtedSheetEntry}
        setlist={wtedSheetSetlist}
        show={wtedSheetShow}
        fallbackReleaseArtwork={fallbackArtwork}
      />
    </>
  )
}
