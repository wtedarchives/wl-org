"use client"

import { useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { SetlistGuestLegend } from "@/components/dpro/setlist/setlist-guest-legend"
import { WtedEpisodeSetlistTable } from "@/components/wted/wted-episode-setlist-table"
import { useWtedEpisodeDetailData } from "@/hooks/use-wted-episode-detail-data"
import { useWtedEpisodePageId } from "@/hooks/use-wted-episode-page-id"
import { useGuestGroups } from "@/hooks/use-setlist-display"
import { getWtedEpisodeDisplayName } from "@/lib/wted-episode-display-name"
import { getWtedEpisodeUrl } from "@/lib/wted-episode-url"

export function WtedEpisodePageClient() {
  const router = useRouter()
  const { episodeId, invalidParams } = useWtedEpisodePageId()
  const {
    episode,
    wtedShow,
    rows,
    siblings,
    loading,
    notFound,
    loadError,
  } = useWtedEpisodeDetailData(
    invalidParams ? undefined : episodeId,
  )

  const setlistForGuests = rows.map((r) => r.setlistEntry)
  const guestGroups = useGuestGroups(setlistForGuests)

  useEffect(() => {
    if (episode?.episode) {
      const label = getWtedEpisodeDisplayName(
        episode.episode,
        episode.display_name,
      )
      document.title = `${label} – Program Director – WysteriaLane.org`
    } else {
      document.title = "Program Director – WysteriaLane.org"
    }
    return () => {
      document.title = ""
    }
  }, [episode?.episode, episode?.display_name])

  if (invalidParams || !episodeId) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 rounded-b-none md:rounded-b-xl overflow-hidden">
        <p className="text-center text-sm text-muted-foreground">
          Missing or invalid episode. Open an episode from the{" "}
          <Link
            href="/wted/program-director"
            className="font-medium text-foreground underline"
          >
            Program Director
          </Link>{" "}
          page.
        </p>
      </div>
    )
  }

  if (loading) {
    return <LoadingPageCard message="Loading episode…" />
  }

  if (notFound || loadError || !episode) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 rounded-b-none md:rounded-b-xl overflow-hidden">
        <p className="text-center text-sm text-muted-foreground">
          {loadError
            ? "Could not load this episode. Please try again."
            : "Episode not found."}
        </p>
        <p className="text-center">
          <Link
            href="/wted/program-director"
            className="text-sm font-medium text-foreground underline"
          >
            Back to Program Director
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 rounded-b-none md:rounded-b-xl overflow-hidden">
      <Card className="overflow-hidden border border-border/60 bg-card/80 py-0 shadow-sm">
        <div className="bg-muted/60 px-3 py-2">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <Link
                href="/wted/program-director"
                className="shrink-0 font-medium text-foreground hover:underline"
              >
                Program Director
              </Link>
              <ChevronRight className="size-3.5 shrink-0 opacity-70" />
              <span className="font-medium text-foreground">
                {wtedShow?.show ?? episode.show}
              </span>
              <ChevronRight className="size-3.5 shrink-0 opacity-70" />
              {siblings.length > 1 ? (
                <Select
                  value={episode.uuid}
                  onValueChange={(id) =>
                    router.push(getWtedEpisodeUrl(id), { scroll: false })
                  }
                >
                  <SelectTrigger
                    size="sm"
                    className="h-8 min-w-[10rem] max-w-[min(100%,20rem)] border-border text-xs font-medium"
                  >
                    <SelectValue placeholder="Episode" />
                  </SelectTrigger>
                  <SelectContent>
                    {siblings.map((s) => (
                      <SelectItem key={s.uuid} value={s.uuid} className="text-xs">
                        {getWtedEpisodeDisplayName(s.episode, s.display_name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="min-w-0 font-semibold text-foreground">
                  {getWtedEpisodeDisplayName(
                    episode.episode,
                    episode.display_name,
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
        <CardContent className="space-y-4 border-t border-border/40 p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            {episode.artwork?.trim() ? (
              <div className="relative mx-auto size-24 shrink-0 overflow-hidden rounded-lg border border-border sm:mx-0 sm:size-20">
                <Image
                  src={episode.artwork}
                  alt={getWtedEpisodeDisplayName(
                    episode.episode,
                    episode.display_name,
                  )}
                  width={96}
                  height={96}
                  className="size-full object-cover"
                  unoptimized
                />
              </div>
            ) : null}
            <div className="min-w-0 flex-1 space-y-2">
              <h1 className="text-center text-base font-semibold text-foreground sm:text-left">
                {getWtedEpisodeDisplayName(
                  episode.episode,
                  episode.display_name,
                )}
              </h1>
              {episode.host_displayname ? (
                <p className="text-center text-xs text-muted-foreground sm:text-left">
                  Host:{" "}
                  {episode.host ? (
                    <a
                      href={episode.host}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-foreground hover:underline"
                    >
                      @{episode.host_displayname}
                    </a>
                  ) : (
                    <span className="font-medium text-foreground">
                      @{episode.host_displayname}
                    </span>
                  )}
                </p>
              ) : null}
            </div>
          </div>

          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No track listing is published for this episode yet.
            </p>
          ) : (
            <>
              <WtedEpisodeSetlistTable rows={rows} guestGroups={guestGroups} />
              <SetlistGuestLegend guestGroups={guestGroups} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
