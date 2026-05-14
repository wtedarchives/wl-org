"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { Check } from "lucide-react"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import {
  useProgramDirectorData,
  type ProgramDirectorEpisode,
} from "@/hooks/use-program-director-data"
import { getWtedEpisodeDisplayName } from "@/lib/wted-episode-display-name"
import { cn } from "@/lib/utils"
import { AdminRadioEpisodeSetlistsDialog } from "@/components/dpro/admin/admin-radio-episode-setlists-dialog"

export function AdminRadioEpisodeSetlistsPanel() {
  const { shows, loading, error, reload } = useProgramDirectorData()
  const showsWithEpisodes = useMemo(
    () => shows.filter((s) => s.episodes.length > 0),
    [shows],
  )
  const [dialogEpisode, setDialogEpisode] =
    useState<ProgramDirectorEpisode | null>(null)

  if (loading) {
    return <LoadingPageCard message="Loading episodes…" />
  }

  if (error) {
    return (
      <div className="wl-home-v2-admin-radio-tab-stack">
        <p className="wl-home-v2-admin-radio-episode-error">
          Could not load episode data. Try again later.
        </p>
      </div>
    )
  }

  return (
    <>
      <AdminRadioEpisodeSetlistsDialog
        open={dialogEpisode !== null}
        onOpenChange={(next) => {
          if (!next) {
            setDialogEpisode(null)
            void reload()
          }
        }}
        episode={dialogEpisode}
      />

      <div className="wl-home-v2-admin-radio-tab-stack">
        <div
          className={
            "widget-panel wl-home-v2-years-shows-panel wl-home-v2-years-shows-panel--natural wl-home-v2-admin-radio-tab-panel"
          }
        >
          <div
            className={cn(
              "wp-head wl-home-v2-years-shows-wp-head wl-home-v2-tours-shows-wp-head",
              "wl-home-v2-admin-radio-tab-intro-head",
            )}
          >
            <span className="wp-head-date min-w-0 flex-1 truncate pr-2">
              Episode setlists
            </span>
          </div>
          <div className="wl-home-v2-admin-radio-tab-description-wrap">
            <p className="wl-home-v2-admin-radio-tab-description">
              Same layout as Program Director. Click an episode to attach
              setlist songs (uses{" "}
              <code className="wl-home-v2-admin-radio-tab-code">radio_id</code>{" "}
              in{" "}
              <code className="wl-home-v2-admin-radio-tab-code">
                wted_episode_entries
              </code>
              ).
            </p>
          </div>
        </div>

        {showsWithEpisodes.length === 0 ? (
          <p className="wl-home-v2-admin-radio-episode-empty">
            No shows with episodes to display.
          </p>
        ) : (
          <div className="wl-home-v2-admin-radio-episode-masonry">
            {showsWithEpisodes.map((showItem) => (
              <div
                key={showItem.show}
                className="wl-home-v2-admin-radio-episode-show-card"
              >
                <div className="wl-home-v2-admin-radio-episode-show-head">
                  <h2 className="wl-home-v2-admin-radio-episode-show-title">
                    {showItem.show}
                  </h2>
                </div>
                <ul className="wl-home-v2-admin-radio-episode-list">
                  {showItem.episodes.map((ep) => {
                    const canEdit =
                      ep.radio_id != null && ep.radio_id.trim() !== ""
                    return (
                      <li
                        key={ep.uuid}
                        className="wl-home-v2-admin-radio-episode-row"
                      >
                        {canEdit ?
                          <button
                            type="button"
                            className="wl-home-v2-admin-radio-episode-row-button"
                            onClick={() => setDialogEpisode(ep)}
                          >
                            {ep.artwork?.trim() ?
                              <span
                                className={cn(
                                  "wl-home-v2-admin-radio-episode-art",
                                  "wl-home-v2-admin-radio-episode-art--interactive",
                                )}
                              >
                                <Image
                                  src={ep.artwork}
                                  alt=""
                                  fill
                                  className="wl-home-v2-admin-radio-episode-art-img"
                                  unoptimized
                                  sizes="28px"
                                />
                              </span>
                            : null}
                            <span className="wl-home-v2-admin-radio-episode-label">
                              {getWtedEpisodeDisplayName(
                                ep.episode,
                                ep.display_name,
                              )}
                            </span>
                            {ep.hasEntries ?
                              <Check
                                className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                                strokeWidth={2.5}
                                aria-label="Has setlist entries"
                              />
                            : null}
                          </button>
                        : <div className="wl-home-v2-admin-radio-episode-row-static">
                            {ep.artwork?.trim() ?
                              <span
                                className={cn(
                                  "wl-home-v2-admin-radio-episode-art",
                                  "wl-home-v2-admin-radio-episode-art--readonly",
                                )}
                              >
                                <Image
                                  src={ep.artwork}
                                  alt=""
                                  fill
                                  className="wl-home-v2-admin-radio-episode-art-img"
                                  unoptimized
                                  sizes="20px"
                                />
                              </span>
                            : null}
                            <span className="wl-home-v2-admin-radio-episode-label">
                              {getWtedEpisodeDisplayName(
                                ep.episode,
                                ep.display_name,
                              )}{" "}
                              <span className="wl-home-v2-admin-radio-episode-hint">
                                Add a radio_id to edit the setlist here.
                              </span>
                            </span>
                          </div>
                        }
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
