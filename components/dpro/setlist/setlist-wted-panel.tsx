"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"

import { useAuth } from "@/components/auth-context"
import { Button } from "@/components/ui/button"
import {
  DrawerClose,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useWtedRequests } from "@/hooks/use-wted-requests"
import { useWtedEntryReleaseArtwork } from "@/hooks/use-wted-entry-release-artwork"
import { getWtedEntriesForRadioGroup } from "@/lib/wted-group-entries"
import { formatSetlistDate } from "@/lib/setlist-utils"
import { cn } from "@/lib/utils"
import type { SetlistEntry } from "@/types/setlist"
import type { WtedRequestEnriched } from "@/types/wted"
import {
  WtedPendingSlotContent,
  WtedRequestSlotContent,
  WtedSegmentsTitle,
} from "./setlist-wted-slot-content"

const WTED_REQUEST_RATE_LIMIT_MS = 10_000
const WTED_REQUEST_WINDOW_MS = 60 * 60 * 1000
const WTED_MAX_REQUESTS_PER_WINDOW = 4

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

export type SetlistWtedShowContext = {
  show_date: string
  show_venue_location: string | null
  show_group: string | null
}

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
  const accessToken = session?.access_token ?? null
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

  const buildSlots = (): Array<
    | { type: "request"; request: WtedRequestEnriched }
    | { type: "pending"; groupEntries: SetlistEntry[] }
    | { type: "waiting"; waitSeconds: number }
    | { type: "request-another" }
    | { type: "empty" }
  > => {
    const slots: Array<
      | { type: "request"; request: WtedRequestEnriched }
      | { type: "pending"; groupEntries: SetlistEntry[] }
      | { type: "waiting"; waitSeconds: number }
      | { type: "request-another" }
      | { type: "empty" }
    > = []
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
  const slotVisualVariant = variant === "modal" ? "wlHomeV2" : "drawer"

  const bannerAlreadyRequested =
    entry &&
    entry.radio_id &&
    alreadyRequestedRadioIds.has(String(entry.radio_id)) &&
    suppressAlreadyRequestedBannerRadioId !== String(entry.radio_id)

  const filteredSlots = slots.filter(
    (slot): slot is Exclude<typeof slot, { type: "empty" }> =>
      slot.type !== "empty",
  )

  const scrollInner = (
    <div
      className={cn(
        variant === "drawer" &&
          "min-h-[140px] max-h-[52vh] overflow-y-auto px-3 pb-3 pt-2",
        variant === "modal" && "wl-home-v2-wted-modal-scroll",
        scrollClassName,
      )}
    >
      {loading ? (
        <div
          className={cn(
            variant === "modal" ?
              "wl-home-v2-wted-modal-loading"
            : "flex min-h-[140px] items-center justify-center",
          )}
        >
          <p
            className={cn(
              variant === "modal" ?
                "wl-home-v2-wted-modal-loading-text"
              : "text-[11px] text-muted-foreground",
            )}
          >
            Loading requests…
          </p>
        </div>
      ) : error ? (
        <p
          className={cn(
            variant === "modal" ?
              "wl-home-v2-wted-modal-error"
            : "text-[11px] text-destructive",
          )}
        >
          {error}
        </p>
      ) : (
        <div
          className={cn(
            variant === "modal" ? "wl-home-v2-wted-modal-stack" : "space-y-3",
          )}
        >
          {bannerAlreadyRequested ?
            <div
              className={cn(
                variant === "modal" ?
                  "wl-home-v2-wted-status-banner"
                : "rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-center",
              )}
            >
              <p
                className={cn(
                  variant === "modal" ?
                    "wl-home-v2-wted-status-banner-text"
                  : "text-xs font-normal text-foreground",
                )}
              >
                <span className="font-semibold">
                  <WtedSegmentsTitle
                    segments={segmentsForBanner}
                    visualVariant={slotVisualVariant}
                  />
                  <span className="tabular-nums">
                    {" "}
                    ({formatSetlistDate(show.show_date)})
                  </span>
                </span>{" "}
                has already been requested.
              </p>
            </div>
          : null}
          {!hasOpenSlot ?
            <div
              className={cn(
                variant === "modal" ?
                  "wl-home-v2-wted-status-banner"
                : "rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-center",
              )}
            >
              <p
                className={cn(
                  variant === "modal" ?
                    "wl-home-v2-wted-status-banner-text"
                  : "text-xs font-normal text-foreground",
                )}
              >
                You can request another song in{" "}
                <span
                  className={cn(
                    variant === "modal" ?
                      "wl-home-v2-wted-countdown-pill"
                    : "mx-1 inline-flex items-center rounded-full border border-red-500/40 bg-red-500/20 px-1.5 py-[1px] font-semibold tabular-nums",
                  )}
                >
                  {formatCountdown(countdownMs)}
                </span>{" "}
                (at {nextAvailableAt ? formatTime(nextAvailableAt) : "—"}).
              </p>
            </div>
          : null}
          {variant === "modal" ?
            <div className="wl-home-v2-wted-request-slots">
              {filteredSlots.map((slot, i) => (
                <div
                  key={i}
                  className={cn(
                    "wl-home-v2-wted-slot-row",
                    slot.type === "pending" &&
                      "wl-home-v2-wted-slot-row--active",
                    (slot.type === "request" ||
                      slot.type === "waiting" ||
                      slot.type === "request-another") &&
                      "wl-home-v2-wted-slot-row--muted",
                  )}
                >
                  {slot.type === "request" && (
                    <WtedRequestSlotContent
                      request={slot.request}
                      visualVariant="wlHomeV2"
                    />
                  )}
                  {slot.type === "pending" && (
                    <WtedPendingSlotContent
                      groupEntries={slot.groupEntries}
                      show={show}
                      releaseArtwork={releaseArtwork}
                      releaseArtworkLoading={artworkLoading}
                      onRequest={handleRequest}
                      submitting={submitting}
                      submitError={submitError}
                      waitSeconds={requestWaitSeconds}
                      visualVariant="wlHomeV2"
                    />
                  )}
                  {slot.type === "waiting" && (
                    <div className="wl-home-v2-wted-slot-wait">
                      Wait {slot.waitSeconds}s
                    </div>
                  )}
                  {slot.type === "request-another" && (
                    <div className="wl-home-v2-wted-slot-action-wrap">
                      <Button
                        size="sm"
                        variant="default"
                        className="wl-home-v2-wted-request-track-btn"
                        onClick={() => onOpenChange(false)}
                      >
                        Request another song
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          : filteredSlots.map((slot, i) => (
              <div
                key={i}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-3",
                  slot.type === "pending" &&
                    "border-primary/50 bg-primary/5 ring-2 ring-primary/20 ring-offset-2 ring-offset-background",
                  (slot.type === "request" ||
                    slot.type === "waiting" ||
                    slot.type === "request-another") &&
                    "border-border/60 bg-muted/30",
                )}
              >
                {slot.type === "request" && (
                  <WtedRequestSlotContent request={slot.request} />
                )}
                {slot.type === "pending" && (
                  <WtedPendingSlotContent
                    groupEntries={slot.groupEntries}
                    show={show}
                    releaseArtwork={releaseArtwork}
                    releaseArtworkLoading={artworkLoading}
                    onRequest={handleRequest}
                    submitting={submitting}
                    submitError={submitError}
                    waitSeconds={requestWaitSeconds}
                  />
                )}
                {slot.type === "waiting" && (
                  <div className="flex min-h-[52px] w-full items-center justify-center text-xs font-medium tabular-nums text-muted-foreground">
                    Wait {slot.waitSeconds}s
                  </div>
                )}
                {slot.type === "request-another" && (
                  <div className="flex min-h-[52px] w-full items-center justify-center">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => onOpenChange(false)}
                    >
                      Request another song
                    </Button>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  )

  if (variant === "modal") {
    return scrollInner
  }

  return (
    <>
      <DrawerHeader className="flex flex-col items-center justify-center gap-1 border-b border-border/60 pt-1 pb-3 text-center">
        <DrawerTitle className="sr-only">WTED Goose Radio</DrawerTitle>
        <div className="flex items-center justify-center gap-2">
          <Image
            src="/WTED2.png"
            alt="WTED Goose Radio"
            width={32}
            height={32}
            className="size-6 object-contain"
          />
          <p className="text-sm font-medium text-foreground">
            WTED Goose Radio
          </p>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Users can request four songs every 60 minutes.
        </p>
      </DrawerHeader>
      {scrollInner}
      <DrawerFooter className="border-t border-border/60 pt-3">
        <div className="flex justify-end">
          <DrawerClose asChild>
            <Button type="button" size="sm" variant="ghost">
              Close
            </Button>
          </DrawerClose>
        </div>
      </DrawerFooter>
    </>
  )
}
