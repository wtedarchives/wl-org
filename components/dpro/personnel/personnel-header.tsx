"use client"

import { PersonnelSearch } from "@/components/dpro/personnel/personnel-search"
import { formatInstrument } from "@/lib/personnel-utils"
import { Card, CardContent } from "@/components/ui/card"

interface PersonnelHeaderProps {
  guestName: string
  guestInstrument: string | null
}

export function PersonnelHeader({
  guestName,
  guestInstrument,
}: PersonnelHeaderProps) {
  return (
    <Card className="border-border/60 bg-card/80 py-0 overflow-hidden">
      <CardContent className="flex flex-row flex-wrap items-center justify-between gap-2 px-3 py-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <h1 className="text-base font-semibold truncate">{guestName}</h1>
          {guestInstrument && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              {formatInstrument(guestInstrument, { wrapInParens: false })}
            </span>
          )}
        </div>
        <PersonnelSearch />
      </CardContent>
    </Card>
  )
}
