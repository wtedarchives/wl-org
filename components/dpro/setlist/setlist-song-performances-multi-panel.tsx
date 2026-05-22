"use client"

import { Fragment } from "react"
import { CircleNotch } from "@phosphor-icons/react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  SetlistSongPerformanceSectionHeaderRow,
  SetlistSongPerformanceTableRow,
} from "@/components/dpro/setlist/setlist-song-performance-table-row"
import { useMultiSongTourPerformances } from "@/hooks/use-multi-song-tour-performances"
import type { SetlistEntry } from "@/types/setlist"

type SetlistSongPerformancesMultiPanelProps = {
  open: boolean
  onDismiss: () => void
  entries: SetlistEntry[]
  tourName: string | null
  className?: string
}

/**
 * Unified tour-performance table for combined song pair rows — one header, JOTY-style
 * section dividers, shared column layout.
 */
export function SetlistSongPerformancesMultiPanel({
  open,
  onDismiss,
  entries,
  tourName,
  className,
}: SetlistSongPerformancesMultiPanelProps) {
  const { sections, loading, error } = useMultiSongTourPerformances(
    open,
    entries,
    tourName,
  )

  return (
    <div
      className={
        className ??
        "flex min-h-0 flex-1 flex-col overflow-hidden text-xs"
      }
    >
      <div className="wl-home-v2-years-table-scroll min-h-[140px] min-w-0 flex-1 overflow-y-auto px-0.5 pt-0.5 pb-1.5">
        {loading ?
          <div className="flex items-center gap-2 py-6 text-[11px] text-white/55">
            <CircleNotch className="size-4 animate-spin" aria-hidden />
            <span>Loading performances…</span>
          </div>
        : error ?
          <p className="text-[11px] text-destructive">{error}</p>
        : sections.every((section) => section.performances.length === 0) ?
          <p className="py-2 text-[11px] text-white/55">
            No performances of these songs were found in this tour.
          </p>
        : <div className="w-full overflow-x-auto">
            <Table className="min-w-max set-table">
              <TableHeader>
                <TableRow>
                  <TableHead className="center whitespace-nowrap">Date</TableHead>
                  <TableHead className="set-table-perf-head" aria-hidden />
                  <TableHead className="whitespace-nowrap">Venue</TableHead>
                  <TableHead className="text-left whitespace-nowrap">&nbsp;</TableHead>
                  <TableHead className="center whitespace-nowrap">Length</TableHead>
                  <TableHead className="max-w-[400px] min-w-0 whitespace-normal text-left">
                    Coach&apos;s Notes
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sections.map((section, sectionIndex) => (
                  <Fragment key={section.entry.entry_id}>
                    <SetlistSongPerformanceSectionHeaderRow
                      songName={section.entry.entry_song}
                      songDisplayName={section.entry.songs?.song_displayname}
                      songId={section.entry.song_id}
                      showTopBorder={sectionIndex > 0}
                      onDismiss={onDismiss}
                      wlHomeV2YearsTable
                    />
                    {section.performances.length === 0 ?
                      <TableRow className="song-row">
                        <TableCell
                          colSpan={6}
                          className="modal-setlist-song-section-empty"
                        >
                          No performances in this tour.
                        </TableCell>
                      </TableRow>
                    : section.performances.map((perf) => (
                        <SetlistSongPerformanceTableRow
                          key={perf.entry_id}
                          perf={perf}
                          onDismiss={onDismiss}
                          wlHomeV2YearsTable
                        />
                      ))
                    }
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        }
      </div>
    </div>
  )
}
