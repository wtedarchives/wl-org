"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"

import { useAuth } from "@/components/auth-context"
import { useWtedRequests } from "@/hooks/use-wted-requests"
import { formatSetlistDate } from "@/lib/setlist-utils"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer"
import type { SetlistEntry } from "@/types/setlist"
import type { WtedRequestEnriched } from "@/types/wted"
import {
  WtedRequestSlotContent,
  WtedPendingSlotContent,
} from "./setlist-wted-slot-content"

const WTED_REQUEST_RATE_LIMIT_MS = 10_000
const THIRTY_MINUTES_MS = 30 * 60 * 1000

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

interface SetlistWtedSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: SetlistEntry | null
  show: { show_date: string; show_venue_location: string | null; show_group: string | null }
  releaseArtwork: string | null
}

export function SetlistWtedSheet({
  open,
  onOpenChange,
  entry,
  show,
  releaseArtwork,
}: SetlistWtedSheetProps) {
  const { session } = useAuth()
  const accessToken = session?.access_token ?? null
  const { requests, loading, error, refetch } = useWtedRequests(accessToken, open)

  const [lastRequestTime, setLastRequestTime] = useState<number>(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [countdownMs, setCountdownMs] = useState<number>(0)
  const [requestWaitMs, setRequestWaitMs] = useState<number>(0)

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
  const hasOpenSlot = requests.length < 3
  const nextAvailableAtTimestamp =
    requests.length >= 3 && requests[0]
      ? new Date(requests[0].requested_at).getTime() + THIRTY_MINUTES_MS
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

  const alreadyRequestedEntryIds = new Set(requests.map((r) => r.entry_id))
  const canRequestThisEntry =
    entry &&
    entry.radio_id &&
    hasOpenSlot &&
    !alreadyRequestedEntryIds.has(entry.entry_id) &&
    canRequestByTime
  const requestWaitSeconds = Math.ceil(requestWaitMs / 1000)

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) setSubmitError(null)
      onOpenChange(next)
    },
    [onOpenChange]
  )

  const handleRequest = useCallback(async () => {
    if (!entry || !accessToken || !canRequestThisEntry) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/functions/v1`
        : ""
      const res = await fetch(`${base}/wted-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ entry_id: entry.entry_id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to submit request")
      }
      setLastRequestTime(Date.now())
      await refetch()
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit request"
      )
    } finally {
      setSubmitting(false)
    }
  }, [entry, accessToken, canRequestThisEntry, refetch])

  const buildSlots = (): Array<
    | { type: "request"; request: WtedRequestEnriched }
    | { type: "pending"; entry: SetlistEntry }
    | { type: "waiting"; waitSeconds: number }
    | { type: "request-another" }
    | { type: "empty" }
  > => {
    const slots: Array<
      | { type: "request"; request: WtedRequestEnriched }
      | { type: "pending"; entry: SetlistEntry }
      | { type: "waiting"; waitSeconds: number }
      | { type: "request-another" }
      | { type: "empty" }
    > = []
    for (let i = 0; i < 3; i++) {
      if (requests[i]) {
        slots.push({ type: "request", request: requests[i] })
      } else if (
        i === requests.length &&
        entry?.radio_id &&
        hasOpenSlot &&
        !alreadyRequestedEntryIds.has(entry.entry_id) &&
        canRequestByTime
      ) {
        slots.push({ type: "pending", entry })
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

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="mx-auto w-full max-w-xl text-xs">
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
            Users can request three songs every 30 minutes.
          </p>
        </DrawerHeader>

        <div className="max-h-[52vh] min-h-[140px] overflow-y-auto px-3 pb-3 pt-2">
          {loading ? (
            <div className="flex min-h-[140px] items-center justify-center">
              <p className="text-[11px] text-muted-foreground">
                Loading requests…
              </p>
            </div>
          ) : error ? (
            <p className="text-[11px] text-destructive">{error}</p>
          ) : (
            <div className="space-y-3">
              {entry &&
                alreadyRequestedEntryIds.has(entry.entry_id) && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-center">
                    <p className="text-xs font-normal text-foreground">
                      <span className="font-semibold">
                        {entry.entry_song} ({formatSetlistDate(show.show_date)})
                      </span>{" "}
                      has already been requested.
                    </p>
                  </div>
                )}
              {!hasOpenSlot && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-center">
                  <p className="text-xs font-normal text-foreground">
                    You can request another song in{" "}
                    <span className="inline-flex items-center rounded-full border border-red-500/40 bg-red-500/20 px-1.5 py-[1px] mx-1 font-semibold tabular-nums">
                      {formatCountdown(countdownMs)}
                    </span>{" "}
                    (at {nextAvailableAt ? formatTime(nextAvailableAt) : "—"}).
                  </p>
                </div>
              )}
              {slots
                .filter((slot): slot is Exclude<typeof slot, { type: "empty" }> =>
                  slot.type !== "empty"
                )
                .map((slot, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border p-3",
                    slot.type === "pending" &&
                      "border-primary/50 bg-primary/5 ring-2 ring-primary/20 ring-offset-2 ring-offset-background",
                    (slot.type === "request" ||
                      slot.type === "waiting" ||
                      slot.type === "request-another") &&
                      "border-border/60 bg-muted/30"
                  )}
                >
                  {slot.type === "request" && (
                    <WtedRequestSlotContent request={slot.request} />
                  )}
                  {slot.type === "pending" && (
                    <WtedPendingSlotContent
                      entry={slot.entry}
                      show={show}
                      releaseArtwork={releaseArtwork}
                      onRequest={handleRequest}
                      submitting={submitting}
                      submitError={submitError}
                      waitSeconds={requestWaitSeconds}
                    />
                  )}
                  {slot.type === "waiting" && (
                    <div className="flex min-h-[52px] w-full items-center justify-center text-[11px] font-medium tabular-nums text-muted-foreground">
                      Wait {slot.waitSeconds}s
                    </div>
                  )}
                  {slot.type === "request-another" && (
                    <div className="flex min-h-[52px] w-full items-center justify-center">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleOpenChange(false)}
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

        <DrawerFooter className="border-t border-border/60 pt-3">
          <div className="flex justify-end">
            <DrawerClose asChild>
              <Button type="button" size="sm" variant="ghost">
                Close
              </Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
