"use client"

import { LIST_SHOW_TABLE_COVER_HEADER_IMAGE } from "@/components/dpro/lists/list-show-table-constants"
import Image from "next/image"
import { Check, FileMusic, AudioLines, Users } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ListShow } from "@/hooks/use-list-show-data"
import { ListShowTableRow } from "@/components/dpro/lists/list-show-table-row"

interface ListShowTableProps {
  shows: ListShow[]
  attendedShowIds: string[]
  showsWithSetlists: Set<string>
  showsWithReleases: Set<string>
  attendeeCounts: Record<string, number>
  showRatings: Record<string, number>
  categoryArtwork?: Record<string, string>
  showCategoryColumn?: boolean
  showRanking?: boolean
}

export function ListShowTable({
  shows,
  attendedShowIds,
  showsWithSetlists,
  showsWithReleases,
  attendeeCounts,
  showRatings,
  categoryArtwork,
  showCategoryColumn,
  showRanking,
}: ListShowTableProps) {
  const { session } = useAuth()

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-max text-xs">
        <TableHeader>
          <TableRow className="bg-muted/60">
            {showRanking && (
              <TableHead className="w-[32px] px-2 py-1 text-center text-xs font-medium">
                #
              </TableHead>
            )}
            <TableHead className="w-[68px] px-2 py-1 text-center text-xs font-medium">
              Date
            </TableHead>
            {session && (
              <TableHead className="w-[28px] px-1 py-1 text-center text-xs font-medium">
                <Check className="mx-auto size-3 text-muted-foreground" />
              </TableHead>
            )}
            {showCategoryColumn && (
              <TableHead className="min-w-12 w-12 px-1 py-1 text-center text-xs font-medium">
                <Image
                  src={LIST_SHOW_TABLE_COVER_HEADER_IMAGE}
                  alt="Cover Songs"
                  width={32}
                  height={32}
                  className="mx-auto size-8 rounded object-cover border border-border"
                  unoptimized
                />
              </TableHead>
            )}
            <TableHead className="px-2 py-1 text-left text-xs font-medium">
              Tour
            </TableHead>
            <TableHead className="px-2 py-1 text-center text-xs font-medium">
              Length
            </TableHead>
            <TableHead className="px-2 py-1 text-center text-xs font-medium">
              Rarity
            </TableHead>
            <TableHead className="px-2 py-1 text-center text-xs font-medium">
              Gap
            </TableHead>
            <TableHead className="px-2 py-1 text-left text-xs font-medium">
              Venue
            </TableHead>
            <TableHead className="px-2 py-1 text-left text-xs font-medium">
              Location
            </TableHead>
            <TableHead className="px-2 py-1 text-center text-xs font-medium">
              Rating
            </TableHead>
            <TableHead className="w-[28px] px-1 py-1 text-center text-xs font-medium">
              <FileMusic className="mx-auto size-3 text-muted-foreground" />
            </TableHead>
            <TableHead className="w-[28px] px-1 py-1 text-center text-xs font-medium">
              <AudioLines className="mx-auto size-3 text-muted-foreground" />
            </TableHead>
            <TableHead className="w-[28px] px-1 py-1 text-center text-xs font-medium">
              <Users className="mx-auto size-3 text-muted-foreground" />
            </TableHead>
            <TableHead className="w-[28px] px-1 py-1 text-center text-xs font-medium">
              <Image
                src="/WL.png"
                alt="Wysteria Lane"
                width={12}
                height={12}
                className="mx-auto h-3 w-auto"
              />
            </TableHead>
            <TableHead className="px-2 py-1 text-left text-xs font-medium">
              Detail
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shows.map((show, index) => (
            <ListShowTableRow
              key={show.show_id}
              show={show}
              index={index}
              rating={showRatings[show.show_id] ?? 0}
              attendedShowIds={attendedShowIds}
              showsWithSetlists={showsWithSetlists}
              showsWithReleases={showsWithReleases}
              attendeeCounts={attendeeCounts}
              categoryArtwork={categoryArtwork}
              showCategoryColumn={showCategoryColumn}
              showRanking={showRanking}
              user={session}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
