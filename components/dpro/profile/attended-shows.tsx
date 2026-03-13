"use client"

import { useState } from "react"
import Link from "next/link"
import { TicketPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import {
  getRarityColor,
  getGapColor,
  formatShowLength,
  formatShowDate,
} from "@/lib/utils/attendance-utils"
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
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground">
            Please log in to see attended shows.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (isManageMode) {
    return (
      <AttendShowManager onClose={handleCloseManage} />
    )
  }

  if (loading) {
    const msg = isOwnProfile
      ? "Loading your attended shows…"
      : `Loading ${username ? `${username}'s` : "their"} attended shows…`
    return <LoadingPageCard message={msg} />
  }

  const emptyMsg = isOwnProfile
    ? "You haven't marked any shows as attended yet."
    : username
      ? `${username} hasn't marked any shows as attended yet.`
      : "This user hasn't marked any shows as attended yet."

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 py-3">
        <h3 className="text-sm font-semibold">Shows Attended</h3>
        {isOwnProfile && !readOnly && (
          <Button
            variant="secondary"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={handleOpenManage}
          >
            <span className="hidden sm:inline">Manage Shows</span>
            <TicketPlus className="size-3.5" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {attendedShows.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-muted-foreground">{emptyMsg}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b">
                  <TableHead className="w-8 text-center text-xs">#</TableHead>
                  <TableHead className="text-center text-xs">Date</TableHead>
                  <TableHead className="text-left text-xs">Group</TableHead>
                  <TableHead className="text-left text-xs">Tour</TableHead>
                  <TableHead className="text-center text-xs">Length</TableHead>
                  <TableHead className="text-center text-xs">Rarity</TableHead>
                  <TableHead className="text-center text-xs">Gap</TableHead>
                  <TableHead className="text-left text-xs">Venue</TableHead>
                  <TableHead className="text-left text-xs">Location</TableHead>
                  <TableHead className="text-left text-xs">Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendedShows.map((attendedShow, index) => (
                  <AttendedShowRow
                    key={attendedShow.id}
                    attendedShow={attendedShow}
                    index={index}
                    allShows={attendedShows}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AttendedShowRow({
  attendedShow,
  index,
  allShows,
}: {
  attendedShow: AttendedShow
  index: number
  allShows: AttendedShow[]
}) {
  const show = attendedShow.show
  const isGooseCanon =
    show?.show_group === "Goose" && show?.show_canonid
  const gooseNumber = isGooseCanon
    ? allShows
        .slice(0, index + 1)
        .filter(
          (s) =>
            s.show?.show_group === "Goose" && s.show?.show_canonid
        ).length
    : null

  const tourId = show?.tours && !Array.isArray(show.tours)
    ? (show.tours as { tour_id: string }).tour_id
    : Array.isArray(show?.tours)
      ? show.tours[0]?.tour_id
      : null

  return (
    <TableRow className="text-xs">
      <TableCell
        className="text-center font-medium tabular-nums"
        style={{
          backgroundColor: isGooseCanon ? "rgb(0,100,0)" : undefined,
        }}
      >
        {gooseNumber ?? ""}
      </TableCell>
      <TableCell className="text-center whitespace-nowrap">
        <Link
          href={`/dpro/setlist/${attendedShow.show_id}`}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {show?.show_date ? formatShowDate(show.show_date) : ""}
        </Link>
      </TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {show?.show_group}
      </TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {show?.show_tour ? (
          tourId ? (
            <Link
              href={`/dpro/tours/${tourId}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {show.show_tour}
            </Link>
          ) : (
            <span>{show.show_tour}</span>
          )
        ) : null}
      </TableCell>
      <TableCell className="text-center whitespace-nowrap text-muted-foreground">
        {formatShowLength(show?.show_length ?? null)}
      </TableCell>
      <TableCell className="text-center whitespace-nowrap">
        {show?.show_rarity ? (
          <span
            className="inline-block rounded px-1.5 py-px text-white"
            style={{ backgroundColor: getRarityColor(show.show_rarity) }}
          >
            {show.show_rarity}
          </span>
        ) : null}
      </TableCell>
      <TableCell className="text-center whitespace-nowrap">
        {show?.show_gap ? (
          <span
            className="inline-block rounded px-1.5 py-px text-white"
            style={{ backgroundColor: getGapColor(show.show_gap) }}
          >
            {show.show_gap}
          </span>
        ) : null}
      </TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {show?.show_subvenue_venue ? (
          <Link
            href={`/dpro/venue/${encodeURIComponent(show.show_subvenue_venue)}`}
            className="text-foreground underline-offset-4 hover:underline"
          >
            {show.show_subvenue}
          </Link>
        ) : (
          <span>{show?.show_subvenue}</span>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {show?.show_venue_location}
      </TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {show?.show_detail}
        {show?.show_detail && show?.show_alert && " "}
        {show?.show_alert && (
          <span className="font-medium text-[#CE1126]">
            [{show.show_alert}]
          </span>
        )}
      </TableCell>
    </TableRow>
  )
}
