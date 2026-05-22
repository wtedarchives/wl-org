"use client"

import { useMemo } from "react"

import {
  WtedPendingSlotContent,
  type WtedSlotVisualVariant,
} from "@/components/dpro/setlist/setlist-wted-slot-content"
import type { SetlistWtedShowContext } from "@/components/dpro/setlist/setlist-wted-panel.lib"
import { useWtedEntryReleaseArtwork } from "@/hooks/use-wted-entry-release-artwork"
import { getWtedEntriesForRadioGroup } from "@/lib/wted-group-entries"
import { cn } from "@/lib/utils"
import type { SetlistEntry } from "@/types/setlist"

function SetlistWtedPairPendingOption({
  entry,
  setlist,
  show,
  open,
  fallbackReleaseArtwork,
  onRequest,
  submitting,
  submitError,
  waitSeconds,
  requestDisabled,
  visualVariant,
}: {
  entry: SetlistEntry
  setlist: SetlistEntry[]
  show: SetlistWtedShowContext
  open: boolean
  fallbackReleaseArtwork: string | null
  onRequest: () => void
  submitting: boolean
  submitError: string | null
  waitSeconds: number
  requestDisabled: boolean
  visualVariant: WtedSlotVisualVariant
}) {
  const groupEntries = useMemo(
    () => getWtedEntriesForRadioGroup(setlist, entry),
    [setlist, entry],
  )
  const artworkEntry = groupEntries[0] ?? entry
  const { releaseArtwork, artworkLoading } = useWtedEntryReleaseArtwork(
    artworkEntry,
    open,
    fallbackReleaseArtwork,
  )

  const rowClass =
    visualVariant === "wlHomeV2" ?
      cn(
        "wl-home-v2-wted-slot-row wl-home-v2-wted-slot-row--active",
        requestDisabled && !submitting && "wl-home-v2-wted-slot-row--muted",
      )
    : cn(
        "flex w-full items-center gap-3 rounded-lg border p-3",
        requestDisabled && !submitting ?
          "border-border/60 bg-muted/30"
        : "border-primary/50 bg-primary/5 ring-2 ring-primary/20 ring-offset-2 ring-offset-background",
      )

  return (
    <div className={rowClass}>
      <WtedPendingSlotContent
        groupEntries={groupEntries}
        show={show}
        releaseArtwork={releaseArtwork}
        releaseArtworkLoading={artworkLoading}
        onRequest={onRequest}
        submitting={submitting}
        submitError={submitError}
        waitSeconds={waitSeconds}
        requestDisabled={requestDisabled}
        visualVariant={visualVariant}
      />
    </div>
  )
}

export function SetlistWtedPairPendingOptions({
  entries,
  setlist,
  show,
  open,
  fallbackReleaseArtwork,
  alreadyRequestedRadioIds,
  onRequestEntry,
  submittingRadioId,
  submitErrorByRadioId,
  waitSeconds,
  hasOpenSlot,
  canRequestByTime,
  visualVariant,
}: {
  entries: SetlistEntry[]
  setlist: SetlistEntry[]
  show: SetlistWtedShowContext
  open: boolean
  fallbackReleaseArtwork: string | null
  alreadyRequestedRadioIds: Set<string>
  onRequestEntry: (entry: SetlistEntry) => void
  submittingRadioId: string | null
  submitErrorByRadioId: Record<string, string>
  waitSeconds: number
  hasOpenSlot: boolean
  canRequestByTime: boolean
  visualVariant: WtedSlotVisualVariant
}) {
  if (!hasOpenSlot) return null

  const pendingEntries = entries.filter(
    (entry) =>
      entry.radio_id &&
      !alreadyRequestedRadioIds.has(String(entry.radio_id)),
  )

  if (pendingEntries.length === 0) return null

  return (
    <>
      {pendingEntries.map((entry) => {
        const radioId = String(entry.radio_id)
        const canRequest =
          hasOpenSlot &&
          canRequestByTime &&
          !alreadyRequestedRadioIds.has(radioId)
        return (
          <SetlistWtedPairPendingOption
            key={entry.entry_id}
            entry={entry}
            setlist={setlist}
            show={show}
            open={open}
            fallbackReleaseArtwork={fallbackReleaseArtwork}
            onRequest={() => onRequestEntry(entry)}
            submitting={submittingRadioId === radioId}
            submitError={submitErrorByRadioId[radioId] ?? null}
            waitSeconds={waitSeconds}
            requestDisabled={!canRequest}
            visualVariant={visualVariant}
          />
        )
      })}
    </>
  )
}
