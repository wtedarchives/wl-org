"use client"

import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Guitar,
  Info,
  Link as LinkIcon,
  MapPin,
  Pencil,
  TriangleAlert,
  CircleEllipsis,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatSetlistDate } from "@/lib/setlist-utils"
import { SetlistTourDropdown } from "./setlist-tour-dropdown"
import { SetlistShowsDropdown } from "./setlist-shows-dropdown"
import type { Show, ShowDate } from "@/types/setlist"
import type { Tour } from "@/hooks/use-setlist-data"

const pillBaseMobile =
  "rounded-full border border-border text-xs font-medium px-2.5 py-0.5"

interface SetlistPageHeaderMobileProps {
  show: Show
  showId: string
  showDates: ShowDate[]
  showPosition: {
    prevShowId: string | null
    nextShowId: string | null
  } | null
  showPositionInTour: { position: number; total: number } | null
  tours: Tour[]
  onTourSelect: (tourId: string) => void
  onShowSelect: (showId: string) => void
  showAdminUi?: boolean
  linkCopied?: boolean
  onCopyLink: () => void
  onEditShow: () => void
}

export function SetlistPageHeaderMobile({
  show,
  showId,
  showDates,
  showPosition,
  showPositionInTour,
  tours,
  onTourSelect,
  onShowSelect,
  showAdminUi,
  linkCopied,
  onCopyLink,
  onEditShow,
}: SetlistPageHeaderMobileProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Setlist
        </h2>
        <div className="flex items-center gap-1">
          {show.show_wl_link && (
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() =>
                show.show_wl_link && window.open(show.show_wl_link, "_blank")
              }
              aria-label="Wysteria Lane"
              className="hover:bg-muted/80 hover:border-muted-foreground/30"
            >
              <Image
                src="/WL.png"
                alt=""
                width={16}
                height={16}
                className="size-3"
              />
            </Button>
          )}
          {showAdminUi && (
            <>
              <Button
                variant={linkCopied ? "default" : "outline"}
                size="icon-sm"
                onClick={onCopyLink}
                title="Copy Show ID"
                className={
                  linkCopied
                    ? "bg-green-600 hover:bg-green-700"
                    : "hover:bg-muted/80 hover:border-muted-foreground/30"
                }
              >
                <LinkIcon className="size-3" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={onEditShow}
                title="Edit Show"
                className="hover:bg-muted/80 hover:border-muted-foreground/30"
              >
                <Pencil className="size-3" />
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex w-full min-w-0 items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            disabled={!showPosition?.prevShowId}
            onClick={() =>
              showPosition?.prevShowId && onShowSelect(showPosition.prevShowId)
            }
            aria-label="Previous show"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <SetlistShowsDropdown
            showDates={showDates}
            currentShowId={showId}
            currentLabel={formatSetlistDate(show.show_date)}
            onShowSelect={onShowSelect}
          />
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            disabled={!showPosition?.nextShowId}
            onClick={() =>
              showPosition?.nextShowId && onShowSelect(showPosition.nextShowId)
            }
            aria-label="Next show"
          >
            <ArrowRight className="size-4" />
          </Button>
        </div>
        <div className="flex w-full min-w-0 flex-nowrap items-center justify-center gap-1">
          <div className="flex min-h-6 min-w-0 w-max max-w-full shrink items-center">
            <SetlistTourDropdown
              tours={tours}
              currentTourId={show.tour_id}
              currentTourName={show.show_tour}
              onTourSelect={onTourSelect}
              triggerClassName="w-auto max-w-full min-w-0 overflow-hidden"
            />
          </div>
          {showPositionInTour && (
            <span className="inline-flex h-6 min-h-6 shrink-0 items-center rounded-md border border-border bg-muted/50 px-2 text-xs font-medium tabular-nums">
              Show {showPositionInTour.position} of {showPositionInTour.total}
            </span>
          )}
          {show.tour_id && (
            <Link
              href={`/archive/tours/${show.tour_id}`}
              className="inline-flex h-6 min-h-6 shrink-0 items-center gap-1 rounded-md border border-border bg-muted/50 px-2 text-xs font-medium text-foreground hover:bg-muted"
            >
              <Info className="size-3.5 shrink-0" />
              Tour Info
            </Link>
          )}
        </div>
        <div className="w-full pt-1" />
        {show.show_group && (
          <span
            className={`inline-flex items-center gap-1 ${pillBaseMobile} bg-wl-orange/50 text-foreground`}
          >
            <Guitar className="size-3 shrink-0" />
            {show.show_group}
          </span>
        )}
        {(show.show_subvenue || show.show_venue_location) && (
          <div className="flex w-full min-w-0 items-center justify-center gap-1">
            {show.show_subvenue &&
              (show.venue_id ? (
                <Link
                  href={`/archive/venue/${show.venue_id}`}
                  className={`inline-flex min-w-0 shrink items-center gap-1 truncate ${pillBaseMobile} bg-wl-green/30 text-foreground hover:bg-wl-green/40`}
                >
                  <Building2 className="size-3 shrink-0" />
                  <span className="truncate">{show.show_subvenue}</span>
                </Link>
              ) : show.show_subvenue_venue ? (
                <Link
                  href={`/archive/venue/${encodeURIComponent(show.show_subvenue_venue)}`}
                  className={`inline-flex min-w-0 shrink items-center gap-1 truncate ${pillBaseMobile} bg-wl-green/30 text-foreground hover:bg-wl-green/40`}
                >
                  <Building2 className="size-3 shrink-0" />
                  <span className="truncate">{show.show_subvenue}</span>
                </Link>
              ) : (
                <Link
                  href={`/archive/venue/${encodeURIComponent(show.show_subvenue)}`}
                  className={`inline-flex min-w-0 shrink items-center gap-1 truncate ${pillBaseMobile} bg-wl-green/30 text-foreground hover:bg-wl-green/40`}
                >
                  <Building2 className="size-3 shrink-0" />
                  <span className="truncate">{show.show_subvenue}</span>
                </Link>
              ))}
            {show.show_venue_location && (
              <span
                className={`inline-flex shrink-0 items-center gap-1 ${pillBaseMobile} bg-wl-green/30 text-foreground`}
              >
                <MapPin className="size-3 shrink-0" />
                {show.show_venue_location}
              </span>
            )}
          </div>
        )}
        {show.show_detail && (
          <span
            className={`inline-flex items-center gap-1 ${pillBaseMobile} bg-wl-orange/80 text-foreground`}
          >
            <CircleEllipsis className="size-3 shrink-0" />
            {show.show_detail}
          </span>
        )}
        {show.show_alert && (
          <span className="inline-flex items-center gap-1 rounded-full border border-red-500/60 bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
            <TriangleAlert className="size-3 shrink-0" />
            {show.show_alert}
          </span>
        )}
      </div>
    </div>
  )
}
