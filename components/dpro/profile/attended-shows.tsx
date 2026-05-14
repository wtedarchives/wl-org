"use client"

import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getTourArchiveUrl } from "@/lib/tour-archive-url"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"
import { useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { ListNumbers } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { WlWidgetPanelLoading } from "@/components/dpro/wl-widget-panel-loading"
import { formatTourShowDate } from "@/components/dpro/tours/tour-show-format"
import { TourShowsStatPill } from "@/components/dpro/tours/tour-shows-stat-pill"
import {
  formatLengthAsHmmss,
  getGapColor,
  getGapPillBackground,
  getRarityColor,
  getRarityPillBackground,
} from "@/lib/setlist-utils"
import { cn } from "@/lib/utils"
import { useAttendedShows } from "@/hooks/use-attended-shows"
import type { AttendedShow } from "@/lib/utils/fetch-attended-shows"
import { AttendShowManager } from "./attend-show-manager"

interface AttendedShowsProps {
  userId: string | null
  isOwnProfile: boolean
  username?: string | null
  readOnly?: boolean
  onManagingToggle?: (isManaging: boolean) => void
}

const headCell = "!px-2 !py-0.5"
const headCellTight = "!px-1 !py-0.5"

function attendedShowsHead(titleLine: ReactNode, trailing?: ReactNode) {
  return (
    <div
      className={cn(
        "wp-head wl-home-v2-years-shows-wp-head wl-home-v2-tours-shows-wp-head",
        "flex w-full min-w-0 shrink-0 flex-row flex-wrap items-center gap-x-3 gap-y-1",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-x-2">{titleLine}</div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  )
}

export function AttendedShows({
  userId,
  isOwnProfile,
  username,
  readOnly = false,
  onManagingToggle,
}: AttendedShowsProps) {
  const [isManageMode, setIsManageMode] = useState(false)
  const [refetchKey, setRefetchKey] = useState(0)
  const { attendedShows, loading } = useAttendedShows(userId, refetchKey)

  const panelClass = cn(
    "widget-panel wl-home-v2-years-shows-panel wl-home-v2-years-shows-panel--natural",
    "flex min-h-0 min-w-0 flex-col overflow-hidden",
    "wl-home-v2-profile-shows-attended",
  )

  const panelPadClass = isOwnProfile
    ? "wl-home-v2-profile-shows-attended--own"
    : "wl-home-v2-profile-shows-attended--public"

  const hasRarity = useMemo(
    () =>
      attendedShows.some(
        (s) =>
          s.show?.show_rarity != null &&
          String(s.show.show_rarity).trim() !== "",
      ),
    [attendedShows],
  )

  const hasGap = useMemo(
    () =>
      attendedShows.some(
        (s) =>
          s.show?.show_gap != null && String(s.show.show_gap).trim() !== "",
      ),
    [attendedShows],
  )

  const handleCloseManage = () => {
    setIsManageMode(false)
    setRefetchKey((k) => k + 1)
    onManagingToggle?.(false)
  }

  const handleOpenManage = () => {
    setIsManageMode(true)
    onManagingToggle?.(true)
  }

  if (!userId) {
    return (
      <div className={cn(panelClass, panelPadClass)}>
        {attendedShowsHead(
          <span className="wp-head-date min-w-0 truncate">Shows Attended</span>,
        )}
        <p className="wl-home-v2-profile-shows-message">
          Please log in to see attended shows.
        </p>
      </div>
    )
  }

  if (isManageMode) {
    return <AttendShowManager onClose={handleCloseManage} />
  }

  if (loading) {
    const msg = isOwnProfile
      ? "Loading your attended shows…"
      : `Loading ${username ? `${username}'s` : "their"} attended shows…`
    return <WlWidgetPanelLoading message={msg} />
  }

  const emptyMsg = isOwnProfile
    ? "You haven't marked any shows as attended yet."
    : username
      ? `${username} hasn't marked any shows as attended yet.`
      : "This user hasn't marked any shows as attended yet."

  const countLine = (
    <>
      <span className="wp-head-date min-w-0 truncate">Shows Attended</span>
      <span
        className="shrink-0 text-[10px] leading-none text-white/40"
        aria-hidden
      >
        ▪
      </span>
      <span className="shrink-0 tabular-nums">
        {attendedShows.length}{" "}
        {attendedShows.length === 1 ? "show" : "shows"}
      </span>
    </>
  )

  const manageTrailing =
    isOwnProfile && !readOnly ?
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="wl-home-v2-tours-header-pill wl-home-v2-profile-shows-manage-pill shrink-0 gap-1"
        title="Manage attended shows"
        onClick={handleOpenManage}
      >
        <ListNumbers className="size-3.5 shrink-0 opacity-80" aria-hidden />
        Manage shows
      </Button>
    : null

  return (
    <div className={cn(panelClass, panelPadClass)}>
      {attendedShowsHead(countLine, manageTrailing)}
      {attendedShows.length === 0 ?
        <div className="px-1 py-4 text-center text-xs text-white/65">
          {emptyMsg}
        </div>
      : <div className="wl-home-v2-years-table-scroll min-h-0">
          <Table
            className={cn("min-w-max text-[11px]", "wl-home-v2-years-table")}
          >
            <TableHeader>
              <TableRow className="border-b bg-black/25 hover:bg-black/25">
                <TableHead
                  className={cn(
                    "w-[36px] text-center text-[11px] font-medium",
                    headCellTight,
                  )}
                >
                  #
                </TableHead>
                <TableHead
                  className={cn(
                    "w-[68px] text-center text-[11px] font-medium",
                    headCell,
                  )}
                >
                  Date
                </TableHead>
                <TableHead
                  className={cn("text-left text-[11px] font-medium", headCell)}
                >
                  Group
                </TableHead>
                <TableHead
                  className={cn("text-left text-[11px] font-medium", headCell)}
                >
                  Tour
                </TableHead>
                <TableHead
                  className={cn(
                    "text-center text-[11px] font-medium",
                    headCell,
                  )}
                >
                  Length
                </TableHead>
                {hasRarity ?
                  <TableHead
                    className={cn(
                      "text-center text-[11px] font-medium",
                      headCell,
                    )}
                  >
                    Rarity
                  </TableHead>
                : null}
                {hasGap ?
                  <TableHead
                    className={cn(
                      "text-center text-[11px] font-medium",
                      headCell,
                    )}
                  >
                    Gap
                  </TableHead>
                : null}
                <TableHead
                  className={cn("text-left text-[11px] font-medium", headCell)}
                >
                  Venue
                </TableHead>
                <TableHead
                  className={cn("text-left text-[11px] font-medium", headCell)}
                >
                  Location
                </TableHead>
                <TableHead
                  className={cn("text-left text-[11px] font-medium", headCell)}
                >
                  Detail
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendedShows.map((attendedShow, index) => (
                <AttendedShowRow
                  key={attendedShow.id}
                  attendedShow={attendedShow}
                  index={index}
                  allShows={attendedShows}
                  hasRarity={hasRarity}
                  hasGap={hasGap}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      }
    </div>
  )
}

function AttendedShowRow({
  attendedShow,
  index,
  allShows,
  hasRarity,
  hasGap,
}: {
  attendedShow: AttendedShow
  index: number
  allShows: AttendedShow[]
  hasRarity: boolean
  hasGap: boolean
}) {
  const show = attendedShow.show
  const isGooseCanon =
    show?.show_group === "Goose" && show?.show_canonid
  const gooseNumber =
    isGooseCanon ?
      allShows
        .slice(0, index + 1)
        .filter(
          (s) => s.show?.show_group === "Goose" && s.show?.show_canonid,
        ).length
    : null

  const tourId =
    show?.tours && !Array.isArray(show.tours) ?
      (show.tours as { tour_id: string }).tour_id
    : Array.isArray(show?.tours) ?
      show.tours[0]?.tour_id
    : null

  const rarityNumeric =
    show?.show_rarity != null && String(show.show_rarity).trim() !== "" ?
      Number.parseFloat(
        String(show.show_rarity).replace(/%/g, "").trim(),
      )
    : NaN
  const rarityPctStr =
    Number.isFinite(rarityNumeric) ? `${rarityNumeric.toFixed(2)}%` : null

  const gapNumeric =
    show?.show_gap != null && String(show.show_gap).trim() !== "" ?
      Number.parseFloat(String(show.show_gap).trim())
    : NaN

  return (
    <TableRow
      className={cn(
        "border-b bg-transparent transition-colors hover:bg-[rgba(88,200,174,0.11)]",
      )}
    >
      <TableCell
        className={cn(
          "wl-home-v2-profile-shows-td-goose text-[11px]",
          headCellTight,
          isGooseCanon && "wl-home-v2-profile-shows-td-goose--canon",
        )}
      >
        {gooseNumber ?? ""}
      </TableCell>
      <TableCell
        className={cn(
          "whitespace-nowrap text-center text-[11px] font-medium tabular-nums",
          headCell,
        )}
      >
        <Link
          href={getSetlistArchiveUrl(attendedShow.show_id)}
          className="hover:underline"
        >
          {show?.show_date ? formatTourShowDate(show.show_date) : ""}
        </Link>
      </TableCell>
      <TableCell className={cn("text-[11px] text-muted-foreground", headCell)}>
        {show?.show_group}
      </TableCell>
      <TableCell className={cn("text-[11px] text-muted-foreground", headCell)}>
        {show?.show_tour ?
          tourId ?
            <Link href={getTourArchiveUrl(tourId)} className="hover:underline">
              {show.show_tour}
            </Link>
          : <span>{show.show_tour}</span>
        : null}
      </TableCell>
      <TableCell
        className={cn("text-center text-[11px] tabular-nums", headCell)}
      >
        {formatLengthAsHmmss(show?.show_length ?? null) ?? ""}
      </TableCell>
      {hasRarity ?
        <TableCell className={cn("text-center", headCell)}>
          {rarityPctStr != null ?
            <TourShowsStatPill
              fill={getRarityPillBackground(rarityPctStr)}
              border={getRarityColor(rarityPctStr)}
            >
              {rarityPctStr}
            </TourShowsStatPill>
          : null}
        </TableCell>
      : null}
      {hasGap ?
        <TableCell className={cn("text-center", headCell)}>
          {Number.isFinite(gapNumeric) ?
            <TourShowsStatPill
              fill={getGapPillBackground(gapNumeric)}
              border={getGapColor(gapNumeric)}
            >
              {gapNumeric.toFixed(2)}
            </TourShowsStatPill>
          : null}
        </TableCell>
      : null}
      <TableCell className={cn("text-[11px]", headCell)}>
        {show?.venue_id ?
          <Link href={getVenueArchiveUrl(show.venue_id)} className="hover:underline">
            {show.show_subvenue}
          </Link>
        : show?.show_subvenue_venue ?
          <Link
            href={getVenueArchiveUrl(show.show_subvenue_venue)}
            className="hover:underline"
          >
            {show.show_subvenue}
          </Link>
        : <span>{show?.show_subvenue}</span>}
      </TableCell>
      <TableCell
        className={cn("text-[11px] text-muted-foreground", headCell)}
      >
        {show?.show_venue_location}
      </TableCell>
      <TableCell
        className={cn("text-[11px] text-muted-foreground", headCell)}
      >
        {show?.show_detail}
        {show?.show_detail && show?.show_alert ? <>&nbsp;&nbsp;</> : null}
        {show?.show_alert ?
          <span className="font-medium text-red-500">
            [{show.show_alert}]
          </span>
        : null}
      </TableCell>
    </TableRow>
  )
}
