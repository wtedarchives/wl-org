"use client"

import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  CircleEllipsis,
  Guitar,
  Info,
  Link as LinkIcon,
  MapPin,
  Pencil,
  TriangleAlert,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatSetlistDate } from "@/lib/setlist-utils"
import { SetlistTourDropdown } from "./setlist-tour-dropdown"
import { SetlistShowsDropdown } from "./setlist-shows-dropdown"
import type { Show, ShowDate } from "@/types/setlist"
import { getTourArchiveUrl } from "@/lib/tour-archive-url"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"
import type { Tour } from "@/hooks/use-setlist-data"

interface SetlistPageHeaderDesktopProps {
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

export function SetlistPageHeaderDesktop({
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
}: SetlistPageHeaderDesktopProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 pb-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Setlist
        </h2>
        <div className="flex items-center gap-1">
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
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <SetlistTourDropdown
          tours={tours}
          currentTourId={show.tour_id}
          currentTourName={show.show_tour}
          onTourSelect={onTourSelect}
        />
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
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
            className="size-8"
            disabled={!showPosition?.nextShowId}
            onClick={() =>
              showPosition?.nextShowId && onShowSelect(showPosition.nextShowId)
            }
            aria-label="Next show"
          >
            <ArrowRight className="size-4" />
          </Button>
        </div>
        {showPositionInTour && (
          <span className="inline-flex h-6 items-center rounded-md border border-border bg-muted/50 px-2 text-xs font-medium tabular-nums">
            Show {showPositionInTour.position} of {showPositionInTour.total}
          </span>
        )}
        {show.tour_id && (
          <Link
            href={getTourArchiveUrl(show.tour_id)}
            className="inline-flex h-6 items-center gap-1 rounded-md border border-border bg-muted/50 px-2 text-xs font-medium text-foreground hover:bg-muted"
          >
            <Info className="size-3.5 shrink-0" />
            Tour Info
          </Link>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-wl-orange/30 px-2.5 py-1 text-xs font-medium tabular-nums text-foreground">
          <Calendar className="size-3 shrink-0" />
          {formatSetlistDate(show.show_date)}
        </span>
        {show.show_group && (
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-wl-orange/50 px-2.5 py-1 text-xs font-medium text-foreground">
            <Guitar className="size-3 shrink-0" />
            {show.show_group}
          </span>
        )}
        {show.show_subvenue &&
          (show.venue_id ? (
            <Link
              href={getVenueArchiveUrl(show.venue_id)}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-wl-green/30 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-wl-green/40"
            >
              <Building2 className="size-3 shrink-0" />
              {show.show_subvenue}
            </Link>
          ) : show.show_subvenue_venue ? (
            <Link
              href={getVenueArchiveUrl(show.show_subvenue_venue)}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-wl-green/30 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-wl-green/40"
            >
              <Building2 className="size-3 shrink-0" />
              {show.show_subvenue}
            </Link>
          ) : (
            <Link
              href={getVenueArchiveUrl(show.show_subvenue)}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-wl-green/30 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-wl-green/40"
            >
              <Building2 className="size-3 shrink-0" />
              {show.show_subvenue}
            </Link>
          ))}
        {show.show_venue_location && (
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-wl-green/30 px-2.5 py-1 text-xs font-medium text-foreground">
            <MapPin className="size-3 shrink-0" />
            {show.show_venue_location}
          </span>
        )}
        {show.show_detail && (
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-wl-orange/80 px-2.5 py-1 text-xs font-medium text-foreground">
            <CircleEllipsis className="size-3 shrink-0" />
            {show.show_detail}
          </span>
        )}
        {show.show_alert && (
          <span className="inline-flex items-center gap-1 rounded-full border border-red-500/60 bg-red-500/15 px-2.5 py-1 text-xs font-medium text-red-700 dark:text-red-400">
            <TriangleAlert className="size-3 shrink-0" />
            {show.show_alert}
          </span>
        )}
      </div>
    </div>
  )
}
