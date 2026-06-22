"use client"

import { Button } from "@/components/ui/button"
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
import { SetlistWtedPairPendingOptions } from "@/components/dpro/setlist/setlist-wted-pair-pending-options"

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
  isMultiPairMode = false,
  wtedEntryOptions = null,
  handleRequestEntry,
  submittingRadioId = null,
  submitErrorByRadioId = {},
  alreadyRequestedRadioIds,
  canRequestByTime,
  setlist,
  open,
  fallbackReleaseArtwork,
  onRequestAnother,
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
  isMultiPairMode?: boolean
  wtedEntryOptions?: SetlistEntry[] | null
  handleRequestEntry?: (entry: SetlistEntry) => void | Promise<void>
  submittingRadioId?: string | null
  submitErrorByRadioId?: Record<string, string>
  alreadyRequestedRadioIds?: Set<string>
  canRequestByTime?: boolean
  setlist?: SetlistEntry[]
  open?: boolean
  fallbackReleaseArtwork?: string | null
  onRequestAnother?: () => void
}) {
  const slotVisualVariant = variant === "modal" ? "wlHomeV2" : "drawer"
  const handleRequestAnother = () => {
    if (onRequestAnother) {
      onRequestAnother()
    } else {
      onOpenChange(false)
    }
  }

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
                        onClick={handleRequestAnother}
                      >
                        Request another song
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              {isMultiPairMode &&
                wtedEntryOptions &&
                handleRequestEntry &&
                alreadyRequestedRadioIds &&
                setlist &&
                open != null &&
                canRequestByTime != null && (
                  <SetlistWtedPairPendingOptions
                    entries={wtedEntryOptions}
                    setlist={setlist}
                    show={show}
                    open={open}
                    fallbackReleaseArtwork={fallbackReleaseArtwork ?? null}
                    alreadyRequestedRadioIds={alreadyRequestedRadioIds}
                    onRequestEntry={handleRequestEntry}
                    submittingRadioId={submittingRadioId}
                    submitErrorByRadioId={submitErrorByRadioId}
                    waitSeconds={requestWaitSeconds}
                    hasOpenSlot={hasOpenSlot}
                    canRequestByTime={canRequestByTime}
                    visualVariant="wlHomeV2"
                  />
                )}
            </div>
          : <>
              {filteredSlots.map((slot, i) => (
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
                      onClick={handleRequestAnother}
                    >
                      Request another song
                    </Button>
                  </div>
                )}
              </div>
            ))}
              {isMultiPairMode &&
                wtedEntryOptions &&
                handleRequestEntry &&
                alreadyRequestedRadioIds &&
                setlist &&
                open != null &&
                canRequestByTime != null && (
                  <SetlistWtedPairPendingOptions
                    entries={wtedEntryOptions}
                    setlist={setlist}
                    show={show}
                    open={open}
                    fallbackReleaseArtwork={fallbackReleaseArtwork ?? null}
                    alreadyRequestedRadioIds={alreadyRequestedRadioIds}
                    onRequestEntry={handleRequestEntry}
                    submittingRadioId={submittingRadioId}
                    submitErrorByRadioId={submitErrorByRadioId}
                    waitSeconds={requestWaitSeconds}
                    hasOpenSlot={hasOpenSlot}
                    canRequestByTime={canRequestByTime}
                    visualVariant="drawer"
                  />
                )}
            </>}
        </div>
      }
    </div>
  )
}
