"use client"

import type { ReactNode } from "react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import {
  DrawerClose,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import type { SetlistEntry } from "@/types/setlist"
import type { WtedRequestEnriched } from "@/types/wted"
import { formatSetlistDate } from "@/lib/setlist-utils"
import { cn } from "@/lib/utils"
import {
  formatCountdown,
  formatTime,
  type SetlistWtedShowContext,
} from "@/components/dpro/setlist/setlist-wted-panel.lib"
import {
  WtedPendingSlotContent,
  WtedRequestSlotContent,
  WtedSegmentsTitle,
} from "@/components/dpro/setlist/setlist-wted-slot-content"

export type WtedPanelSlot =
  | { type: "request"; request: WtedRequestEnriched }
  | { type: "pending"; groupEntries: SetlistEntry[] }
  | { type: "waiting"; waitSeconds: number }
  | { type: "request-another" }
  | { type: "empty" }

export function SetlistWtedPanelScrollBody({
  variant,
  scrollClassName,
  loading,
  error,
  bannerAlreadyRequested,
  segmentsForBanner,
  show,
  hasOpenSlot,
  countdownMs,
  nextAvailableAt,
  filteredSlots,
  releaseArtwork,
  artworkLoading,
  handleRequest,
  submitting,
  submitError,
  requestWaitSeconds,
  onOpenChange,
}: {
  variant: "drawer" | "modal"
  scrollClassName?: string
  loading: boolean
  error: string | null
  bannerAlreadyRequested: boolean
  segmentsForBanner: Array<{
    song: string
    song_displayname: string | null
    entry_short: string | null
  }>
  show: SetlistWtedShowContext
  hasOpenSlot: boolean
  countdownMs: number
  nextAvailableAt: Date | null
  filteredSlots: Exclude<WtedPanelSlot, { type: "empty" }>[]
  releaseArtwork: string | null
  artworkLoading: boolean
  handleRequest: () => void | Promise<void>
  submitting: boolean
  submitError: string | null
  requestWaitSeconds: number
  onOpenChange: (open: boolean) => void
}) {
  const slotVisualVariant = variant === "modal" ? "wlHomeV2" : "drawer"

  return (
    <div
      className={cn(
        variant === "drawer" &&
          "min-h-[140px] max-h-[52vh] overflow-y-auto px-3 pb-3 pt-2",
        variant === "modal" && "wl-home-v2-wted-modal-scroll",
        scrollClassName,
      )}
    >
      {loading ?
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
      : error ?
        <p
          className={cn(
            variant === "modal" ?
              "wl-home-v2-wted-modal-error"
            : "text-[11px] text-destructive",
          )}
        >
          {error}
        </p>
      : <div
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
      }
    </div>
  )
}

export function SetlistWtedPanelDrawerChrome({
  children,
}: {
  children: ReactNode
}) {
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
      {children}
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
