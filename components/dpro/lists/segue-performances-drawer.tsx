"use client"


import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
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
import { useSeguePerformances } from "@/hooks/use-segue-performances"

function formatShowDate(date: string) {
  if (!date) return ""
  const [year, month, day] = date.split("-")
  if (!year || !month || !day) return date
  return `${month}.${day}.${year.slice(2)}`
}

interface SeguePerformancesDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceSong: string | null
  sourceDisplayName: string | null
  destSong: string | null
  destDisplayName: string | null
}

export function SeguePerformancesDrawer({
  open,
  onOpenChange,
  sourceSong,
  sourceDisplayName,
  destSong,
  destDisplayName,
}: SeguePerformancesDrawerProps) {
  const { performances, loading, error } = useSeguePerformances(
    open,
    sourceSong,
    destSong,
  )

  const sourceLabel = sourceDisplayName?.trim() || sourceSong || "?"
  const destLabel = destDisplayName?.trim() || destSong || "?"

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto w-full max-w-2xl text-xs">
        <DrawerHeader className="border-b border-border/60 pt-1 pb-3">
          <DrawerTitle className="sr-only">
            Segue Lookup – {sourceLabel} → {destLabel}
          </DrawerTitle>
          <div className="space-y-1 text-xs">
            <p className="text-sm font-medium text-foreground">
              Segue Lookup
            </p>
            <p className="text-muted-foreground">
              {sourceLabel} → {destLabel}
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
                    <TableHead className="text-center font-medium">
                      Length
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performances.map((p, idx) => (
                    <TableRow key={`${p.show_id}-${idx}`} className="border-border/60">
                      <TableCell className="text-center tabular-nums">
                        <Link
                          href={getSetlistArchiveUrl(p.show_id)}
                          className="hover:underline"
                          onClick={() => onOpenChange(false)}
                        >
                          {formatShowDate(p.show_date)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {p.venue_id ? (
                          <Link
                            href={`/archive/venue/${p.venue_id}`}
                            className="hover:underline"
                            onClick={() => onOpenChange(false)}
                          >
                            {p.show_venue_location ?? p.show_subvenue}
                          </Link>
                        ) : p.show_subvenue_venue ? (
                          <Link
                            href={`/archive/venue/${encodeURIComponent(p.show_subvenue_venue)}`}
                            className="hover:underline"
                            onClick={() => onOpenChange(false)}
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
