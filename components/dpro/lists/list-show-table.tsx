"use client"

import { LIST_SHOW_TABLE_COVER_HEADER_IMAGE } from "@/components/dpro/lists/list-show-table-constants"
import Image from "next/image"
import { Broadcast, Check, FileAudio, Users } from "@phosphor-icons/react"
import { Check as LucideCheck, FileMusic, AudioLines, Users as LucideUsers } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ListShow } from "@/hooks/use-list-show-data"
import { cn } from "@/lib/utils"
import { ListShowTableRow } from "@/components/dpro/lists/list-show-table-row"

import "./list-show-table.css"

function listShowHasRarity(s: ListShow) {
  return s.show_rarity != null && String(s.show_rarity).trim() !== ""
}

function listShowHasGap(s: ListShow) {
  return s.show_gap != null && String(s.show_gap).trim() !== ""
}

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
  /** WL Home v2 archive: tour-dates-style chrome (widget panel + years table). */
  wlHomeV2?: boolean
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
  wlHomeV2 = false,
}: ListShowTableProps) {
  const { session } = useAuth()

  const hasRarity = shows.some(listShowHasRarity)
  const hasGap = shows.some(listShowHasGap)
  const showRarityColumn = wlHomeV2 ? hasRarity : true
  const showGapColumn = wlHomeV2 ? hasGap : true

  const headCell = wlHomeV2 ? "!px-2 !py-0.5" : "px-2 py-1"
  const headCellTight = wlHomeV2 ? "!px-1 !py-0.5" : "px-1 py-1"
  const headText = wlHomeV2 ? "text-[11px]" : "text-xs"

  const headerRow = (
    <TableHeader>
      <TableRow
        className={cn(
          wlHomeV2 ? "border-b bg-black/25 hover:bg-black/25" : "bg-muted/60",
        )}
      >
        {showRanking && (
          <TableHead
            className={cn(
              "w-[32px] text-center font-medium",
              headText,
              headCell,
            )}
          >
            #
          </TableHead>
        )}
        <TableHead
          className={cn(
            "w-[68px] text-center font-medium",
            headText,
            headCell,
          )}
        >
          Date
        </TableHead>
        {session ?
          <TableHead
            className={cn(
              "w-[32px] text-center font-medium",
              headText,
              headCellTight,
            )}
          >
            <div className="flex w-full items-center justify-center">
              {wlHomeV2 ?
                <Check className="size-3 shrink-0 text-muted-foreground" aria-hidden />
              : <LucideCheck className="mx-auto size-3 text-muted-foreground" />}
            </div>
          </TableHead>
        : null}
        {showCategoryColumn ?
          <TableHead
            className={cn(
              "list-show-table__art-head min-w-12 w-12 font-medium",
              headText,
              headCellTight,
            )}
          >
            <div className="list-show-table__art-head-inner">
              <Image
                src={LIST_SHOW_TABLE_COVER_HEADER_IMAGE}
                alt="Cover Songs"
                width={wlHomeV2 ? 20 : 32}
                height={wlHomeV2 ? 20 : 32}
                className={cn(
                  "shrink-0 rounded object-cover border border-border",
                  wlHomeV2 ? "size-5" : "size-8",
                )}
                unoptimized
              />
            </div>
          </TableHead>
        : null}
        <TableHead
          className={cn("text-left font-medium", headText, headCell)}
        >
          Tour
        </TableHead>
        <TableHead
          className={cn("text-center font-medium", headText, headCell)}
        >
          Length
        </TableHead>
        {showRarityColumn ?
          <TableHead
            className={cn("text-center font-medium", headText, headCell)}
          >
            Rarity
          </TableHead>
        : null}
        {showGapColumn ?
          <TableHead
            className={cn("text-center font-medium", headText, headCell)}
          >
            Gap
          </TableHead>
        : null}
        <TableHead className={cn("text-left font-medium", headText, headCell)}>
          Venue
        </TableHead>
        <TableHead className={cn("text-left font-medium", headText, headCell)}>
          Location
        </TableHead>
        <TableHead
          className={cn("text-center font-medium", headText, headCell)}
        >
          Rating
        </TableHead>
        <TableHead
          className={cn(
            "w-[32px] text-center font-medium",
            headText,
            headCellTight,
          )}
        >
          <div className="flex w-full items-center justify-center">
            {wlHomeV2 ?
              <FileAudio className="size-3 shrink-0 text-muted-foreground" aria-hidden />
            : <FileMusic className="mx-auto size-3 text-muted-foreground" />}
          </div>
        </TableHead>
        <TableHead
          className={cn(
            "w-[32px] text-center font-medium",
            headText,
            headCellTight,
          )}
        >
          <div className="flex w-full items-center justify-center">
            {wlHomeV2 ?
              <Broadcast className="size-3 shrink-0 text-muted-foreground" aria-hidden />
            : <AudioLines className="mx-auto size-3 text-muted-foreground" />}
          </div>
        </TableHead>
        <TableHead
          className={cn(
            "w-[32px] text-center font-medium",
            headText,
            headCellTight,
          )}
        >
          <div className="flex w-full items-center justify-center">
            {wlHomeV2 ?
              <Users className="size-3 shrink-0 text-muted-foreground" aria-hidden />
            : <LucideUsers className="mx-auto size-3 text-muted-foreground" />}
          </div>
        </TableHead>
        <TableHead
          className={cn("w-[32px] text-center font-medium", headCellTight)}
        >
          <div className="flex w-full items-center justify-center">
            <Image
              src="/WL.png"
              alt="Wysteria Lane"
              width={12}
              height={12}
              className={cn(
                "mx-auto h-3 w-auto",
                wlHomeV2 && "shrink-0",
              )}
            />
          </div>
        </TableHead>
        <TableHead className={cn("text-left font-medium", headText, headCell)}>
          Detail
        </TableHead>
      </TableRow>
    </TableHeader>
  )

  const tableInner = (
    <div className={cn(wlHomeV2 && "wl-home-v2-years-table-scroll min-h-0")}>
      <Table
        className={cn(
          "min-w-max",
          wlHomeV2 ? "wl-home-v2-years-table text-[11px]" : "text-xs",
        )}
      >
        {headerRow}
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
              showRarityColumn={showRarityColumn}
              showGapColumn={showGapColumn}
              wlHomeV2={wlHomeV2}
              user={session}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )

  if (wlHomeV2) {
    return (
      <div className="widget-panel wl-home-v2-years-shows-panel wl-home-v2-years-shows-panel--natural flex min-h-0 min-w-0 flex-col overflow-hidden">
        {tableInner}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-max text-xs">
        {headerRow}
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
              showRarityColumn={showRarityColumn}
              showGapColumn={showGapColumn}
              wlHomeV2={false}
              user={session}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
