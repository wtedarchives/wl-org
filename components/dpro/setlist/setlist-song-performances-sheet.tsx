"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { supabase } from "@/lib/supabase"
import { formatSetlistDate, formatEntryLength } from "@/lib/setlist-utils"
import { getPlacementIndexCellBg } from "@/components/dpro/setlist/display-setlist-table.constants"
import type { Guest, SetlistEntry } from "@/types/setlist"

interface SetlistSongPerformancesSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: SetlistEntry | null
  /** Human-readable tour name, e.g. "Fall 2024 Tour". */
  tourName: string | null
}

interface SongPerformance {
  entry_id: string
  entry_set: string
  entry_setnum: number
  entry_placement: string
  entry_song: string
  entry_short: string | null
  entry_segue: string | null
  entry_length: string | null
  entry_coachnotes: string | null
  show_id: string
  show_date: string
  show_canonid: number | null
  show_subvenue: string
  show_venue_location: string
  show_subvenue_venue: string | null
  guests: Guest[]
}

function useSongTourPerformances(
  open: boolean,
  songName: string | null,
  tourName: string | null,
) {
  const [performances, setPerformances] = useState<SongPerformance[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !songName || !tourName || !supabase) {
      setPerformances([])
      setLoading(false)
      setError(null)
      return
    }

    const client = supabase

    async function fetchPerformances() {
      try {
        setLoading(true)
        setError(null)

        const { data, error: dbError } = await client
          .from("setlist_entries")
          .select(
            `
            entry_id,
            entry_set,
            entry_setnum,
            entry_song,
            entry_short,
            entry_segue,
            entry_length,
            entry_placement,
            entry_coachnotes,
            entry_show,
            shows!inner(
              show_id,
              show_date,
              show_canonid,
              show_tour,
              show_subvenue,
              show_venue_location,
              show_subvenue_venue
            ),
            setlist_entry_guests(
              guest_id,
              guests(
                guest_displayname,
                guest_canonid,
                guest_instrument,
                guest_category
              )
            )
          `,
          )
          .eq("entry_song", songName)
          .eq("shows.show_tour", tourName)

        if (dbError) throw dbError

        const rows = (data ?? []) as any[]

        const mapped = rows.map((row: any) => {
          const showsRel = row.shows as
            | {
                show_id: string
                show_date: string
                show_canonid?: number | null
                show_subvenue: string
                show_venue_location: string
                show_subvenue_venue?: string | null
              }
            | {
                show_id: string
                show_date: string
                show_canonid?: number | null
                show_subvenue: string
                show_venue_location: string
                show_subvenue_venue?: string | null
              }[]
            | undefined

          const show =
            Array.isArray(showsRel) && showsRel.length > 0
              ? showsRel[0]
              : (showsRel as
                  | {
                      show_id: string
                      show_date: string
                      show_canonid?: number | null
                      show_subvenue: string
                      show_venue_location: string
                      show_subvenue_venue?: string | null
                    }
                  | undefined)

          const guestsRaw = row.setlist_entry_guests as
            | Array<{
                guest_id: string
                guests: {
                  guest_displayname: string
                  guest_canonid: number
                  guest_instrument: string
                  guest_category?: string | null
                }
              }>
            | undefined

          const guests: Guest[] =
            guestsRaw
              ?.map((g) => ({
                guest_id: g.guest_id,
                guest_display_name: g.guests.guest_displayname,
                guest_canonid: g.guests.guest_canonid,
                guest_instrument: g.guests.guest_instrument,
                guest_category: g.guests.guest_category ?? null,
              }))
              .sort((a, b) => a.guest_canonid - b.guest_canonid) ?? []

          return {
            entry_id: row.entry_id as string,
            entry_set: row.entry_set as string,
            entry_setnum: Number(row.entry_setnum),
            entry_placement: (row.entry_placement as string) ?? "",
            entry_song: row.entry_song as string,
            entry_short: (row.entry_short as string | null) ?? null,
            entry_segue: (row.entry_segue as string | null) ?? null,
            entry_length: (row.entry_length as string | null) ?? null,
            entry_coachnotes: (row.entry_coachnotes as string | null) ?? null,
            show_id: show?.show_id ?? (row.entry_show as string),
            show_date: show?.show_date ?? "",
            show_canonid: show?.show_canonid ?? null,
            show_subvenue: show?.show_subvenue ?? "",
            show_venue_location: show?.show_venue_location ?? "",
            show_subvenue_venue: show?.show_subvenue_venue ?? null,
            guests,
          }
        }) as SongPerformance[]

        mapped.sort((a, b) => {
          if (a.show_date !== b.show_date)
            return a.show_date.localeCompare(b.show_date)
          const canonA = a.show_canonid ?? 999999
          const canonB = b.show_canonid ?? 999999
          if (canonA !== canonB) return canonA - canonB
          if (a.entry_set !== b.entry_set)
            return a.entry_set.localeCompare(b.entry_set)
          return a.entry_setnum - b.entry_setnum
        })

        setPerformances(mapped)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching song tour performances:", err)
        setError("Unable to load performances.")
        setPerformances([])
      } finally {
        setLoading(false)
      }
    }

    fetchPerformances()
  }, [open, songName, tourName])

  return { performances, loading, error }
}

export function SetlistSongPerformancesSheet({
  open,
  onOpenChange,
  entry,
  tourName,
}: SetlistSongPerformancesSheetProps) {
  const songName = entry?.entry_song ?? ""

  const { performances, loading, error } = useSongTourPerformances(
    open,
    entry?.entry_song ?? null,
    tourName,
  )

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto w-full max-w-4xl text-xs">
        <DrawerHeader className="border-b border-border/60 pb-3">
          {entry ? (
            <div className="space-y-1 text-[11px]">
              <p className="text-sm font-medium text-foreground">{songName}</p>
              {tourName && (
                <p className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {tourName}
                </p>
              )}
            </div>
          ) : (
            <DrawerDescription>No song selected.</DrawerDescription>
          )}
        </DrawerHeader>

        <div className="max-h-[52vh] min-h-[140px] overflow-y-auto px-3 pb-3 pt-2">
          {!entry ? (
            <p className="text-[11px] text-muted-foreground">
              Select a song in the setlist to view its tour performances.
            </p>
          ) : loading ? (
            <div className="flex items-center gap-2 py-6 text-[11px] text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              <span>Loading performances…</span>
            </div>
          ) : error ? (
            <p className="text-[11px] text-destructive">{error}</p>
          ) : performances.length === 0 ? (
            <p className="py-2 text-[11px] text-muted-foreground">
              No performances of this song were found in this tour.
            </p>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table className="min-w-full border-separate border-spacing-y-0.25 text-[11px]">
                <TableHeader>
                  <TableRow className="border-b border-border/60">
                    <TableHead className="whitespace-nowrap text-center text-[11px]">
                      Date
                    </TableHead>
                    <TableHead className="w-1 shrink-0 p-0" aria-hidden />
                    <TableHead className="whitespace-nowrap text-[11px]">
                      Venue
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-left text-[11px]">
                      &nbsp;
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center text-[11px]">
                      Length
                    </TableHead>
                    <TableHead className="min-w-[400px] max-w-[400px] whitespace-normal text-[11px]">
                      Coach's Notes
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performances.map((perf) => {
                    return (
                      <TableRow
                        key={`${perf.show_id}-${perf.entry_id}`}
                        className="align-middle"
                      >
                        <TableCell className="whitespace-nowrap align-middle px-2 py-1 text-center text-[11px]">
                          {formatSetlistDate(perf.show_date)}
                        </TableCell>
                        <TableCell
                          className="relative w-2 shrink-0 p-0 align-middle"
                          aria-hidden
                        >
                          {perf.entry_placement ? (
                            <div
                              className="absolute inset-y-1 w-1 left-0 right-0 rounded-sm"
                              style={{
                                backgroundColor: getPlacementIndexCellBg(
                                  perf.entry_placement,
                                ),
                              }}
                              aria-hidden
                            />
                          ) : null}
                        </TableCell>
                        <TableCell className="align-middle px-2 py-1 text-[11px]">
                          {perf.show_venue_location || "—"}
                        </TableCell>
                        <TableCell className="align-middle px-2 py-1 text-left text-[11px]">
                          <div className="inline-flex items-center gap-1">
                            {perf.entry_short && (
                              <span className="text-[0.625rem] text-red-400">
                                [{perf.entry_short}]
                              </span>
                            )}
                            {perf.entry_segue && (
                              <span className="text-[0.625rem] text-red-400">
                                →
                                {perf.entry_segue.replace(/^>\s*/, "").trim()}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap align-middle px-2 py-1 text-center text-[11px]">
                          {formatEntryLength(perf.entry_length) || "—"}
                        </TableCell>
                        <TableCell className="min-w-[400px] max-w-[400px] align-middle whitespace-normal px-2 py-1 text-[11px]">
                          {perf.entry_coachnotes && (
                            <div className="text-[10px] leading-tight text-muted-foreground [&_a]:bg-[#844240] [&_a]:font-medium [&_a]:text-wl-white [&_a]:rounded-full [&_a]:px-1.5 [&_a]:py-0.5 [&_a]:hover:underline">
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: perf.entry_coachnotes.trim(),
                                }}
                              />
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DrawerFooter className="border-t border-border/60 pt-3">
          <div className="flex flex-col items-stretch justify-end gap-2 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              {entry?.song_id && (
                <Button type="button" size="sm" variant="outline" asChild>
                  <Link href={`/dpro/songs/${entry.song_id}`}>
                    View full song history
                  </Link>
                </Button>
              )}
              <DrawerClose asChild>
                <Button type="button" size="sm" variant="ghost">
                  Close
                </Button>
              </DrawerClose>
            </div>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

