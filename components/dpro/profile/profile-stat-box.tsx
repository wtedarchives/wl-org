"use client"

import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getSongArchiveUrl } from "@/lib/song-archive-url"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Check, Copy } from "lucide-react"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { toast } from "sonner"

import { WlWidgetPanelLoading } from "@/components/dpro/wl-widget-panel-loading"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table"
import {
  getStatHeaderClassName,
  formatTimeInterval,
  copyStatsToClipboard,
} from "@/lib/utils/user-stats-utils"
import { cn } from "@/lib/utils"
import type { StatData } from "@/types/user-stats"

import "./profile-stat-box.css"

interface ProfileStatBoxProps {
  stat: StatData
  showCopyButton?: boolean
  onSongClick?: (
    songName: string,
    songDisplayName?: string | null,
    songId?: string,
  ) => void
  /** Tour top-slots style panel (overview column); uses {@link wlCategoryClass}. */
  variant?: "default" | "wlPanel"
  /** One of `wl-home-v2-top-slots-cat--*` (see `getProfileUserStatCategoryClass`). */
  wlCategoryClass?: string
  /** When false, no category swatch (e.g. songs / longest / not-seen on overview). */
  showCategorySwatch?: boolean
  /** `wlPanel` top padding: own profile 6px, public 12px (default `.widget-panel` is 12px). */
  isOwnProfile?: boolean
}

export function ProfileStatBox({
  stat,
  showCopyButton = true,
  onSongClick,
  variant = "default",
  wlCategoryClass,
  showCategorySwatch = true,
  isOwnProfile = false,
}: ProfileStatBoxProps) {
  const [isCopied, setIsCopied] = useState(false)
  const {
    type,
    title,
    data,
    loading,
    countKey = "play_count",
    showDate = false,
    showLength = false,
    songNameKey = "song",
    songIdKey = "song_id",
    songDisplayNameKey = "song_displayname",
  } = stat

  const handleCopy = () => {
    copyStatsToClipboard(
      data as unknown as Record<string, unknown>[],
      songNameKey,
      countKey,
      !!showLength,
      title,
      type,
    )
    setIsCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setIsCopied(false), 2000)
  }

  const headerClassName = getStatHeaderClassName(type)

  const renderWlRows = () =>
    data.map((item, index) => {
      const rec = item as unknown as Record<string, unknown>
      const songName = rec[songNameKey] as string
      const songId = rec[songIdKey] as string
      const songDisplayName = rec[songDisplayNameKey] as
        | string
        | null
        | undefined
      const countVal = rec[countKey]
      const displayValue = showLength
        ? formatTimeInterval((rec.length as string) ?? "")
        : String(countVal)
      const categoryArtwork = rec.category_artwork as string | undefined
      const showDateVal = rec.show_date as string | undefined
      const showId = rec.show_id as string | undefined

      return (
        <tr key={index} className="wl-home-v2-top-slots-stats-row">
          <td className="wl-home-v2-top-slots-stats-cell">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                {onSongClick ?
                  <button
                    type="button"
                    onClick={() =>
                      onSongClick(songName, songDisplayName, songId)
                    }
                    className="wl-home-v2-profile-stat-box__song-btn"
                  >
                    <SongDisplayName
                      song={songName}
                      songDisplayName={songDisplayName}
                    />
                  </button>
                : <Link
                    href={getSongArchiveUrl(songId)}
                    className="wl-home-v2-profile-stat-box__song-link"
                  >
                    <SongDisplayName
                      song={songName}
                      songDisplayName={songDisplayName}
                    />
                  </Link>
                }
              </div>
              <div className="flex shrink-0 items-center gap-4">
                {showDate && showDateVal && showId ?
                  <Link
                    href={getSetlistArchiveUrl(showId)}
                    className="wl-home-v2-profile-stat-box__meta-link"
                  >
                    [{showDateVal}]
                  </Link>
                : null}
                {categoryArtwork ?
                  <span className="wl-home-v2-profile-stat-box__album-art">
                    <Image
                      src={categoryArtwork}
                      alt=""
                      width={20}
                      height={20}
                      className="wl-home-v2-profile-stat-box__album-art-img"
                      unoptimized
                      onError={(e) => {
                        e.currentTarget.classList.add(
                          "wl-home-v2-profile-stat-box__album-art-img--hidden",
                        )
                      }}
                    />
                  </span>
                : null}
              </div>
            </div>
          </td>
          <td
            className={cn(
              "wl-home-v2-top-slots-stats-cell wl-home-v2-profile-stat-box__count-cell",
              showLength && "wl-home-v2-profile-stat-box__count-cell--wide",
            )}
          >
            {displayValue}
          </td>
        </tr>
      )
    })

  if (variant === "wlPanel") {
    const cat = wlCategoryClass ?? "wl-home-v2-top-slots-cat--fallback"
    const useSwatch = showCategorySwatch
    return (
      <div
        className={cn(
          "widget-panel flex w-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
          "wl-home-v2-profile-stat-box--wl",
          isOwnProfile ?
            "wl-home-v2-profile-stat-box--wl-pad-own"
          : "wl-home-v2-profile-stat-box--wl-pad-public",
          useSwatch ? cat : "wl-home-v2-profile-stat-box--wl-neutral",
        )}
      >
        <div className="wp-head wl-home-v2-years-shows-wp-head">
          <span className="min-w-0 truncate">{title}</span>
          <div className="wp-head-right flex items-center gap-2">
            {!loading && data.length > 0 && showCopyButton ?
              <Button
                variant="ghost"
                size="icon"
                className="wl-home-v2-profile-stat-box__copy h-7 w-7 shrink-0 rounded-md text-white/80 opacity-90 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40"
                onClick={handleCopy}
                title={isCopied ? "Copied!" : "Copy to clipboard"}
              >
                {isCopied ?
                  <Check className="size-3.5 text-green-400" />
                : <Copy className="size-3.5" />}
              </Button>
            : null}
            {useSwatch ?
              <span className="wl-home-v2-top-slots-swatch" aria-hidden />
            : null}
          </div>
        </div>
        <div className="wl-home-v2-profile-stat-box__wl-body flex min-h-0 min-w-0 flex-1 flex-col">
          {loading ?
            <WlWidgetPanelLoading embedded message="Loading stats data…" />
          : data.length === 0 ?
            <div className="wl-home-v2-profile-stat-box__empty">
              No data available
            </div>
          : <table
              className="wl-home-v2-profile-stat-table wl-home-v2-years-table wl-home-v2-top-slots-stats-table"
            >
              <tbody>
                {renderWlRows()}
              </tbody>
            </table>
          }
        </div>
      </div>
    )
  }

  return (
    <Card className="overflow-hidden py-0">
      <div
        className={cn(
          "flex flex-row items-center justify-between gap-2 px-4 !py-2",
          headerClassName,
        )}
      >
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {!loading && data.length > 0 && showCopyButton ?
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "profile-stat-box__copy h-7 w-7 shrink-0 -mr-1 rounded-md opacity-90 transition-colors hover:!bg-white focus-visible:ring-2 focus-visible:ring-white/50",
              `profile-stat-box__copy--type-${type}`,
            )}
            onClick={handleCopy}
            title={isCopied ? "Copied!" : "Copy to clipboard"}
          >
            {isCopied ?
              <Check className="size-3.5 text-green-400" />
            : <Copy className="size-3.5" />}
          </Button>
        : null}
      </div>
      <CardContent className="p-0">
        {loading ?
          <WlWidgetPanelLoading embedded message="Loading stats data…" />
        : data.length === 0 ?
          <div className="px-3 py-4 text-center text-xs text-muted-foreground">
            No data available
          </div>
        : <Table>
            <TableBody>
              {data.map((item, index) => {
                const rec = item as unknown as Record<string, unknown>
                const songName = rec[songNameKey] as string
                const songId = rec[songIdKey] as string
                const songDisplayName = rec[songDisplayNameKey] as
                  | string
                  | null
                  | undefined
                const countVal = rec[countKey]
                const displayValue = showLength
                  ? formatTimeInterval((rec.length as string) ?? "")
                  : String(countVal)
                const categoryArtwork = rec.category_artwork as string | undefined
                const showDateVal = rec.show_date as string | undefined
                const showId = rec.show_id as string | undefined

                return (
                  <TableRow key={index}>
                    <TableCell className="align-middle py-0.5 pl-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          {onSongClick ?
                            <button
                              type="button"
                              onClick={() =>
                                onSongClick(
                                  songName,
                                  songDisplayName,
                                  songId,
                                )
                              }
                              className="rounded text-left text-xs font-medium text-foreground hover:underline focus:outline-none focus:ring-2 focus:ring-muted-foreground/50"
                            >
                              <SongDisplayName
                                song={songName}
                                songDisplayName={songDisplayName}
                              />
                            </button>
                          : <Link
                              href={getSongArchiveUrl(songId)}
                              className="text-xs font-medium text-foreground hover:underline"
                            >
                              <SongDisplayName
                                song={songName}
                                songDisplayName={songDisplayName}
                              />
                            </Link>
                          }
                        </div>
                        <div className="flex shrink-0 items-center gap-4">
                          {showDate && showDateVal && showId ?
                            <Link
                              href={getSetlistArchiveUrl(showId)}
                              className="text-[10px] text-muted-foreground hover:underline"
                            >
                              [{showDateVal}]
                            </Link>
                          : null}
                          {categoryArtwork ?
                            <Image
                              src={categoryArtwork}
                              alt=""
                              width={16}
                              height={16}
                              className="size-5 shrink-0 rounded border border-border object-cover"
                              unoptimized
                              onError={(e) => {
                                e.currentTarget.classList.add(
                                  "wl-home-v2-profile-stat-box__album-art-img--hidden",
                                )
                              }}
                            />
                          : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "align-middle py-1.5 text-center text-xs font-medium tabular-nums",
                        showLength ? "w-[50px] pl-2" : "w-[30px]",
                      )}
                    >
                      {displayValue}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        }
      </CardContent>
    </Card>
  )
}
