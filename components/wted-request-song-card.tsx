"use client"

import { useCallback, useState } from "react"

import { useAuth } from "@/components/auth-context"
import { SetlistWtedSheet } from "@/components/dpro/setlist/setlist-wted-sheet"
import { SetlistWtedLoginRequiredDialog } from "@/components/dpro/setlist/setlist-wted-login-required-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

// const REQUEST_IFRAME_SRC = "https://embed.radio.co/request/w2255950.html"

const cardClassName =
  "flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-wl-dark-grey/50 bg-[#313a34] py-0 text-xs shadow-sm ring-0"

function RequestSongHeaderBar({ hideHeader }: { hideHeader: boolean }) {
  if (hideHeader) return null

  return (
    <CardHeader className="shrink-0 border-b border-wl-dark-grey/50 bg-black/30 py-2">
      <CardTitle className="min-w-0 shrink text-[13px] font-semibold text-wl-white">
        Request a Song
      </CardTitle>
    </CardHeader>
  )
}

type WtedSheetShowProps = {
  show_date: string
  show_venue_location: string | null
  show_group: string | null
}

const HOME_WTED_SHEET_SHOW: WtedSheetShowProps = {
  show_date: "",
  show_venue_location: null,
  show_group: null,
}

export function WtedRequestSongCard({
  className,
  hideHeader = false,
  /**
   * When false, the catalog list does not fetch until this becomes true (e.g. XL column
   * scrolls into view).
   */
  catalogFetchEnabled = true,
}: {
  className?: string
  hideHeader?: boolean
  catalogFetchEnabled?: boolean
}) {
  const { user } = useAuth()
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
      if (!user) {
        setWtedLoginRequiredOpen(true)
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
    [user],
  )

  return (
    <Card className={cn(cardClassName, className)}>
      <RequestSongHeaderBar hideHeader={hideHeader} />
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        <div className="relative flex min-h-0 flex-1 flex-col">
          {/*
          Revert: Radio.co embed was toggled vs catalog (see git history / restore
          REQUEST_IFRAME_SRC and ToggleGroup in header).
          <div className="flex min-h-0 flex-1 flex-col">
            <iframe
              src={REQUEST_IFRAME_SRC}
              title="WTED Request a Song"
              allow="autoplay"
              scrolling="no"
              className="min-h-[120px] w-full flex-1 rounded-b-xl border-0"
            />
          </div>
          */}
          <WtedRequestSongCustomPanel
            rows={rows}
            loading={panelLoading}
            error={error}
            onPickTrack={openRequestSheet}
            busyRadioId={busyRadioId}
            className="min-h-0 flex-1 rounded-b-xl"
          />
        </div>
      </CardContent>

      <SetlistWtedLoginRequiredDialog
        open={wtedLoginRequiredOpen}
        onOpenChange={setWtedLoginRequiredOpen}
      />
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
    </Card>
  )
}
