"use client"

import Link from "next/link"

import { ArchivePrefetchLink } from "@/components/archive/archive-prefetch-link"
import { formatTourShowDate } from "@/components/dpro/tours/tour-show-format"
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import type { SiteSearchShowHit } from "@/lib/site-search"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"
import { cn } from "@/lib/utils"

export function siteSearchShowsSupportTourTable(
  hits: SiteSearchShowHit[],
): boolean {
  return hits.length === 0 || hits.every((h) => Boolean(h.show_date))
}

function VenueCell({ hit }: { hit: SiteSearchShowHit }) {
  const label = hit.show_subvenue ?? ""
  if (hit.venue_id) {
    return (
      <Link href={getVenueArchiveUrl(hit.venue_id)} className="hover:underline">
        {label}
      </Link>
    )
  }
  if (hit.show_subvenue_venue) {
    return (
      <Link
        href={getVenueArchiveUrl(hit.show_subvenue_venue)}
        className="hover:underline"
      >
        {label}
      </Link>
    )
  }
  return <span>{label}</span>
}

export function WlHomeV2SiteSearchShowsTable({
  hits,
}: {
  hits: SiteSearchShowHit[]
}) {
  if (hits.length === 0) return null

  return (
    <div className="widget-panel wl-home-v2-years-shows-panel wl-home-v2-years-shows-panel--natural wl-home-v2-site-search-shows-table flex min-h-0 min-w-0 flex-col overflow-hidden">
      <div className="wl-home-v2-years-table-scroll min-h-0">
        <Table className="wl-home-v2-years-table min-w-max text-[11px]">
          <TableBody>
            {hits.map((hit) => (
              <TableRow
                key={hit.id}
                className="border-b bg-transparent transition-colors hover:bg-[rgba(88,200,174,0.11)]"
              >
                <TableCell
                  className={cn(
                    "whitespace-nowrap text-center text-[11px] font-medium tabular-nums",
                    "!px-2 !py-0.5",
                  )}
                >
                  <ArchivePrefetchLink
                    href={getSetlistArchiveUrl(hit.id)}
                    className="hover:underline"
                  >
                    {formatTourShowDate(hit.show_date ?? "")}
                  </ArchivePrefetchLink>
                </TableCell>
                <TableCell className="!px-2 !py-0.5 text-[11px] text-muted-foreground">
                  {hit.show_group}
                </TableCell>
                <TableCell className="!px-2 !py-0.5 text-[11px]">
                  <VenueCell hit={hit} />
                </TableCell>
                <TableCell className="!px-2 !py-0.5 text-[11px] text-muted-foreground">
                  {hit.show_venue_location}
                </TableCell>
                <TableCell className="!px-2 !py-0.5 text-[11px] text-muted-foreground">
                  {hit.detail}
                  {hit.detail && hit.show_alert ? <>&nbsp;&nbsp;</> : null}
                  {hit.show_alert ?
                    <span className="font-medium text-red-500">
                      [{hit.show_alert}]
                    </span>
                  : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
