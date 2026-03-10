"use client"

import Link from "next/link"
import { Loader2 } from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { useSandwichPerformances } from "@/hooks/use-sandwich-performances"
import type { SandwichRow } from "@/hooks/use-unfinished-reprised-data"

function formatShowDate(date: string) {
  if (!date) return ""
  const [year, month, day] = date.split("-")
  if (!year || !month || !day) return date
  return `${month}.${day}.${year.slice(2)}`
}

interface RepriseSandwichPerformancesDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sandwich: SandwichRow | null
}

export function RepriseSandwichPerformancesDrawer({
  open,
  onOpenChange,
  sandwich,
}: RepriseSandwichPerformancesDrawerProps) {
  const { performances, loading, error } = useSandwichPerformances(
    open,
    sandwich,
  )

  const sandwichLabel = sandwich?.songs
    .map((s) => s.song_displayname?.trim() || s.song_name)
    .join(" → ")

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto w-full max-w-2xl text-xs">
        <DrawerHeader className="border-b border-border/60 pt-1 pb-3">
          <DrawerTitle className="sr-only">
            Reprise Lookup – {sandwichLabel}
          </DrawerTitle>
          <div className="space-y-1 text-xs">
            <p className="text-sm font-medium text-foreground">
              Reprise Lookup
            </p>
            <p className="text-muted-foreground">
              {sandwich?.songs.map((s, j) => (
                <span key={s.song_id}>
                  {j > 0 && <span className="text-destructive"> → </span>}
                  <SongDisplayName
                    song={s.song_name}
                    songDisplayName={s.song_displayname}
                  />
                </span>
              ))}
            </p>
            <p className="text-muted-foreground">
              {performances.length} performance
              {performances.length !== 1 ? "s" : ""}
            </p>
          </div>
        </DrawerHeader>

        <div className="max-h-[52vh] min-h-[140px] overflow-y-auto px-3 pb-3 pt-2">
          {loading ? (
            <div className="flex min-h-[140px] items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              <span>Loading performances…</span>
            </div>
          ) : error ? (
            <p className="text-xs text-destructive">{error}</p>
          ) : performances.length === 0 ? (
            <p className="py-2 text-xs text-muted-foreground">
              No performances found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-full text-xs">
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-center font-medium">
                      Date
                    </TableHead>
                    <TableHead className="font-medium">Location</TableHead>
                    <TableHead className="text-center font-medium">Length</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performances.map((p) => (
                    <TableRow key={p.show_id} className="border-border/60">
                      <TableCell className="text-center tabular-nums">
                        <Link
                          href={`/dpro/setlist/${p.show_id}`}
                          className="hover:underline"
                        >
                          {formatShowDate(p.show_date)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {p.venue_id ? (
                          <Link
                            href={`/dpro/venue/${p.venue_id}`}
                            className="hover:underline"
                          >
                            {p.show_venue_location ?? p.show_subvenue}
                          </Link>
                        ) : p.show_subvenue_venue ? (
                          <Link
                            href={`/dpro/venue/${encodeURIComponent(p.show_subvenue_venue)}`}
                            className="hover:underline"
                          >
                            {p.show_venue_location ?? p.show_subvenue}
                          </Link>
                        ) : (
                          p.show_venue_location ?? p.show_subvenue
                        )}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {p.combined_length}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
