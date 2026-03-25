"use client"


import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import Link from "next/link"
import Image from "next/image"
import { Check, FileMusic, Star, AudioLines, Users } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"
import { getRarityColor, getGapColor } from "@/lib/stats/tour-utils"
import { formatLengthAsHmmss } from "@/lib/setlist-utils"
import type { ListShow } from "@/hooks/use-list-show-data"

const COVER_SONGS_HEADER_IMAGE =
  "https://i.postimg.cc/1RMm2fpQ/Cover-Songs.jpg"

function formatShowDate(date: string) {
  const [year, month, day] = date.split("-")
  return `${month}.${day}.${year.slice(2)}`
}

function RatingStars({ rating }: { rating: number }) {
  if (!rating || rating <= 0) {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className="size-3 text-muted-foreground/30"
            strokeWidth={1.75}
          />
        ))}
      </div>
    )
  }
  return (
    <div className="relative flex items-center group">
      <div className="flex items-center gap-0.5 transition-opacity group-hover:opacity-10">
        {[1, 2, 3, 4, 5].map((starNumber) => {
          const fillPercentage = Math.min(
            Math.max(rating - starNumber + 1, 0),
            1,
          )
          return (
            <div key={starNumber} className="relative size-3">
              <Star
                className="size-3 text-yellow-400/40"
                strokeWidth={1.75}
              />
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fillPercentage * 100}%` }}
              >
                <Star className="size-3 text-yellow-400" fill="currentColor" />
              </div>
            </div>
          )
        })}
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] font-semibold opacity-0 transition-opacity group-hover:opacity-100">
        {rating.toFixed(2)}
      </div>
    </div>
  )
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
  const { user } = useAuth()

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
            {user && (
              <TableHead className="w-[28px] px-1 py-1 text-center text-xs font-medium">
                <Check className="mx-auto size-3 text-muted-foreground" />
              </TableHead>
            )}
            {showCategoryColumn && (
              <TableHead className="min-w-12 w-12 px-1 py-1 text-center text-xs font-medium">
                <Image
                  src={COVER_SONGS_HEADER_IMAGE}
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
          {shows.map((show, index) => {
            const rating = showRatings[show.show_id] ?? 0
            const displayRank = (show as { displayRank?: number }).displayRank
            return (
              <TableRow
                key={show.show_id}
                className={
                  index % 2 === 0 ? "bg-background/70" : "bg-background"
                }
              >
                {showRanking && (
                  <TableCell className="px-2 py-1 text-center text-xs font-medium tabular-nums">
                    {displayRank ?? ""}
                  </TableCell>
                )}
                <TableCell className="whitespace-nowrap px-2 py-1 text-center text-xs font-medium tabular-nums">
                  <Link
                    href={getSetlistArchiveUrl(show.show_id)}
                    className="hover:underline"
                  >
                    {formatShowDate(show.show_date)}
                  </Link>
                </TableCell>
                {user && (
                  <TableCell className="w-[28px] px-1 py-1 text-center align-middle">
                    {attendedShowIds.includes(show.show_id) ? (
                      <div className="inline-flex rounded-full bg-emerald-600 p-0.5">
                        <Check className="size-3 text-white" strokeWidth={3} />
                      </div>
                    ) : (
                      <span className="inline-block size-3" aria-hidden />
                    )}
                  </TableCell>
                )}
                {showCategoryColumn && categoryArtwork && show.show_listcategorycomplete && (
                  <TableCell className="min-w-12 w-12 px-1 py-1 text-center align-middle">
                    {categoryArtwork[show.show_listcategorycomplete] ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-block">
                              <img
                                src={categoryArtwork[show.show_listcategorycomplete]}
                                alt={show.show_listcategorycomplete}
                                className="mx-auto size-5 rounded object-cover border border-border"
                                onError={(e) => {
                                  ;(e.target as HTMLImageElement).style.display =
                                    "none"
                                }}
                              />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            sideOffset={4}
                            className="max-w-[200px]"
                          >
                            <span className="text-xs">
                              {show.show_listcategorycomplete}
                            </span>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : null}
                  </TableCell>
                )}
                <TableCell className="px-2 py-1 text-xs">
                  {show.tour_id ? (
                    <Link
                      href={`/archive/tours/${show.tour_id}`}
                      className="hover:underline"
                    >
                      {show.show_tour}
                    </Link>
                  ) : (
                    <span>{show.show_tour}</span>
                  )}
                </TableCell>
                <TableCell className="px-2 py-1 text-center text-xs tabular-nums">
                  {show.show_length && show.show_length !== "-"
                    ? formatLengthAsHmmss(show.show_length) ?? ""
                    : ""}
                </TableCell>
                <TableCell className="px-2 py-1 text-center">
                  {show.show_rarity ? (
                    <span
                      className="inline-block rounded px-1.5 py-[1px] text-xs font-medium text-white"
                      style={{
                        backgroundColor: getRarityColor(show.show_rarity),
                      }}
                    >
                      {show.show_rarity}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="px-2 py-1 text-center">
                  {show.show_gap ? (
                    <span
                      className="inline-block rounded px-1.5 py-[1px] text-xs font-medium text-white"
                      style={{
                        backgroundColor: getGapColor(show.show_gap),
                      }}
                    >
                      {show.show_gap}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="px-2 py-1 text-xs">
                  {show.venue_id ? (
                    <Link
                      href={`/archive/venue/${show.venue_id}`}
                      className="hover:underline"
                    >
                      {show.show_subvenue}
                    </Link>
                  ) : (show as { show_subvenue_venue?: string }).show_subvenue_venue ? (
                    <Link
                      href={`/archive/venue/${encodeURIComponent((show as { show_subvenue_venue: string }).show_subvenue_venue)}`}
                      className="hover:underline"
                    >
                      {show.show_subvenue}
                    </Link>
                  ) : (
                    <span>{show.show_subvenue}</span>
                  )}
                </TableCell>
                <TableCell className="px-2 py-1 text-xs text-muted-foreground">
                  {show.show_venue_location}
                </TableCell>
                <TableCell className="group px-2 py-1 text-center align-middle">
                  <div className="flex justify-center">
                    <RatingStars rating={rating} />
                  </div>
                </TableCell>
                <TableCell className="w-[28px] px-1 py-1 text-center align-middle">
                  {showsWithSetlists.has(show.show_id) ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={getSetlistArchiveUrl(show.show_id)}
                            className="inline-flex rounded p-0.5 text-emerald-600 hover:text-emerald-500"
                          >
                            <FileMusic className="size-3.5" />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>Setlist scan</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : null}
                </TableCell>
                <TableCell className="w-[28px] px-1 py-1 text-center align-middle">
                  {showsWithReleases.has(show.show_id) ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={getSetlistArchiveUrl(show.show_id)}
                            className="inline-flex rounded p-0.5 text-rose-600 hover:text-rose-500"
                          >
                            <AudioLines className="size-3.5" />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>Media available</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : null}
                </TableCell>
                <TableCell className="px-2 py-1 text-center text-xs align-middle">
                  {attendeeCounts[show.show_id] > 0
                    ? attendeeCounts[show.show_id]
                    : null}
                </TableCell>
                <TableCell className="w-[28px] px-1 py-1 text-center align-middle">
                  {show.show_wl_link ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={show.show_wl_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Wysteria Lane article"
                            className="inline-flex items-center justify-center rounded hover:opacity-90"
                          >
                            <Image
                              src="/WL.png"
                              alt="Wysteria Lane"
                              width={14}
                              height={14}
                              className="h-3.5 w-auto block"
                            />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <span className="text-[11px]">
                            Chat in the Community Forum
                          </span>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span className="inline-block size-3.5" aria-hidden />
                  )}
                </TableCell>
                <TableCell className="px-2 py-1 text-xs">
                  {show.show_detail}
                  {show.show_detail && show.show_alert && " "}
                  {show.show_alert && (
                    <span className="font-medium text-destructive">
                      [{show.show_alert}]
                    </span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
