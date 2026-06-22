"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { useAuth } from "@/components/auth-context"
import { SetlistWtedPanelDrawerChrome } from "@/components/dpro/setlist/setlist-wted-panel-drawer-chrome"
import {
  SetlistWtedPanelScrollBody,
  type WtedPanelSlot,
} from "@/components/dpro/setlist/setlist-wted-panel-scroll"
import {
  WTED_MAX_REQUESTS_PER_WINDOW,
  WTED_REQUEST_RATE_LIMIT_MS,
  WTED_REQUEST_WINDOW_MS,
  type SetlistWtedShowContext,
} from "@/components/dpro/setlist/setlist-wted-panel.lib"

export type { SetlistWtedShowContext }
import { useWtedRequests } from "@/hooks/use-wted-requests"
import { useWtedEntryReleaseArtwork } from "@/hooks/use-wted-entry-release-artwork"
import { submitWtedRequest } from "@/lib/wted-request-edge"
import { getWtedEntriesForRadioGroup } from "@/lib/wted-group-entries"
import type { SetlistEntry } from "@/types/setlist"

export interface SetlistWtedPanelProps {
  /** When false, dependent fetches stay idle where applicable. */
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: SetlistEntry | null
  /** Unique WTED-linked entries when a song pair has multiple radio IDs. */
  wtedEntryOptions?: SetlistEntry[] | null
  setlist: SetlistEntry[]
  show: SetlistWtedShowContext
  fallbackReleaseArtwork: string | null
  /** `drawer`: shadcn header + footer. `modal`: scrollable body only (shell supplies chrome). */
  variant: "drawer" | "modal"
  /** Extra classes on the scroll region (e.g. modal flex child). */
  scrollClassName?: string
  /** When set, "Request another song" calls this instead of `onOpenChange(false)`. */
  onRequestAnother?: () => void
}

export function SetlistWtedPanel({
  open,
  onOpenChange,
  entry,
  wtedEntryOptions = null,
  setlist,
  show,
  fallbackReleaseArtwork,
  variant,
  scrollClassName,
  onRequestAnother,
}: SetlistWtedPanelProps) {
  const isMultiPairMode = !!(wtedEntryOptions && wtedEntryOptions.length > 1)
  const activeEntry = entry
  const groupEntries = useMemo(
    () => getWtedEntriesForRadioGroup(setlist, activeEntry),
    [setlist, activeEntry],
  )
  const artworkEntry = groupEntries[0] ?? activeEntry
  const { releaseArtwork, artworkLoading } = useWtedEntryReleaseArtwork(
    isMultiPairMode ? null : artworkEntry,
    open,
    fallbackReleaseArtwork,
  )

  const segmentsForBanner = useMemo(
    () =>
      groupEntries.map((e) => ({
        song: e.songs?.song ?? e.entry_song,
        song_displayname: e.songs?.song_displayname ?? null,
        entry_short: e.entry_short,
      })),
    [groupEntries],
  )
  const { session } = useAuth()
  const accessToken = session?.token ?? null
  const { requests, loading, error, refetch } = useWtedRequests(accessToken, open)

  const [lastRequestTime, setLastRequestTime] = useState<number>(0)
  const [submittingRadioId, setSubmittingRadioId] = useState<string | null>(
    null,
  )
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitErrorByRadioId, setSubmitErrorByRadioId] = useState<
    Record<string, string>
  >({})
  const [countdownMs, setCountdownMs] = useState<number>(0)
  const [requestWaitMs, setRequestWaitMs] = useState<number>(0)
  const [suppressAlreadyRequestedBannerRadioId, setSuppressAlreadyRequestedBannerRadioId] =
    useState<string | null>(null)

  useEffect(() => {
    setSuppressAlreadyRequestedBannerRadioId(null)
  }, [activeEntry?.radio_id])

  useEffect(() => {
    if (!open) {
      setSubmitError(null)
      setSubmitErrorByRadioId({})
      setSubmittingRadioId(null)
      setSuppressAlreadyRequestedBannerRadioId(null)
    }
  }, [open])

  useEffect(() => {
    if (lastRequestTime === 0) {
      setRequestWaitMs(0)
      return
    }
    const update = () => {
      const elapsed = Date.now() - lastRequestTime
      const remaining = WTED_REQUEST_RATE_LIMIT_MS - elapsed
      setRequestWaitMs(Math.max(0, remaining))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [lastRequestTime])

  const canRequestByTime = requestWaitMs === 0
  const hasOpenSlot = requests.length < WTED_MAX_REQUESTS_PER_WINDOW
  const nextAvailableAtTimestamp =
    requests.length >= WTED_MAX_REQUESTS_PER_WINDOW && requests[0]
      ? new Date(requests[0].requested_at).getTime() + WTED_REQUEST_WINDOW_MS
      : null
  const nextAvailableAt =
    nextAvailableAtTimestamp != null
      ? new Date(nextAvailableAtTimestamp)
      : null

  useEffect(() => {
    if (nextAvailableAtTimestamp == null) {
      setCountdownMs(0)
      return
    }
    const update = () => {
      const remaining = nextAvailableAtTimestamp - Date.now()
      setCountdownMs(Math.max(0, remaining))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [nextAvailableAtTimestamp])

  const alreadyRequestedRadioIds = new Set(
    requests.map((r) => String(r.radio_id)),
  )
  const canRequestThisEntry =
    activeEntry &&
    activeEntry.radio_id &&
    hasOpenSlot &&
    !alreadyRequestedRadioIds.has(String(activeEntry.radio_id)) &&
    canRequestByTime
  const requestWaitSeconds = Math.ceil(requestWaitMs / 1000)

  const submitRequest = useCallback(
    async (targetEntry: SetlistEntry) => {
      if (!targetEntry.radio_id || !accessToken) return
      const radioId = String(targetEntry.radio_id)
      if (
        !hasOpenSlot ||
        alreadyRequestedRadioIds.has(radioId) ||
        !canRequestByTime
      ) {
        return
      }

      setSubmittingRadioId(radioId)
      setSubmitError(null)
      setSubmitErrorByRadioId((prev) => {
        if (!(radioId in prev)) return prev
        const next = { ...prev }
        delete next[radioId]
        return next
      })

      try {
        await submitWtedRequest(accessToken, radioId)
        setSuppressAlreadyRequestedBannerRadioId(radioId)
        setLastRequestTime(Date.now())
        await refetch()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to submit request"
        if (isMultiPairMode) {
          setSubmitErrorByRadioId((prev) => ({ ...prev, [radioId]: message }))
        } else {
          setSubmitError(message)
        }
      } finally {
        setSubmittingRadioId(null)
      }
    },
    [
      accessToken,
      alreadyRequestedRadioIds,
      canRequestByTime,
      hasOpenSlot,
      isMultiPairMode,
      refetch,
    ],
  )

  const handleRequest = useCallback(async () => {
    if (!activeEntry || !canRequestThisEntry) return
    await submitRequest(activeEntry)
  }, [activeEntry, canRequestThisEntry, submitRequest])

  const handleRequestEntry = useCallback(
    async (targetEntry: SetlistEntry) => {
      await submitRequest(targetEntry)
    },
    [submitRequest],
  )

  const buildSlots = (): WtedPanelSlot[] => {
    const slots: WtedPanelSlot[] = []
    for (let i = 0; i < WTED_MAX_REQUESTS_PER_WINDOW; i++) {
      if (requests[i]) {
        slots.push({ type: "request", request: requests[i] })
      } else if (
        i === requests.length &&
        !isMultiPairMode &&
        activeEntry?.radio_id &&
        hasOpenSlot &&
        !alreadyRequestedRadioIds.has(String(activeEntry.radio_id)) &&
        canRequestByTime
      ) {
        slots.push({ type: "pending", groupEntries })
      } else if (
        i === requests.length &&
        hasOpenSlot &&
        requestWaitSeconds > 0
      ) {
        slots.push({ type: "waiting", waitSeconds: requestWaitSeconds })
      } else if (
        i === requests.length &&
        hasOpenSlot &&
        requestWaitSeconds === 0
      ) {
        slots.push({ type: "request-another" })
      } else {
        slots.push({ type: "empty" })
      }
    }
    return slots
  }

  const slots = buildSlots()

  const bannerAlreadyRequested =
    !isMultiPairMode &&
    !!(
      activeEntry &&
      activeEntry.radio_id &&
      alreadyRequestedRadioIds.has(String(activeEntry.radio_id)) &&
      suppressAlreadyRequestedBannerRadioId !== String(activeEntry.radio_id)
    )

  const filteredSlots = slots.filter(
    (slot): slot is Exclude<WtedPanelSlot, { type: "empty" }> =>
      slot.type !== "empty",
  )

  const scrollInner = (
    <SetlistWtedPanelScrollBody
      variant={variant}
      scrollClassName={scrollClassName}
      loading={loading}
      error={error}
      bannerAlreadyRequested={bannerAlreadyRequested}
      segmentsForBanner={segmentsForBanner}
      show={show}
      hasOpenSlot={hasOpenSlot}
      countdownMs={countdownMs}
      nextAvailableAt={nextAvailableAt}
      filteredSlots={filteredSlots}
      releaseArtwork={releaseArtwork}
      artworkLoading={artworkLoading}
      handleRequest={handleRequest}
      submitting={submittingRadioId === String(activeEntry?.radio_id ?? "")}
      submitError={submitError}
      requestWaitSeconds={requestWaitSeconds}
      onOpenChange={onOpenChange}
      isMultiPairMode={isMultiPairMode}
      wtedEntryOptions={wtedEntryOptions}
      handleRequestEntry={handleRequestEntry}
      submittingRadioId={submittingRadioId}
      submitErrorByRadioId={submitErrorByRadioId}
      alreadyRequestedRadioIds={alreadyRequestedRadioIds}
      canRequestByTime={canRequestByTime}
      setlist={setlist}
      open={open}
      fallbackReleaseArtwork={fallbackReleaseArtwork}
      onRequestAnother={onRequestAnother}
    />
  )

  if (variant === "modal") {
    return scrollInner
  }

  return (
    <SetlistWtedPanelDrawerChrome>{scrollInner}</SetlistWtedPanelDrawerChrome>
  )
}
