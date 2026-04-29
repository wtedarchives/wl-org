"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useGuestAppearances, type GuestCount } from "@/hooks/use-guest-appearances"
import { cn } from "@/lib/utils"
import { GuestAppearancesDrawer } from "./guest-appearances-drawer"
import { WlHomeV2GuestAppearancesModal } from "@/components/wl-home-v2/wl-home-v2-guest-appearances-modal"

interface GuestAppearancesProps {
  showIds: string[]
  tourId?: string
  onDataLoaded?: (hasData: boolean) => void
  /** WL Home tour stats: match `TopSlotsCarousel` widget-panel + wp-head + table chrome. */
  wlHomeV2?: boolean
}

export function GuestAppearances({
  showIds,
  tourId,
  onDataLoaded,
  wlHomeV2 = false,
}: GuestAppearancesProps) {
  const {
    guestCounts,
    loading,
    modalData,
    setModalData,
    handleGuestClick,
  } = useGuestAppearances(showIds, tourId, onDataLoaded)

  if (!loading && guestCounts.length === 0) return null

  const scrollClass = cn(
    "min-w-0 max-h-64 overflow-x-auto overflow-y-auto wl-home-v2-guest-appearances-scroll",
    loading && "opacity-50 transition-opacity duration-300",
  )

  const table = (
    <table
      className={cn(
        "w-full min-w-max border-collapse",
        wlHomeV2 ?
          "text-[11px] leading-3 wl-home-v2-years-table wl-home-v2-top-slots-stats-table"
        : "text-xs",
      )}
    >
      <tbody>
        {guestCounts.map((guest: GuestCount) => (
          <tr
            key={guest.guest_id}
            className={cn(
              "transition-colors",
              wlHomeV2 ?
                "border-b border-[rgb(34,37,35)] bg-transparent hover:bg-[rgba(88,200,174,0.11)] [&:last-child]:border-b-0"
              : "bg-background/70 hover:bg-muted/40",
            )}
          >
            <td
              className={cn(
                wlHomeV2 ? "wl-home-v2-top-slots-stats-cell" : "py-0.5 pl-3",
              )}
            >
              <button
                type="button"
                onClick={() =>
                  handleGuestClick(
                    guest.guest_id,
                    guest.guest,
                    guest.guest_instrument,
                  )
                }
                className={cn(
                  "font-medium hover:underline cursor-pointer text-left",
                  wlHomeV2 ?
                    "text-white/88"
                  : "text-foreground",
                )}
              >
                {guest.guest}
              </button>
            </td>
            <td
              className={cn(
                "text-center font-medium tabular-nums",
                wlHomeV2 ?
                  "w-[30px] wl-home-v2-top-slots-stats-cell text-white/88"
                : "w-[30px] py-1.5 text-foreground",
              )}
            >
              {guest.count}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  const closeGuestDetail = () =>
    setModalData((p) => ({ ...p, isOpen: false }))

  const detailOverlay = wlHomeV2 ? (
    <WlHomeV2GuestAppearancesModal
      modalData={modalData}
      onOpenChange={(open: boolean) => {
        if (!open) closeGuestDetail()
      }}
    />
  ) : (
    <GuestAppearancesDrawer
      modalData={modalData}
      onOpenChange={(open: boolean) => {
        if (!open) closeGuestDetail()
      }}
    />
  )

  if (wlHomeV2) {
    return (
      <>
        <div className="widget-panel w-full min-w-0 shrink-0 overflow-hidden">
          <div className="wp-head wl-home-v2-years-shows-wp-head">
            <span className="min-w-0 truncate">Guest Appearances</span>
          </div>
          <div className={scrollClass}>
            {loading ?
              <div className="py-3 text-center text-[11px] text-white/55">
                Loading…
              </div>
            : table}
          </div>
        </div>
        {detailOverlay}
      </>
    )
  }

  return (
    <>
      <Card className="ring-0 border border-border/60 bg-card/80 overflow-hidden py-0">
        <div className="px-3 py-1.5 bg-muted/60">
          <h2 className="text-sm font-semibold">Guest Appearances</h2>
        </div>
        <CardContent className="p-0 !pb-[6px]">
          {loading ?
            <div className="py-2 text-center text-muted-foreground text-xs">
              Loading…
            </div>
          : (
            <div>{table}</div>
          )}
        </CardContent>
      </Card>
      {detailOverlay}
    </>
  )
}
