"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"

const FLODOWN_EVENTS = [
  { month: "APR", date: "10", title: "Asheville Flodown", subtext: "Asheville Brewery – Asheville, NC" },
  { month: "APR", date: "17", title: "Clearwater Flodown", subtext: "Clearwater Public Park – Clearwater, FL" },
  { month: "APR", date: "25", title: "Irving Flodown", subtext: "Celestial Beerworks – Dallas, TX" },
  { month: "DEC", date: "24", title: "Goosemas Flodown", subtext: "United Center – Chicago, IL" },
] as const

function CalendarIcon({ month, date }: { month: string; date: string }) {
  return (
    <div className="flex h-14 w-14 flex-col items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm">
      <span className="text-[11px] font-bold uppercase leading-none text-[#FF3B30]">
        {month}
      </span>
      <span className="text-xl font-light leading-none text-black">
        {date}
      </span>
    </div>
  )
}

const cardClassName =
  "rounded-xl border border-wl-dark-grey/50 bg-[#844b45] py-0 text-xs shadow-sm ring-0"

export function FlodownEventsCard() {
  return (
    <Card className={cardClassName}>
      <CardHeader className="border-b border-wl-dark-grey/50 py-2 bg-[#b2655e]">
        <CardTitle className="text-[13px] font-semibold text-wl-white">
          Upcoming Community Events
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 [&_[data-slot=table-container]]:overflow-visible">
        <Table className="w-full min-w-0 table-fixed text-[11px] [&_tr:last-child_td]:pb-2">
          <TableBody>
            {FLODOWN_EVENTS.map((item, index) => (
              <TableRow
                key={index}
                className="border-wl-dark-grey/40 hover:bg-[#b2655e]"
              >
                <TableCell className="w-[66px] pl-2 pr-2 py-1 align-middle">
                  <CalendarIcon month={item.month} date={item.date} />
                </TableCell>
                <TableCell className="min-w-0 pl-2 pr-2 py-1 align-middle whitespace-normal">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span
                      className="break-words text-[12px] font-semibold text-wl-white leading-3.5"
                      title={item.title}
                    >
                      {item.title}
                    </span>
                    <span className="text-[11px] text-wl-white/80">{item.subtext}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
