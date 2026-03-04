"use client"

import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table"
import { isSupabaseConfigured } from "@/lib/supabase"
import { useShowsData, type HomeShow } from "@/hooks/use-shows-data"
import { useShowMetadata } from "@/hooks/use-show-metadata"
import { AudioLines, FileMusic, MoveRight } from "lucide-react"
import Image from "next/image"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function formatShowDate(dateStr: string) {
  return dateStr
    .split("-")
    .slice(1)
    .concat(dateStr.substring(2, 4))
    .join(".")
}

function ShowRow({
  show,
  showsWithSetlists,
  showsWithReleases,
}: {
  show: HomeShow
  showsWithSetlists: Set<string>
  showsWithReleases: Set<string>
}) {
  return (
    <TableRow>
      <TableCell className="w-[68px] px-2 py-1 align-middle text-[11px] font-medium tabular-nums text-muted-foreground">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={`/dpro/setlist/${show.show_id}`}
              className="hover:underline"
            >
              {formatShowDate(show.show_date)}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="top">
            <div className="text-[11px] leading-snug">
              <div className="font-medium">{show.show_group}</div>
              {show.show_tour && (
                <div className="text-xs text-muted-foreground">
                  {show.show_tour}
                </div>
              )}
              {show.show_detail && (
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {show.show_detail}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell className="px-2 py-1 align-middle text-[11px] leading-tight text-foreground">
        <Tooltip>
          <TooltipTrigger asChild>
            {show.venue_id ? (
              <Link
                href={`/dpro/venue/${show.venue_id}`}
                className="hover:underline"
              >
                {show.show_venue_location}
              </Link>
            ) : (
              <span>{show.show_venue_location}</span>
            )}
          </TooltipTrigger>
          {show.show_subvenue && (
            <TooltipContent side="top">
              <span className="text-[11px]">{show.show_subvenue}</span>
            </TooltipContent>
          )}
        </Tooltip>
      </TableCell>
      <TableCell className="w-[18px] px-0 py-1 text-center align-middle">
        {showsWithSetlists.has(show.show_id) ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/dpro/setlist/${show.show_id}`} aria-label="View setlist">
                <FileMusic className="mx-auto size-3.5 text-emerald-500" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top">
              View printed setlist
            </TooltipContent>
          </Tooltip>
        ) : (
          <span className="inline-block size-3.5" aria-hidden />
        )}
      </TableCell>
      <TableCell className="w-[18px] px-0 py-1 text-center align-middle">
        {showsWithReleases.has(show.show_id) ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={`/dpro/setlist/${show.show_id}`}
                aria-label="View releases"
              >
                <AudioLines className="mx-auto size-3.5 text-rose-500" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top">
              Show contains media
            </TooltipContent>
          </Tooltip>
        ) : (
          <span className="inline-block size-3.5" aria-hidden />
        )}
      </TableCell>
      <TableCell className="w-[18px] px-0 py-1 text-center align-middle">
        {show.show_wl_link ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={show.show_wl_link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Wysteria Lane article"
              >
                <Image
                  src="/WL.png"
                  alt="Wysteria Lane"
                  width={14}
                  height={14}
                  className="mx-auto h-3.5 w-auto"
                />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top">
              Chat in the Community Forum
            </TooltipContent>
          </Tooltip>
        ) : (
          <span className="inline-block size-3.5" aria-hidden />
        )}
      </TableCell>
      <TableCell className="w-[32px] px-0 py-1 text-center align-middle">
        {show.show_group === "Goose" ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span aria-label="Goose show">
                <Image
                  src="/Goose2.png"
                  alt="Goose"
                  width={28}
                  height={14}
                  className="mx-auto h-3.5"
                />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              Goose show
            </TooltipContent>
          </Tooltip>
        ) : (
          <span className="inline-block size-3.5" aria-hidden />
        )}
      </TableCell>
    </TableRow>
  )
}

function ShowsTableCard({
  title,
  shows,
  loading,
  emptyMessage,
}: {
  title: string
  shows: HomeShow[]
  loading: boolean
  emptyMessage?: string
}) {
  const { showsWithSetlists, showsWithReleases } = useShowMetadata(
    shows,
    new Date().getFullYear().toString(),
  )

  return (
    <Card className="bg-card/95 text-xs shadow-sm">
      <CardHeader className="border-b border-border/40 py-2">
        <CardTitle className="text-[13px] font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center px-3 py-6 text-[11px] text-muted-foreground">
            Loading shows…
          </div>
        ) : shows.length === 0 ? (
          <div className="px-3 py-3 text-center text-[11px] text-muted-foreground">
            {emptyMessage ?? "No shows found."}
          </div>
        ) : (
          <Table className="text-[11px]">
            <TableBody>
              {shows.map((show) => (
                <ShowRow
                  key={show.show_id}
                  show={show}
                  showsWithSetlists={showsWithSetlists}
                  showsWithReleases={showsWithReleases}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function MostRecentShowCard() {
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
      <Card className="bg-card/95 text-xs shadow-sm">
        <CardHeader className="border-b border-border/40 py-2">
          <CardTitle className="text-[13px] font-semibold">
            Most Recent Show
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 py-6 text-center text-[11px] text-muted-foreground">
          Loading show…
        </CardContent>
      </Card>
    )
  }

  if (!mostRecentShow) {
    return (
      <Card className="bg-card/95 text-xs shadow-sm">
        <CardHeader className="border-b border-border/40 py-2">
          <CardTitle className="text-[13px] font-semibold">
            Most Recent Show
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 py-4 text-center text-[11px] text-muted-foreground">
          No recent shows found.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card/95 text-xs shadow-sm">
      <CardHeader className="border-b border-border/40 py-2">
        <CardTitle className="text-[13px] font-semibold">
          Most Recent Show
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-3 py-2">
        <div className="text-[11px] leading-tight text-foreground">
          <div className="flex items-center justify-between gap-2">
            <div>
              <Link
                href={`/dpro/setlist/${mostRecentShow.show_id}`}
                className="font-medium hover:underline"
              >
                {formatShowDate(mostRecentShow.show_date)}
              </Link>
              {" — "}
              {mostRecentShow.venue_id ? (
                <Link
                  href={`/dpro/venue/${mostRecentShow.venue_id}`}
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
                      href={`/dpro/setlist/${mostRecentShow.show_id}`}
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
                      href={`/dpro/setlist/${mostRecentShow.show_id}`}
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
                        className="h-3.5"
                      />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">Goose show</TooltipContent>
                </Tooltip>
              ) : null}
            </div>
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {mostRecentShow.show_group}
          </div>
        </div>

        {loadingSetlist ? (
          <div className="py-3 text-center text-[11px] text-muted-foreground">
            Loading setlist…
          </div>
        ) : setlist.length > 0 ? (
          <div className="space-y-1 rounded-md border border-border/50 bg-muted/40 px-2 py-2 mb-1">
            {setlist.map((entry, index) => {
              const prev = index > 0 ? setlist[index - 1] : null
              const isNewSet = prev && prev.entry_set !== entry.entry_set
              const placement = entry.entry_placement as string | null
              let placementColor = "transparent"
              if (placement === "Set 1 Opener") placementColor = "#047857"
              else if (placement === "Set 1 Closer") placementColor = "#1e40af"
              else if (
                placement === "Set 2 Opener" ||
                placement === "Set 3 Opener" ||
                placement === "Set 4 Opener" ||
                placement === "Set 5 Opener"
              )
                placementColor = "#10b981"
              else if (
                placement === "Set 2 Closer" ||
                placement === "Set 3 Closer" ||
                placement === "Set 4 Closer" ||
                placement === "Set 5 Closer"
              )
                placementColor = "#3b82f6"
              else if (placement === "Encore 1") placementColor = "#be123c"
              else if (placement === "Encore 2" || placement === "Encore 3")
                placementColor = "#f43f5e"

              return (
                <div key={`${entry.entry_song}-${index}`}>
                  {isNewSet && <hr className="my-1 border-border/60" />}
                  <div className="flex items-center text-[11px] text-foreground">
                    <div
                      className="w-1 rounded-sm text-center"
                      style={{ backgroundColor: placementColor }}
                    >
                      &nbsp;
                    </div>
                    <div className="flex flex-1 items-center justify-between gap-2 pl-2">
                      <span className="truncate font-medium">
                        <Link
                          href={`/dpro/songs/${entry.songs.song_id}`}
                          className="hover:underline"
                        >
                          {entry.entry_song}
                        </Link>
                        {entry.entry_short && (
                          <span className="ml-2 text-[10px] font-medium text-destructive">
                            [{entry.entry_short}]
                          </span>
                        )}
                        {entry.entry_segue && (
                          <MoveRight className="ml-2 inline h-3 w-3 align-middle text-destructive" />
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-2 text-center text-[11px] text-muted-foreground">
            Setlist not available.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function HomeStatsColumn() {
  const {
    recentShows,
    upcomingShows,
    historicalShows,
    loading,
    loadingUpcoming,
    loadingHistorical,
  } = useShowsData()

  if (!isSupabaseConfigured()) {
    return (
      <Card className="bg-card/95 text-xs shadow-sm">
        <CardContent className="px-3 py-4 text-[11px] text-muted-foreground">
          Trouble communicating with the database server. Please reload the
          page.
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-3">
        <ShowsTableCard
          title="Last 5 Shows"
          shows={recentShows}
          loading={loading}
        />
        <MostRecentShowCard />
        <ShowsTableCard
          title="Next 5 Shows"
          shows={upcomingShows}
          loading={loadingUpcoming}
        />
        <ShowsTableCard
          title="This Day in Goose History"
          shows={historicalShows}
          loading={loadingHistorical}
          emptyMessage="No shows occurred on this date in Goose history."
        />
      </div>
    </TooltipProvider>
  )
}

