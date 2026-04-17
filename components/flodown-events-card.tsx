"use client"

import Link from "next/link"
import { Calendar1 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

const FLODOWN_EVENTS = [
  {
    month: "APR",
    day: 19,
    name: "St. Augustine Flamingo Flodown",
    venue: "Spinster Abbott's",
    location: "St. Augustine, FL",
    href: "https://www.instagram.com/p/DTBjr3WEnzU/?img_index=1",
  },
  {
    month: "APR",
    day: 22,
    name: "NOLA Flodown",
    venue: "Miel Brewery and Taproom",
    location: "New Orleans, LA",
    href: "https://www.instagram.com/p/DXIzhjpjK-g/?img_index=1",
  },
  {
    month: "APR",
    day: 25,
    name: "Dallas Flodown",
    venue: "Celestial Beerworks",
    location: "Dallas, TX",
    href: "https://www.celestialbeerworks.com/celestial-beerworks-taproom/2026/4/25/dallas-unofficial-goose-flodown",
  },
] as const

function CalendarIcon({
  month,
  date,
  square,
}: {
  month: string
  date: string
  square?: boolean
}) {
  return (
    <div
      className={cn(
        "ml-2 flex h-14 w-14 shrink-0 flex-col items-center justify-center overflow-hidden bg-white shadow-sm",
        square ? "rounded-none" : "rounded-xl",
      )}
    >
      <span className="text-[11px] font-bold uppercase leading-none text-[#FF3B30]">
        {month}
      </span>
      <span className="text-xl font-light leading-none text-black">
        {date}
      </span>
    </div>
  )
}

export function FlodownEventsCard({
  variant = "default",
}: {
  variant?: "default" | "accordion"
}) {
  const isAccordion = variant === "accordion"

  return (
    <Card
      className={cn(
        "bg-[#844b45] py-0 text-xs shadow-sm ring-0 border border-wl-dark-grey/50",
        isAccordion ? "rounded-none border-0 shadow-none" : "rounded-xl",
      )}
    >
      {!isAccordion ? (
        <CardHeader className="border-b border-wl-dark-grey/50 py-2 bg-[#b2655e]">
          <div className="flex flex-row items-center justify-between gap-2 min-w-0">
            <CardTitle className="shrink-0 text-[13px] font-semibold text-wl-white">
              Upcoming Community Events
            </CardTitle>
            <Calendar1 className="size-4 shrink-0 text-wl-white/80" />
          </div>
        </CardHeader>
      ) : null}
      <CardContent className="p-0 [&_[data-slot=table-container]]:overflow-visible">
        <Table className="w-full min-w-0 text-[11px]">
          <TableBody>
            {FLODOWN_EVENTS.map((item) => (
              <TableRow
                key={item.href}
                className="group border-wl-dark-grey/40 hover:bg-[#b2655e]"
              >
                <TableCell colSpan={2} className="p-0 align-middle">
                  <Link
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={item.name}
                    className={cn(
                      "flex min-h-[72px] min-w-0 flex-row items-stretch gap-0 outline-none transition-colors",
                      "focus-visible:ring-2 focus-visible:ring-wl-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#844b45]",
                    )}
                  >
                    <div className="box-border flex w-[66px] min-w-[66px] max-w-[66px] shrink-0 basis-[66px] items-center justify-center py-1 pl-2 pr-2">
                      <CalendarIcon
                        month={item.month}
                        date={String(item.day)}
                        square={isAccordion}
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-1 pl-2 pr-2 whitespace-normal">
                      <span className="break-words text-[12px] font-semibold leading-3.5 text-wl-white group-hover:underline">
                        {item.name}
                      </span>
                      <span className="text-[11px] text-wl-white/80">
                        {item.venue} – {item.location}
                      </span>
                    </div>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
