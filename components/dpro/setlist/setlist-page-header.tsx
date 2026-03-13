"use client"

import Link from "next/link"
import Image from "next/image"
import { useIsDesktopContentLayout } from "@/hooks/use-mobile"
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Info,
  Link as LinkIcon,
  MapPin,
  Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Show, ShowDate } from "@/types/setlist"
import type { Tour } from "@/hooks/use-setlist-data"
import { formatSetlistDate } from "@/lib/setlist-utils"
import { SetlistTourDropdown } from "@/components/dpro/setlist/setlist-tour-dropdown"
import { SetlistShowsDropdown } from "@/components/dpro/setlist/setlist-shows-dropdown"

export interface SetlistPageHeaderProps {
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

export function SetlistPageHeader({
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
}: SetlistPageHeaderProps) {
  const isDesktop = useIsDesktopContentLayout()
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 pb-2">
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
              {...(isDesktop && { title: "Chat on WysteriaLane.org!" })}
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
                {...(isDesktop && { title: "Edit Show" })}
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
          <span className="rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium">
            Show {showPositionInTour.position} of {showPositionInTour.total}
          </span>
        )}
        {show.tour_id && (
          <Link
            href={`/archive/tours/${show.tour_id}`}
            className="inline-flex items-center gap-1 rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-foreground hover:bg-muted"
          >
            <Info className="size-3" />
            Tour Info
          </Link>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="rounded-full border border-border bg-wl-orange/30 px-2.5 py-1 text-xs font-medium tabular-nums text-foreground">
          {formatSetlistDate(show.show_date)}
        </span>
        {show.show_group && (
          <span className="rounded-full border border-border bg-wl-orange/50 px-2.5 py-1 text-xs font-medium text-foreground">
            {show.show_group}
          </span>
        )}
        {show.show_subvenue && (
          show.venue_id ? (
            <Link
              href={`/archive/venue/${show.venue_id}`}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-wl-green/30 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-wl-green/40"
            >
              <Building2 className="size-3 shrink-0" />
              {show.show_subvenue}
            </Link>
          ) : show.show_subvenue_venue ? (
            <Link
              href={`/archive/venue/${encodeURIComponent(show.show_subvenue_venue)}`}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-wl-green/30 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-wl-green/40"
            >
              <Building2 className="size-3 shrink-0" />
              {show.show_subvenue}
            </Link>
          ) : (
            <Link
              href={`/archive/venue/${encodeURIComponent(show.show_subvenue)}`}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-wl-green/30 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-wl-green/40"
            >
              <Building2 className="size-3 shrink-0" />
              {show.show_subvenue}
            </Link>
          )
        )}
        {show.show_venue_location && (
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-wl-green/30 px-2.5 py-1 text-xs font-medium text-foreground">
            <MapPin className="size-3 shrink-0" />
            {show.show_venue_location}
          </span>
        )}
        {show.show_detail && (
          <span className="rounded-full border border-border bg-wl-orange/80 px-2.5 py-1 text-xs font-medium text-foreground">
            {show.show_detail}
          </span>
        )}
        {show.show_alert && (
          <span className="rounded-full border border-red-500/60 bg-red-500/15 px-2.5 py-1 text-xs font-medium text-red-700 dark:text-red-400">
            {show.show_alert}
          </span>
        )}
      </div>
    </div>
  )
}
