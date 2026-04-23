"use client"


import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"
import Link from "next/link"
import Image from "next/image"
import {
  Broadcast,
  Check,
  FileAudio,
  Star,
} from "@phosphor-icons/react"
import { useAuth } from "@/components/auth-context"
import {
  TableCell,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"
import type { YearShow } from "@/hooks/use-shows-data-by-year"
import type { TourCount } from "@/hooks/use-tours-data"
import { cn } from "@/lib/utils"

export function getTourColor(tours: TourCount[], tourName: string): string {
  const tour = tours.find((t) => t.tour === tourName)
  return tour ? tour.color : "transparent"
}

export function formatShowDate(showDate: string) {
  const [year, month, day] = showDate.split("-")
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
            weight="regular"
            aria-hidden
          />
        ))}
      </div>
    )
  }
  return (
    <div className="relative flex items-center">
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
                weight="regular"
                aria-hidden
              />
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fillPercentage * 100}%` }}
              >
                <Star
                  className="size-3 text-yellow-400"
                  weight="fill"
                  aria-hidden
                />
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

export interface YearShowRowProps {
  show: YearShow
  index: number
  tours: TourCount[]
  attendeeCounts: Record<string, number>
  showRatings: Record<string, number>
  showsWithSetlists: Set<string>
  showsWithReleases: Set<string>
  showsWithRadioIds: Set<string>
  wlHomeV2?: boolean
}

export function YearShowRow({
  show,
  index,
  tours,
  attendeeCounts,
  showRatings,
  showsWithSetlists,
  showsWithReleases,
  showsWithRadioIds,
  wlHomeV2 = false,
}: YearShowRowProps) {
  const { user } = useAuth()
  const rating = showRatings[show.show_id] ?? 0
  const attendeeCount = attendeeCounts[show.show_id] ?? 0

  return (
    <TableRow
      className={cn(
        wlHomeV2 ?
          "border-b border-white/[0.06] bg-transparent transition-colors hover:bg-[rgba(88,200,174,0.11)]"
        : index % 2 === 0 ?
          "bg-background/70"
        : "bg-background",
      )}
    >
      <TableCell className="relative w-[4px] p-0 align-middle">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="absolute inset-y-0 left-0 w-[4px]"
                style={{
                  backgroundColor: getTourColor(tours, show.show_tour),
                }}
              />
            </TooltipTrigger>
            {show.show_tour && (
              <TooltipContent side="right">
                <span className="text-[11px]">{show.show_tour}</span>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell className="whitespace-nowrap !px-2 !py-0.5 text-center text-[11px] font-medium tabular-nums">
        <Link
          href={getSetlistArchiveUrl(show.show_id)}
          className="hover:underline"
        >
          {formatShowDate(show.show_date)}
        </Link>
      </TableCell>
      {user ? (
        <TableCell className="w-[32px] !px-1 !py-0.5 text-center align-middle leading-none">
          <div className="inline-flex items-center justify-center">
            {show.attended ? (
              <div className="inline-flex size-4 items-center justify-center rounded-full bg-emerald-600">
                <Check
                  className="size-3 text-white"
                  weight="bold"
                  aria-hidden
                />
              </div>
            ) : (
              <span className="inline-block size-4" aria-hidden />
            )}
          </div>
        </TableCell>
      ) : null}
      <TableCell className="!px-2 !py-0.5 text-[11px] font-normal text-muted-foreground">
        {show.show_group}
      </TableCell>
      <TableCell className="!px-2 !py-0.5 text-[11px]">
        {show.venue_id ? (
          <Link
            href={getVenueArchiveUrl(show.venue_id)}
            className="hover:underline"
          >
            {show.show_subvenue}
          </Link>
        ) : show.show_subvenue_venue ? (
          <Link
            href={getVenueArchiveUrl(show.show_subvenue_venue)}
            className="hover:underline"
          >
            {show.show_subvenue}
          </Link>
        ) : (
          <span>{show.show_subvenue}</span>
        )}
      </TableCell>
      <TableCell className="!px-2 !py-0.5 text-[11px] text-muted-foreground">
        {show.show_venue_location}
      </TableCell>
      <TableCell className="group !px-2 !py-0.5 text-center align-middle leading-none">
        <div className="inline-flex items-center justify-center">
          <RatingStars rating={rating} />
        </div>
      </TableCell>
      <TableCell className="w-[32px] !px-1 !py-0.5 text-center align-middle leading-none">
        <div className="inline-flex items-center justify-center">
          {showsWithSetlists.has(show.show_id) ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={getSetlistArchiveUrl(show.show_id)}
                    aria-label="View setlist"
                    className="inline-flex items-center justify-center rounded p-0.5 text-emerald-600 hover:text-emerald-500"
                  >
                    <FileAudio className="size-3.5" aria-hidden />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <span className="text-[11px]">Setlist scan</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <span className="inline-block size-3.5" aria-hidden />
          )}
        </div>
      </TableCell>
      <TableCell className="w-[32px] !px-1 !py-0.5 text-center align-middle leading-none">
        <div className="inline-flex items-center justify-center">
          {showsWithReleases.has(show.show_id) ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={getSetlistArchiveUrl(show.show_id)}
                    aria-label="View releases"
                    className="inline-flex items-center justify-center rounded p-0.5 text-rose-600 hover:text-rose-500"
                  >
                    <Broadcast className="size-3.5" aria-hidden />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <span className="text-[11px]">Media available</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <span className="inline-block size-3.5" aria-hidden />
          )}
        </div>
      </TableCell>
      <TableCell className="w-[32px] !px-1 !py-0.5 text-center align-middle text-[11px] font-medium leading-none">
        <div className="inline-flex items-center justify-center">
          {attendeeCount > 0 ? attendeeCount : ""}
        </div>
      </TableCell>
      <TableCell className="w-[32px] !px-1 !py-0.5 text-center align-middle leading-none">
        <div className="inline-flex items-center justify-center">
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
                    Chat in the Wysteria Lane Community
                  </span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <span className="inline-block size-3.5" aria-hidden />
          )}
        </div>
      </TableCell>
      <TableCell className="w-[32px] !px-1 !py-0.5 text-center align-middle leading-none">
        <div className="inline-flex items-center justify-center">
          {showsWithRadioIds.has(show.show_id) ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={getSetlistArchiveUrl(show.show_id)}
                    aria-label="WTED Goose Radio"
                    className="inline-flex items-center justify-center rounded hover:opacity-90"
                  >
                    <Image
                      src="/WTED2.png"
                      alt="WTED Goose Radio"
                      width={14}
                      height={14}
                      className="h-3.5 w-auto block"
                    />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <span className="text-[11px]">WTED Goose Radio</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <span className="inline-block size-3.5" aria-hidden />
          )}
        </div>
      </TableCell>
      <TableCell className="!px-2 !py-0.5 text-[11px] text-muted-foreground">
        {show.show_detail}
        {show.show_detail && show.show_alert ? <>&nbsp;&nbsp;</> : null}
        {show.show_alert ? (
          <span className="font-medium text-red-500">
            [{show.show_alert}]
          </span>
        ) : null}
      </TableCell>
    </TableRow>
  )
}
