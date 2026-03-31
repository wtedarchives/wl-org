"use client"

import {
  useCallback,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react"
import Image from "next/image"

import { Radio } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { useRadioSchedule, type RadioScheduleSlot } from "@/hooks/use-radio-schedule"
import { WTED_SCHEDULE_EMBED_URL } from "@/lib/wted-schedule-embed"
import { cn } from "@/lib/utils"

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
    <TableRow className="border-wl-dark-grey/50 hover:bg-[#3d4842]">
      <TableCell className="w-[66px] pl-2 !pr-1 py-1 align-middle">
        <div className="relative h-14 w-14 overflow-hidden rounded">
          <Image
            src={artwork}
            alt=""
            fill
            sizes="56px"
            className="object-cover object-center"
            unoptimized
          />
        </div>
      </TableCell>
      <TableCell className="min-w-0 pl-2 pr-2 py-1 align-middle whitespace-normal">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1 flex flex-col">
            <span
              className="break-words text-[12px] font-semibold text-wl-white leading-3.5"
              title={title}
            >
              {title}
            </span>
            <span className="text-[11px] text-wl-white/80">{timeRange}</span>
          </div>
          {isNowPlaying ? (
            <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[#2a332f] px-2 py-0.5 text-[10px] font-medium text-wl-white">
              <span className="relative flex size-3">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-wl-orange opacity-75" />
                <span className="relative inline-flex size-3 shrink-0 rounded-full bg-wl-orange" />
              </span>
              Live
            </span>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  )
}

const cardClassName =
  "rounded-xl border border-wl-dark-grey/50 bg-[#313a34] py-0 text-xs shadow-sm ring-0"

export function WtedRadioScheduleCard({
  className,
  hideHeader = false,
}: {
  className?: string
  /** Omit card header (e.g. when used inside an accordion trigger). */
  hideHeader?: boolean
}) {
  const mergedClassName = cn(
    cardClassName,
    !hideHeader &&
      "cursor-pointer transition-colors duration-200 ease-out hover:bg-[#3a433d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wl-orange/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#313a34]",
    className,
  )
  const { slots, loading, error } = useRadioSchedule()
  const [scheduleOpen, setScheduleOpen] = useState(false)

  const openSchedule = useCallback(() => setScheduleOpen(true), [])

  const handleCardKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        openSchedule()
      }
    },
    [openSchedule],
  )

  let body: ReactNode
  if (loading) {
    body = (
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        <div className="flex flex-1 items-center justify-center px-3 py-6 text-[11px] text-wl-white/70">
          Loading schedule…
        </div>
      </CardContent>
    )
  } else if (error) {
    body = (
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        <div className="flex flex-1 items-center justify-center px-3 py-3 text-center text-[11px] text-wl-white/70">
          Schedule unavailable
        </div>
      </CardContent>
    )
  } else if (slots.length === 0) {
    body = (
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        <div className="flex flex-1 items-center justify-center px-3 py-3 text-center text-[11px] text-wl-white/70">
          No schedule data
        </div>
      </CardContent>
    )
  } else {
    body = (
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-y-auto p-0 [&_[data-slot=table-container]]:overflow-visible">
        <Table className="w-full min-w-0 table-fixed text-[11px] [&_tr:last-child_td]:pb-2">
          <TableBody>
            {slots.map((slot) => (
              <ScheduleRow key={slot.event.event_id} slot={slot} />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    )
  }

  return (
    <>
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent
          className="max-h-[90vh] max-w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0 sm:max-w-lg md:max-w-6xl"
          showCloseButton
        >
          <DialogHeader className="border-b border-border px-4 py-3 text-left">
            <DialogTitle className="text-base">Upcoming Schedule</DialogTitle>
          </DialogHeader>
          <div className="p-3 sm:p-4">
            <iframe
              src={WTED_SCHEDULE_EMBED_URL}
              title="WTED Schedule"
              allow="autoplay"
              scrolling="no"
              className="h-[min(600px,70vh)] w-full rounded-md border-0 shadow-xl sm:h-[600px]"
            />
          </div>
        </DialogContent>
      </Dialog>

      <Card
        className={mergedClassName}
        role={hideHeader ? undefined : "button"}
        tabIndex={hideHeader ? undefined : 0}
        aria-haspopup={hideHeader ? undefined : "dialog"}
        aria-label={hideHeader ? undefined : "Open full WTED schedule"}
        onClick={hideHeader ? undefined : openSchedule}
        onKeyDown={hideHeader ? undefined : handleCardKeyDown}
      >
        {!hideHeader ? (
          <CardHeader className="border-b border-wl-dark-grey/50 py-2 bg-black/30">
            <div className="flex min-w-0 flex-row items-center justify-between gap-2">
              <CardTitle className="shrink-0 text-[13px] font-semibold text-wl-white">
                Upcoming Schedule
              </CardTitle>
              <Radio className="size-4 shrink-0 text-wl-white/80" />
            </div>
          </CardHeader>
        ) : null}
        {hideHeader ? (
          <div
            role="button"
            tabIndex={0}
            aria-label="Open full WTED schedule"
            onClick={openSchedule}
            onKeyDown={handleCardKeyDown}
            className="min-h-0 flex-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wl-orange/40 focus-visible:ring-inset"
          >
            {body}
          </div>
        ) : (
          body
        )}
      </Card>
    </>
  )
}
