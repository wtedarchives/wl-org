"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { UserGuest } from "@/types/user-guests"

const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  "Goose (current)": "Current Goose Members",
  "Goose (former)": "Former Goose Members",
  Guest: "Guests",
  Group: "Groups",
}

export interface UserPersonnelTableProps {
  category: string
  guests: UserGuest[]
  count: number
  onPersonnelClick?: (guestName: string, guestId: string) => void
}

export function UserPersonnelTable({
  category,
  guests,
  onPersonnelClick,
}: UserPersonnelTableProps) {
  const displayName = CATEGORY_DISPLAY_NAMES[category] ?? category

  return (
    <Card className="overflow-hidden py-0">
      <CardHeader className="bg-muted/60 py-2">
        <CardTitle className="text-sm font-medium">{displayName}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-full text-[11px]">
            <TableHeader>
              <TableRow className="bg-background/70 hover:bg-background/70">
                <TableHead className="pl-3 py-1.5 text-left text-xs font-medium text-muted-foreground">
                  Personnel
                </TableHead>
                <TableHead className="w-[80px] py-1.5 text-center text-xs font-medium text-muted-foreground">
                  # of Songs
                </TableHead>
                <TableHead className="w-[80px] py-1.5 text-center text-xs font-medium text-muted-foreground">
                  # of Shows
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guests.map((guest) => (
                <TableRow
                  key={guest.guest_id}
                  className="border-border bg-background/70 hover:bg-muted/40 transition-colors"
                >
                  <TableCell className="pl-3 py-1 text-foreground">
                    {onPersonnelClick ? (
                      <button
                        type="button"
                        onClick={() =>
                          onPersonnelClick(guest.guest, guest.guest_id)
                        }
                        className="text-left font-medium text-foreground hover:underline focus:outline-none focus:ring-2 focus:ring-muted-foreground/50 rounded"
                      >
                        {guest.guest}
                      </button>
                    ) : (
                      <Link
                        href={`/archive/personnel/${guest.guest_id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {guest.guest}
                      </Link>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-medium text-foreground tabular-nums">
                    {guest.song_count}
                  </TableCell>
                  <TableCell className="text-center font-medium text-foreground text-[11px] tabular-nums">
                    {guest.show_count}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
