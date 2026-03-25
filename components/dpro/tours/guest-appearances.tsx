"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useGuestAppearances, type GuestCount } from "@/hooks/use-guest-appearances"
import { GuestAppearancesDrawer } from "./guest-appearances-drawer"

interface GuestAppearancesProps {
  showIds: string[]
  tourId?: string
  onDataLoaded?: (hasData: boolean) => void
}

export function GuestAppearances({
  showIds,
  tourId,
  onDataLoaded,
}: GuestAppearancesProps) {
  const {
    guestCounts,
    loading,
    modalData,
    setModalData,
    handleGuestClick,
  } = useGuestAppearances(showIds, tourId, onDataLoaded)

  if (!loading && guestCounts.length === 0) return null

  return (
    <>
      <Card className="ring-0 border border-border/60 bg-card/80 overflow-hidden py-0">
        <div className="px-3 py-1.5 bg-muted/60">
          <h2 className="text-sm font-semibold">Guest Appearances</h2>
        </div>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-2 text-center text-muted-foreground text-xs">
              Loading…
            </div>
          ) : (
            <div>
              <table className="w-full border-collapse min-w-max text-xs">
                <tbody>
                  {guestCounts.map((guest: GuestCount) => (
                    <tr
                      key={guest.guest_id}
                      className="bg-background/70 hover:bg-muted/40 transition-colors"
                    >
                      <td className="pl-3 py-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleGuestClick(
                              guest.guest_id,
                              guest.guest,
                              guest.guest_instrument,
                            )
                          }
                          className="font-medium text-foreground hover:underline cursor-pointer text-left"
                        >
                          {guest.guest}
                        </button>
                      </td>
                      <td className="w-[30px] py-1.5 text-center font-medium tabular-nums text-foreground">
                        {guest.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <GuestAppearancesDrawer
        modalData={modalData}
        onOpenChange={(open) =>
          !open && setModalData((p) => ({ ...p, isOpen: false }))
        }
      />
    </>
  )
}
