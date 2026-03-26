"use client"

import { useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { usePopularPlacementsData } from "@/hooks/use-popular-placements-data"
import { useListContentLoading } from "./list-content-loading-context"
import { getSongArchiveUrl } from "@/lib/song-archive-url"

const COVER_SONGS_HEADER_IMAGE =
  "https://i.postimg.cc/1RMm2fpQ/Cover-Songs.jpg"

interface PopularPlacementsListProps {
  listId: string
}

const SECTIONS = [
  {
    title: "Top Show Openers",
    headerClass: "bg-[#047857] text-white",
    getItems: (d: ReturnType<typeof usePopularPlacementsData>) =>
      d.showOpeners,
  },
  {
    title: "Top Set Openers",
    headerClass: "bg-[#10b981] text-white",
    getItems: (d: ReturnType<typeof usePopularPlacementsData>) =>
      d.setOpeners,
  },
  {
    title: "Top Set Closers",
    headerClass: "bg-[#3b82f6] text-white",
    getItems: (d: ReturnType<typeof usePopularPlacementsData>) =>
      d.setClosers,
  },
  {
    title: "Top Encores",
    headerClass: "bg-[#be123c] text-white",
    getItems: (d: ReturnType<typeof usePopularPlacementsData>) =>
      d.encores,
  },
] as const

export function PopularPlacementsList({ listId }: PopularPlacementsListProps) {
  const data = usePopularPlacementsData()
  const ctx = useListContentLoading()

  useEffect(() => {
    ctx?.setLoading(data.loading)
  }, [data.loading, ctx])
  useEffect(() => {
    ctx?.setProgress(data.progress ?? 0)
  }, [data.progress, ctx])

  if (data.loading) return null

  if (data.error) {
    return (
      <div className="py-2 px-3 text-center text-sm text-muted-foreground">
        {data.error}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {SECTIONS.map((section) => {
        const items = section.getItems(data)
        return (
          <Card
            key={section.title}
            className="border-border/60 bg-card/80 overflow-hidden py-0"
          >
            <CardHeader
              className={`px-3 py-2 text-sm font-medium ${section.headerClass}`}
            >
              {section.title}
            </CardHeader>
            <CardContent className="p-0">
              {items.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  No data
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-8 px-2 py-0.5 text-center text-xs font-medium">
                        #
                      </TableHead>
                      <TableHead className="px-2 py-0.5 text-left text-xs font-medium">
                        Song
                      </TableHead>
                      <TableHead className="min-w-16 w-16 px-2 py-0.5 text-center text-xs font-medium">
                        <Image
                          src={COVER_SONGS_HEADER_IMAGE}
                          alt="Cover Songs"
                          width={32}
                          height={32}
                          className="mx-auto size-8 rounded object-cover border border-border"
                          unoptimized
                        />
                      </TableHead>
                      <TableHead className="w-16 px-2 py-0.5 text-center text-xs font-medium">
                        Count
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((row, i) => {
                      const displayRank =
                        i === 0 ||
                        items[i].times_played !== items[i - 1].times_played
                          ? i + 1
                          : null
                      return (
                        <TableRow
                          key={row.song_id}
                          className={
                            i % 2 === 0 ? "bg-background/70" : "bg-background"
                          }
                        >
                          <TableCell className="px-2 py-0.5 text-center text-xs tabular-nums">
                            {displayRank ?? ""}
                          </TableCell>
                        <TableCell className="px-2 py-0.5">
                          <Link
                            href={getSongArchiveUrl(row.song_id)}
                            className="font-medium hover:underline"
                          >
                            <SongDisplayName
                              song={row.song_name}
                              songDisplayName={row.song_displayname}
                            />
                          </Link>
                        </TableCell>
                        <TableCell className="min-w-16 w-16 px-2 py-0.5 text-center align-middle">
                          {row.category_artwork ? (
                            <img
                              src={row.category_artwork}
                              alt=""
                              width={20}
                              height={20}
                              className="mx-auto size-5 shrink-0 aspect-square rounded object-cover border border-border"
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).style.display =
                                  "none"
                              }}
                            />
                          ) : null}
                        </TableCell>
                        <TableCell className="px-2 py-0.5 text-center text-xs tabular-nums">
                          {row.times_played}
                        </TableCell>
                      </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
