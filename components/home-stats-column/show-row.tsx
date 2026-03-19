"use client"

import Link from "next/link"
import Image from "next/image"
import {
  TableCell,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { type HomeShow } from "@/hooks/use-shows-data"
import { AudioLines, FileMusic } from "lucide-react"
import { formatShowDate } from "./format-show-date"

export function ShowRow({
  show,
  showsWithSetlists,
  showsWithReleases,
}: {
  show: HomeShow
  showsWithSetlists: Set<string>
  showsWithReleases: Set<string>
}) {
  return (
    <TableRow className="border-b-0 hover:bg-[#3d4842]">
      <TableCell className="w-[68px] px-2 py-[1px] align-middle text-[11px] font-medium tabular-nums text-wl-white/80">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={`/archive/setlist/${show.show_id}`}
              className="hover:underline"
            >
              {formatShowDate(show.show_date)}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="top">
            <div className="text-[11px] leading-snug">
              <div className="font-medium">{show.show_group}</div>
              {show.show_tour && (
                <div className="text-xs text-muted-foreground">
                  {show.show_tour}
                </div>
              )}
              {show.show_detail && (
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {show.show_detail}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell className="px-2 py-[1px] align-middle text-[11px] leading-tight text-wl-white">
        <Tooltip>
          <TooltipTrigger asChild>
            {show.venue_id ? (
              <Link
                href={`/archive/venue/${show.venue_id}`}
                className="hover:underline"
              >
                {show.show_venue_location}
              </Link>
            ) : (
              <span>{show.show_venue_location}</span>
            )}
          </TooltipTrigger>
          {show.show_subvenue && (
            <TooltipContent side="top">
              <span className="text-[11px]">{show.show_subvenue}</span>
            </TooltipContent>
          )}
        </Tooltip>
      </TableCell>
      <TableCell className="w-[18px] px-0 py-[1px] text-center align-middle">
        {showsWithSetlists.has(show.show_id) ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/archive/setlist/${show.show_id}`} aria-label="View setlist">
                <FileMusic className="mx-auto size-3.5 text-emerald-500" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top">
              View printed setlist
            </TooltipContent>
          </Tooltip>
        ) : (
          <span className="inline-block size-3.5" aria-hidden />
        )}
      </TableCell>
      <TableCell className="w-[18px] px-0 py-[1px] text-center align-middle">
        {showsWithReleases.has(show.show_id) ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={`/archive/setlist/${show.show_id}`}
                aria-label="View releases"
              >
                <AudioLines className="mx-auto size-3.5 text-rose-500" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top">
              Show contains media
            </TooltipContent>
          </Tooltip>
        ) : (
          <span className="inline-block size-3.5" aria-hidden />
        )}
      </TableCell>
      <TableCell className="w-[18px] px-0 py-[1px] text-center align-middle">
        {show.show_wl_link ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={show.show_wl_link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Wysteria Lane article"
              >
                <Image
                  src="/WL.png"
                  alt="Wysteria Lane"
                  width={14}
                  height={14}
                  className="mx-auto h-3.5 w-auto"
                />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top">
              Chat in the Community Forum
            </TooltipContent>
          </Tooltip>
        ) : (
          <span className="inline-block size-3.5" aria-hidden />
        )}
      </TableCell>
      <TableCell className="w-[32px] px-0 py-[1px] text-center align-middle">
        {show.show_group === "Goose" ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span aria-label="Goose show">
                <Image
                  src="/Goose2.png"
                  alt="Goose"
                  width={28}
                  height={14}
                  className="mx-auto h-3.5 w-auto object-contain"
                />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              Goose show
            </TooltipContent>
          </Tooltip>
        ) : (
          <span className="inline-block size-3.5" aria-hidden />
        )}
      </TableCell>
    </TableRow>
  )
}
