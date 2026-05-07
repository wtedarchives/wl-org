"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { useAuth } from "@/components/auth-context"
import {
  SetlistWtedPanelDrawerChrome,
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
import { getWtedEntriesForRadioGroup } from "@/lib/wted-group-entries"
import type { SetlistEntry } from "@/types/setlist"

export interface SetlistWtedPanelProps {
  /** When false, dependent fetches stay idle where applicable. */
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: SetlistEntry | null
  setlist: SetlistEntry[]
  show: SetlistWtedShowContext
  fallbackReleaseArtwork: string | null
  /** `drawer`: shadcn header + footer. `modal`: scrollable body only (shell supplies chrome). */
  variant: "drawer" | "modal"
  /** Extra classes on the scroll region (e.g. modal flex child). */
  scrollClassName?: string
}

export function SetlistWtedPanel({
  open,
  onOpenChange,
  entry,
  setlist,
  show,
  fallbackReleaseArtwork,
  variant,
  scrollClassName,
}: SetlistWtedPanelProps) {
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
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [countdownMs, setCountdownMs] = useState<number>(0)
  const [requestWaitMs, setRequestWaitMs] = useState<number>(0)
  const [suppressAlreadyRequestedBannerRadioId, setSuppressAlreadyRequestedBannerRadioId] =
    useState<string | null>(null)

  useEffect(() => {
    setSuppressAlreadyRequestedBannerRadioId(null)
  }, [entry?.radio_id])

  useEffect(() => {
    if (!open) {
      setSubmitError(null)
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
    entry &&
    entry.radio_id &&
    hasOpenSlot &&
    !alreadyRequestedRadioIds.has(String(entry.radio_id)) &&
    canRequestByTime
  const requestWaitSeconds = Math.ceil(requestWaitMs / 1000)

  const handleRequest = useCallback(async () => {
    if (!entry || !accessToken || !canRequestThisEntry) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/functions/v1`
        : ""
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      const res = await fetch(`${base}/wted-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          ...(anon ? { apikey: anon } : {}),
        },
        body: JSON.stringify({ radio_id: String(entry.radio_id) }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to submit request")
      }
      setSuppressAlreadyRequestedBannerRadioId(String(entry.radio_id))
      setLastRequestTime(Date.now())
      await refetch()
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit request",
      )
    } finally {
      setSubmitting(false)
    }
  }, [entry, accessToken, canRequestThisEntry, refetch])

  const buildSlots = (): WtedPanelSlot[] => {
    const slots: WtedPanelSlot[] = []
    for (let i = 0; i < WTED_MAX_REQUESTS_PER_WINDOW; i++) {
      if (requests[i]) {
        slots.push({ type: "request", request: requests[i] })
      } else if (
        i === requests.length &&
        entry?.radio_id &&
        hasOpenSlot &&
        !alreadyRequestedRadioIds.has(String(entry.radio_id)) &&
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
    !!(
      entry &&
      entry.radio_id &&
      alreadyRequestedRadioIds.has(String(entry.radio_id)) &&
      suppressAlreadyRequestedBannerRadioId !== String(entry.radio_id)
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
      submitting={submitting}
      submitError={submitError}
      requestWaitSeconds={requestWaitSeconds}
      onOpenChange={onOpenChange}
    />
  )

  if (variant === "modal") {
    return scrollInner
  }

  return (
    <SetlistWtedPanelDrawerChrome>{scrollInner}</SetlistWtedPanelDrawerChrome>
  )
}
