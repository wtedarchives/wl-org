"use client"

import Image from "next/image"
import Link from "next/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import type {
  WtedEpisodeMeta,
  WtedEpisodeSibling,
} from "@/hooks/use-wted-episode-detail-data"
import { getWtedEpisodeDisplayName } from "@/lib/wted-episode-display-name"
import { wtedEpisodeDescriptionHtml } from "@/lib/wted-episode-description-html"

const COMMUNITY_ORIGIN = "https://community.wysterialane.org"

/** `https://community.wysterialane.org/u/{id}` where `id` is the handle without a leading `@`. */
function discourseUserProfileUrlFromHandle(handle: string): string | null {
  const t = handle.trim()
  if (!t.startsWith("@")) return null
  const id = t.slice(1).trim()
  if (!id) return null
  return `${COMMUNITY_ORIGIN}/u/${encodeURIComponent(id)}`
}

const hostHandlePillClassName =
  "inline-flex max-w-full min-w-0 items-center truncate rounded-full border border-border/80 bg-muted/80 px-2.5 py-0.5 text-xs font-medium text-foreground transition-colors hover:text-primary hover:underline"

export type WtedEpisodePageHeroProps = {
  episode: WtedEpisodeMeta
  showName: string
  siblings: WtedEpisodeSibling[]
  onNavigateEpisode: (uuid: string) => void
}

export function WtedEpisodePageHero({
  episode,
  showName,
  siblings,
  onNavigateEpisode,
}: WtedEpisodePageHeroProps) {
  const displayName = getWtedEpisodeDisplayName(
    episode.episode,
    episode.display_name,
  )
  const description = episode.description?.trim() ?? ""
  const hosts = episode.hosts
  const hostsWithHandles = hosts.filter((h) => h.handle?.trim())

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
      {episode.artwork?.trim() ?
        <div className="mx-auto w-full max-w-full shrink-0 sm:mx-0 sm:w-max">
          <Image
            src={episode.artwork}
            alt={displayName}
            width={280}
            height={280}
            className="block h-auto w-full max-h-none max-w-none rounded-lg border border-border bg-muted/30 shadow-sm transition-all duration-200 ease-out sm:h-auto sm:w-auto sm:max-h-[min(70vh,520px)] sm:max-w-[min(100vw-2rem,280px)]"
            unoptimized
          />
        </div>
      : null}

      <div className="min-w-0 flex-1 space-y-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground leading-6 md:text-2xl">
            {displayName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{showName}</p>
        </div>

        {siblings.length > 1 ?
          <div className="min-w-0 w-fit max-w-full">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Episode
            </h2>
            <div className="mt-2 min-w-0 w-fit max-w-full">
              <Select
                value={episode.uuid}
                onValueChange={(id) => onNavigateEpisode(id)}
              >
                <SelectTrigger
                  size="sm"
                  className="h-auto min-h-8 min-w-0 max-w-full border-border px-2 py-1 text-xs font-medium"
                >
                  <SelectValue placeholder="Episode" />
                </SelectTrigger>
                <SelectContent>
                  {siblings.map((s) => (
                    <SelectItem
                      key={s.uuid}
                      value={s.uuid}
                      className="text-xs"
                    >
                      {getWtedEpisodeDisplayName(s.episode, s.display_name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        : null}

        {(hostsWithHandles.length > 0) || description ?
          <Separator />
        : null}

        {hostsWithHandles.length > 0 ?
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {hostsWithHandles.length > 1 ? "Hosts" : "Host"}
            </h2>
            <ul className="m-0 mt-2 flex list-none flex-wrap gap-2 p-0 font-medium text-foreground">
              {hostsWithHandles.map((h, i) => {
                const profileHref =
                  discourseUserProfileUrlFromHandle(h.handle)
                const handle = h.handle.trim()
                return (
                  <li key={`${handle}-${i}`} className="m-0 p-0">
                    {profileHref ?
                      <Link
                        href={profileHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={hostHandlePillClassName}
                      >
                        {handle}
                      </Link>
                    : <span className="inline-flex max-w-full min-w-0 items-center truncate rounded-full border border-border/80 bg-muted/80 px-2.5 py-0.5 text-xs font-medium text-foreground">
                        {handle}
                      </span>
                    }
                  </li>
                )
              })}
            </ul>
          </div>
        : null}

        {description ?
          <>
            {hostsWithHandles.length > 0 ?
              <Separator />
            : null}
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Description
              </h2>
              <div
                className="mt-2 min-w-0 text-sm leading-relaxed text-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:no-underline [&_a]:hover:underline"
                dangerouslySetInnerHTML={{
                  __html: wtedEpisodeDescriptionHtml(description),
                }}
              />
            </div>
          </>
        : null}
      </div>
    </div>
  )
}
