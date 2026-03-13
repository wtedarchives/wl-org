"use client"

import Image from "next/image"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { useRadioSchedule, type RadioScheduleSlot } from "@/hooks/use-radio-schedule"

function formatTimeRange(start: string, end: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }
  return `${startDate.toLocaleTimeString(undefined, options)} – ${endDate.toLocaleTimeString(undefined, options)}`
}

function ScheduleRow({ slot }: { slot: RadioScheduleSlot }) {
  const { event, isNowPlaying } = slot
  const { title, artwork } = event.playlist
  const timeRange = formatTimeRange(event.start, event.end)

  return (
    <TableRow className="border-wl-dark-grey/50 hover:bg-wl-dark-grey/30">
      <TableCell className="w-[40px] pl-2 pr-1 py-1 align-middle">
        <div className="relative size-8 overflow-hidden rounded">
          <Image
            src={artwork}
            alt=""
            width={32}
            height={32}
            className="object-cover"
            unoptimized
          />
        </div>
      </TableCell>
      <TableCell className="min-w-0 pl-1 pr-2 py-1 align-middle">
        <div className="flex flex-col">
          <span
            className="truncate text-[11px] font-semibold text-wl-white"
            title={title}
          >
            {title}
          </span>
          <span className="text-[10px] text-wl-white/80">{timeRange}</span>
        </div>
      </TableCell>
      <TableCell className="w-[60px] px-2 py-1 text-right align-middle">
        {isNowPlaying ? (
          <span className="inline-flex shrink-0 items-center justify-end gap-1.5 rounded-full bg-wl-dark-grey/80 px-2 py-0.5 text-[10px] font-medium text-wl-white">
            <span className="relative flex size-3">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-wl-orange opacity-75" />
              <span className="relative inline-flex size-3 shrink-0 rounded-full bg-wl-orange" />
            </span>
            Live
          </span>
        ) : null}
      </TableCell>
    </TableRow>
  )
}

const cardClassName =
  "rounded-xl border border-wl-dark-grey/50 bg-wl-dark-grey/40 py-0 text-xs shadow-sm ring-0"

export function WtedRadioScheduleCard() {
  const { slots, loading, error } = useRadioSchedule()

  if (loading) {
    return (
      <Card className={cardClassName}>
        <CardHeader className="border-b border-wl-dark-grey/50 py-2">
          <CardTitle className="text-[13px] font-semibold text-wl-white">
            Upcoming Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex items-center justify-center px-3 py-6 text-[11px] text-wl-white/70">
            Loading schedule…
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cardClassName}>
        <CardHeader className="border-b border-wl-dark-grey/50 py-2">
          <CardTitle className="text-[13px] font-semibold text-wl-white">
            Upcoming Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-3 py-3 text-center text-[11px] text-wl-white/70">
            Schedule unavailable
          </div>
        </CardContent>
      </Card>
    )
  }

  if (slots.length === 0) {
    return (
      <Card className={cardClassName}>
        <CardHeader className="border-b border-wl-dark-grey/50 py-2">
          <CardTitle className="text-[13px] font-semibold text-wl-white">
            Upcoming Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-3 py-3 text-center text-[11px] text-wl-white/70">
            No schedule data
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cardClassName}>
      <CardHeader className="border-b border-wl-dark-grey/50 py-2">
        <CardTitle className="text-[13px] font-semibold text-wl-white">
          Upcoming Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table className="text-[11px] [&_tr:last-child_td]:pb-2">
          <TableBody>
            {slots.map((slot) => (
              <ScheduleRow key={slot.event.event_id} slot={slot} />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
