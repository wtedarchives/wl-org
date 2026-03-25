"use client"


import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import Link from "next/link"
import Image from "next/image"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useShowsData } from "@/hooks/use-shows-data"
import { useShowMetadata } from "@/hooks/use-show-metadata"
import { AudioLines, FileMusic, Music } from "lucide-react"
import { formatShowDate } from "./format-show-date"

function getPlacementColor(placement: string | null): string {
  if (placement === "Set 1 Opener") return "#047857"
  if (placement === "Set 1 Closer") return "#1e40af"
  if (
    placement === "Set 2 Opener" ||
    placement === "Set 3 Opener" ||
    placement === "Set 4 Opener" ||
    placement === "Set 5 Opener"
  )
    return "#10b981"
  if (
    placement === "Set 2 Closer" ||
    placement === "Set 3 Closer" ||
    placement === "Set 4 Closer" ||
    placement === "Set 5 Closer"
  )
    return "#3b82f6"
  if (placement === "Encore 1") return "#be123c"
  if (placement === "Encore 2" || placement === "Encore 3") return "#f43f5e"
  return "transparent"
}

export function MostRecentShowCard() {
  const {
    mostRecentShow,
    setlist,
    loadingMostRecent,
    loadingSetlist,
  } = useShowsData()

  const { showsWithSetlists, showsWithReleases } = useShowMetadata(
    mostRecentShow ? [mostRecentShow] : [],
    new Date().getFullYear().toString(),
  )

  if (loadingMostRecent) {
    return (
      <Card className="rounded-xl border border-wl-dark-grey/50 bg-[#313a34] py-0 text-xs shadow-sm ring-0">
        <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-wl-dark-grey/50 py-2 bg-black/30">
          <CardTitle className="text-[13px] font-semibold text-wl-white">
            Most Recent Show
          </CardTitle>
          <Music className="size-4 shrink-0 text-wl-white/80" />
        </CardHeader>
        <CardContent className="px-3 py-6 text-center text-[11px] text-wl-white/70">
          Loading show…
        </CardContent>
      </Card>
    )
  }

  if (!mostRecentShow) {
    return (
      <Card className="rounded-xl border border-wl-dark-grey/50 bg-[#313a34] py-0 text-xs shadow-sm ring-0">
        <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-wl-dark-grey/50 py-2 bg-black/30">
          <CardTitle className="text-[13px] font-semibold text-wl-white">
            Most Recent Show
          </CardTitle>
          <Music className="size-4 shrink-0 text-wl-white/80" />
        </CardHeader>
        <CardContent className="px-3 py-4 text-center text-[11px] text-wl-white/70">
          No recent shows found.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-xl border border-wl-dark-grey/50 bg-[#313a34] py-0 text-xs shadow-sm ring-0">
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-wl-dark-grey/50 py-2 bg-black/30">
        <CardTitle className="text-[13px] font-semibold text-wl-white">
          Most Recent Show
        </CardTitle>
        <Music className="size-4 shrink-0 text-wl-white/80" />
      </CardHeader>
      <CardContent className="space-y-2 px-3 py-2">
        <div className="text-[11px] leading-tight text-wl-white">
          <div className="flex items-center justify-between gap-2">
            <div>
              <Link
                href={getSetlistArchiveUrl(mostRecentShow.show_id)}
                className="font-medium hover:underline"
              >
                {formatShowDate(mostRecentShow.show_date)}
              </Link>
              {" — "}
              {mostRecentShow.venue_id ? (
                <Link
                  href={`/archive/venue/${mostRecentShow.venue_id}`}
                  className="hover:underline"
                >
                  {mostRecentShow.venue_location}
                </Link>
              ) : (
                <span>{mostRecentShow.venue_location}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {showsWithSetlists.has(mostRecentShow.show_id) ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={getSetlistArchiveUrl(mostRecentShow.show_id)}
                      aria-label="View setlist"
                    >
                      <FileMusic className="size-3.5 text-emerald-500" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    View printed setlist
                  </TooltipContent>
                </Tooltip>
              ) : null}
              {showsWithReleases.has(mostRecentShow.show_id) ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={getSetlistArchiveUrl(mostRecentShow.show_id)}
                      aria-label="View releases"
                    >
                      <AudioLines className="size-3.5 text-rose-500" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Show contains media
                  </TooltipContent>
                </Tooltip>
              ) : null}
              {mostRecentShow.show_wl_link ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={mostRecentShow.show_wl_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Wysteria Lane article"
                    >
                      <Image
                        src="/WL.png"
                        alt="Wysteria Lane"
                        width={14}
                        height={14}
                        className="h-3.5 w-auto"
                      />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Chat in the Community Forum
                  </TooltipContent>
                </Tooltip>
              ) : null}
              {mostRecentShow.show_group === "Goose" ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span aria-label="Goose show">
                      <Image
                        src="/Goose2.png"
                        alt="Goose"
                        width={28}
                        height={14}
                        className="h-3.5 w-auto object-contain"
                      />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">Goose show</TooltipContent>
                </Tooltip>
              ) : null}
            </div>
          </div>
          <div className="mt-0.5 text-[11px] text-wl-white/80">
            {mostRecentShow.show_group}
          </div>
        </div>

        {loadingSetlist ? (
          <div className="py-3 text-center text-[11px] text-wl-white/70">
            Loading setlist…
          </div>
        ) : setlist.length > 0 ? (
          <div className="space-y-[1px] rounded-md border border-wl-dark-grey/50 bg-[#272d29] px-2 py-2 mb-1">
            {setlist.map((entry, index) => {
              const prev = index > 0 ? setlist[index - 1] : null
              const isNewSet = prev && prev.entry_set !== entry.entry_set
              const placement = entry.entry_placement as string | null
              const placementColor = getPlacementColor(placement)

              return (
                <div key={`${entry.entry_song}-${index}`}>
                  {isNewSet && <hr className="my-1 border-wl-dark-grey/50" />}
                  <div className="flex items-center text-[11px] text-wl-white">
                    <div
                      className="w-1 rounded-sm text-center"
                      style={{ backgroundColor: placementColor }}
                    >
                      &nbsp;
                    </div>
                    <div className="flex flex-1 items-center justify-between gap-2 pl-2">
                      <span className="truncate font-medium">
                        <Link
                          href={`/archive/song/${entry.songs?.song_id}`}
                          className="hover:underline"
                        >
                          <SongDisplayName
                            song={entry.entry_song}
                            songDisplayName={entry.songs?.song_displayname}
                          />
                        </Link>
                        {entry.entry_short && (
                          <span className="ml-2 text-[10px] font-medium text-destructive">
                            [{entry.entry_short}]
                          </span>
                        )}
                        {entry.entry_segue && (
                          <span className="ml-2 text-destructive">→</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-2 text-center text-[11px] text-wl-white/70">
            Setlist not available.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
