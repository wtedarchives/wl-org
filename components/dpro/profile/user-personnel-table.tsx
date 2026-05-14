"use client"

import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { UserGuest } from "@/types/user-guests"
import { getPersonnelArchiveUrl } from "@/lib/personnel-archive-url"

import "./user-personnel-table.css"

export interface UserPersonnelListTableProps {
  /** Shown as the first column header (displayed uppercase; meant to match panel context). */
  nameColumnHeader: string
  guests: UserGuest[]
  onPersonnelClick?: (guestName: string, guestId: string) => void
  /** Archive / WL table chrome (hover rows, borders). */
  wlHomeV2?: boolean
}

export function UserPersonnelListTable({
  nameColumnHeader,
  guests,
  onPersonnelClick,
  wlHomeV2 = false,
}: UserPersonnelListTableProps) {
  if (guests.length === 0) return null

  return (
    <div className="overflow-x-auto">
      <Table
        className={
          wlHomeV2 ?
            "wl-home-v2-years-table min-w-full text-[11px]"
          : "min-w-full text-[11px]"
        }
      >
        <TableHeader>
          <TableRow
            className={
              wlHomeV2 ?
                "border-b bg-black/25 hover:bg-black/25"
              : "bg-muted/60"
            }
          >
            <TableHead
              className={
                wlHomeV2 ?
                  "wl-profile-personnel-table__name-th max-w-[min(100%,14rem)] text-left align-middle !px-2 !py-0.5"
                : "max-w-[min(100%,14rem)] py-1.5 pl-3 text-left align-middle font-mono text-[10px] font-normal uppercase leading-tight tracking-wide text-muted-foreground"
              }
            >
              {nameColumnHeader}
            </TableHead>
            <TableHead
              className={
                wlHomeV2 ?
                  "w-[72px] py-1.5 text-center align-middle text-[11px] font-medium tabular-nums !px-2 !py-0.5"
                : "w-[80px] py-1.5 text-center text-xs font-medium text-muted-foreground"
              }
            >
              Songs
            </TableHead>
            <TableHead
              className={
                wlHomeV2 ?
                  "w-[72px] py-1.5 text-center align-middle text-[11px] font-medium tabular-nums !px-2 !py-0.5"
                : "w-[80px] py-1.5 text-center text-xs font-medium text-muted-foreground"
              }
            >
              Shows
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guests.map((guest) => (
            <TableRow
              key={guest.guest_id}
              className={
                wlHomeV2 ?
                  "border-b bg-transparent transition-colors hover:bg-[rgba(88,200,174,0.11)]"
                : "border-border bg-background/70 transition-colors hover:bg-muted/40"
              }
            >
              <TableCell
                className={
                  wlHomeV2 ? "py-1 pl-3 text-[11px] !px-2 !py-0.5" : "py-1 pl-3"
                }
              >
                {onPersonnelClick ? (
                  <button
                    type="button"
                    onClick={() =>
                      onPersonnelClick(guest.guest, guest.guest_id)
                    }
                    className={
                      wlHomeV2 ?
                        "rounded text-left font-medium text-foreground hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                      : "rounded text-left font-medium text-foreground hover:underline focus:outline-none focus:ring-2 focus:ring-muted-foreground/50"
                    }
                  >
                    {guest.guest}
                  </button>
                ) : (
                  <Link
                    href={getPersonnelArchiveUrl(guest.guest_id)}
                    className="font-medium text-foreground hover:underline"
                  >
                    {guest.guest}
                  </Link>
                )}
              </TableCell>
              <TableCell
                className={
                  wlHomeV2 ?
                    "text-center text-[11px] font-medium tabular-nums text-foreground !px-2 !py-0.5"
                  : "text-center font-medium text-foreground tabular-nums"
                }
              >
                {guest.song_count}
              </TableCell>
              <TableCell
                className={
                  wlHomeV2 ?
                    "text-center text-[11px] font-medium tabular-nums text-foreground !px-2 !py-0.5"
                  : "text-center font-medium text-foreground tabular-nums"
                }
              >
                {guest.show_count}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
