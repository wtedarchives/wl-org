"use client"

import { formatInstrument } from "@/lib/personnel-utils"
import type { GuestInfo } from "@/hooks/use-guest-data"

export function WlHomeV2PersonnelArchiveDetailHeader({
  guest,
  displayName,
}: {
  guest: GuestInfo
  displayName: string
}) {
  const instrument = guest.guest_instrument
    ? formatInstrument(guest.guest_instrument, { wrapInParens: false })
    : null

  return (
    <div className="song-header">
      <div className="left">
        <div>
          <h1>
            {displayName}
            {instrument ?
              <span className="alt-name">{instrument}</span>
            : null}
          </h1>
        </div>
      </div>
    </div>
  )
}
