"use client"

import { ListNumbers } from "@phosphor-icons/react"
import { useMemo, useState, type ReactNode } from "react"

import { AttendShowManager } from "@/components/dpro/profile/attend-show-manager"
import { AttendedShowRow } from "@/components/dpro/profile/attended-show-row"
import { WlWidgetPanelLoading } from "@/components/dpro/wl-widget-panel-loading"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAttendedShows } from "@/hooks/use-attended-shows"
import { cn } from "@/lib/utils"

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
