"use client"

import Link from "next/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getLastCountPillStyle } from "@/components/dpro/setlist/display-setlist-table.constants"
import {
  WL_HOME_V2_SETLIST_SELECT_CONTENT,
  WL_HOME_V2_SETLIST_SELECT_TRIGGER,
} from "@/components/wl-home-v2/wl-home-v2-setlist-placeholder-view.constants"
import type {
  WtedEpisodeMeta,
  WtedEpisodeSibling,
} from "@/hooks/use-wted-episode-detail-data"
import { getWtedEpisodeDisplayName } from "@/lib/wted-episode-display-name"
import { wtedEpisodeDescriptionHtml } from "@/lib/wted-episode-description-html"
import { cn } from "@/lib/utils"
import type { CSSProperties } from "react"

const COMMUNITY_ORIGIN = "https://community.wysterialane.org"

/** Same honey/amber shell as setlist Last column LIB (`.last-pill` + `getLastCountPillStyle`). */
const HOST_HANDLE_LIB_PILL = getLastCountPillStyle("LIB")!

function discourseUserProfileUrlFromHandle(handle: string): string | null {
  const t = handle.trim()
  if (!t.startsWith("@")) return null
  const id = t.slice(1).trim()
  if (!id) return null
  return `${COMMUNITY_ORIGIN}/u/${encodeURIComponent(id)}`
}

function hostHandlePillStyle(): CSSProperties {
  return {
    backgroundColor: HOST_HANDLE_LIB_PILL.background,
    color: HOST_HANDLE_LIB_PILL.color,
    border: `1px solid ${HOST_HANDLE_LIB_PILL.borderColor}`,
  }
}

export function WtedEpisodePageHeroV2({
  episode,
  showName,
  siblings,
  onNavigateEpisode,
}: {
  episode: WtedEpisodeMeta
  showName: string
  siblings: WtedEpisodeSibling[]
  onNavigateEpisode: (uuid: string) => void
}) {
  const displayName = getWtedEpisodeDisplayName(
    episode.episode,
    episode.display_name,
  )
  const description = episode.description?.trim() ?? ""
  const hosts = episode.hosts
  const descriptionHtml =
    description ? wtedEpisodeDescriptionHtml(description) : ""

  return (
    <section
      className="discography-release-archive__hero flex min-w-0 flex-col gap-3 md:gap-4"
      aria-labelledby="wted-episode-archive-title"
    >
      <header className="show-header discography-release-archive__banner">
        <div className="discography-release-archive__banner-rows flex min-w-0 flex-1 flex-col gap-5 md:flex-row md:items-start md:gap-6">
          {episode.artwork?.trim() ?
            <div className="w-full shrink-0 md:w-auto md:max-h-[280px] md:shrink-0 md:self-start">
              <img
                src={episode.artwork.trim()}
                alt={displayName}
                decoding="async"
                className="discography-release-archive__artwork mx-auto block h-auto w-full max-w-full object-contain object-center md:mx-0 md:w-auto md:max-h-[280px]"
              />
            </div>
          : null}
          <div className="left flex min-w-0 w-full flex-1 flex-col gap-4 md:gap-5">
            <div className="show-header-title-row">
              <h1
                id="wted-episode-archive-title"
                className="show-header-heading"
              >
                {displayName}
              </h1>
            </div>
            <p className="discography-release-archive__artist-meta">
              {showName}
            </p>

            {siblings.length > 1 || hosts.length > 0 ?
              <div className="discography-release-archive__header-meta-region">
                <dl className="discography-release-archive__header-meta">
                  {siblings.length > 1 ?
                    <>
                      <dt className="sc-label">Episode</dt>
                      <dd className="min-w-0 max-w-full">
                        <Select
                          value={episode.uuid}
                          onValueChange={(id) => onNavigateEpisode(id)}
                        >
                          <SelectTrigger
                            size="sm"
                            className={cn(
                              "h-6 w-auto min-w-[120px] max-w-full font-semibold",
                              WL_HOME_V2_SETLIST_SELECT_TRIGGER,
                            )}
                          >
                            <SelectValue placeholder="Episode">
                              <span className="font-semibold">
                                {displayName}
                              </span>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent
                            className={WL_HOME_V2_SETLIST_SELECT_CONTENT}
                          >
                            {siblings.map((s) => (
                              <SelectItem
                                key={s.uuid}
                                value={s.uuid}
                                className="text-xs"
                              >
                                {getWtedEpisodeDisplayName(
                                  s.episode,
                                  s.display_name,
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </dd>
                    </>
                  : null}

                  {hosts.length > 0 ?
                    <>
                      <dt className="sc-label">
                        {hosts.length > 1 ? "Hosts" : "Host"}
                      </dt>
                      <dd>
                        <ul className="m-0 list-none space-y-2 p-0">
                          {hosts.map((h, i) => {
                            const profileHref =
                              h.handle ?
                                discourseUserProfileUrlFromHandle(h.handle)
                              : null
                            return (
                              <li
                                key={`${h.name}-${h.handle}-${i}`}
                                className="flex flex-wrap items-center gap-2"
                              >
                                {h.name ?
                                  <span className="text-sm font-normal text-white/88">
                                    {h.name}
                                  </span>
                                : null}
                                {h.handle ?
                                  profileHref ?
                                    <Link
                                      href={profileHref}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="last-pill max-w-full min-w-0 truncate no-underline transition-opacity hover:opacity-90"
                                      style={hostHandlePillStyle()}
                                    >
                                      {h.handle}
                                    </Link>
                                  : <span
                                      className="last-pill inline-block max-w-full min-w-0 truncate"
                                      style={hostHandlePillStyle()}
                                    >
                                      {h.handle}
                                    </span>
                                : null}
                              </li>
                            )
                          })}
                        </ul>
                      </dd>
                    </>
                  : null}
                </dl>
              </div>
            : null}

            {descriptionHtml ?
              <div className="show-notes min-w-0">
                <div
                  className="show-notes-inner"
                  role="region"
                  aria-label="Description"
                >
                  <div
                    className="show-notes-body"
                    dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                  />
                </div>
              </div>
            : null}
          </div>
        </div>
      </header>
    </section>
  )
}
