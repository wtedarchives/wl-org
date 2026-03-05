"use client"

import Link from "next/link"
import Image from "next/image"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table"

type SongItem = {
  song_id: string
  song?: string
  song_name?: string
  play_count?: number
  times_played?: number
  category_artwork?: string
}

interface StatCardProps {
  title: string
  headerClassName?: string
  items: SongItem[]
  getDisplayName: (item: SongItem) => string
  getCount: (item: SongItem) => number | string
  showEmptyState?: boolean
}

export function StatCard({
  title,
  headerClassName,
  items,
  getDisplayName,
  getCount,
  showEmptyState = false,
}: StatCardProps) {
  return (
    <Card className="overflow-hidden py-0">
      <CardHeader
        className={headerClassName ?? "bg-muted/60 py-2"}
        style={headerClassName ? undefined : undefined}
      >
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 && showEmptyState ? (
          <div className="px-3 py-4 text-center text-xs text-muted-foreground">
            No data to display for this year.
          </div>
        ) : (
          <Table>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.song_id}>
                  <TableCell className="py-1.5 pl-3">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/dpro/song/${item.song_id}`}
                        className="text-xs font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        {getDisplayName(item)}
                      </Link>
                      {item.category_artwork && (
                        <Image
                          src={item.category_artwork}
                          alt=""
                          width={16}
                          height={16}
                          className="size-4 shrink-0 rounded object-cover border border-border"
                          unoptimized
                          onError={(e) => {
                            const el = e.target as HTMLImageElement
                            if (el) el.style.display = "none"
                          }}
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="w-[30px] py-1.5 text-center text-xs font-medium tabular-nums">
                    {getCount(item)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
