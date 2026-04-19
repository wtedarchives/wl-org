"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { Check } from "lucide-react"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import {
  useProgramDirectorData,
  type ProgramDirectorEpisode,
} from "@/hooks/use-program-director-data"
import { getWtedEpisodeDisplayName } from "@/lib/wted-episode-display-name"
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
      <p className="text-sm text-muted-foreground">
        Could not load episode data. Try again later.
      </p>
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

      <div className="mt-4 space-y-3">
        <p className="text-sm text-muted-foreground">
          Same layout as Program Director. Click an episode to attach setlist
          songs (uses <span className="font-medium">radio_id</span> in{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            wted_episode_entries
          </code>
          ).
        </p>
        {showsWithEpisodes.length === 0 ? (
          <p className="text-xs italic text-muted-foreground">
            No shows with episodes to display.
          </p>
        ) : (
          <div className="columns-1 gap-x-4 space-y-4 md:columns-2 lg:columns-3 xl:columns-4">
            {showsWithEpisodes.map((showItem) => (
              <Card
                key={showItem.show}
                className="break-inside-avoid overflow-hidden rounded-lg border border-border/60 bg-background/70 py-0 shadow-sm"
              >
                <div className="bg-muted/60 flex flex-row items-center justify-between gap-2 px-4 py-2">
                  <CardTitle className="truncate pr-2 text-sm font-medium">
                    {showItem.show}
                  </CardTitle>
                </div>
                <CardContent className="p-0">
                  <ul>
                    {showItem.episodes.map((ep) => {
                      const canEdit =
                        ep.radio_id != null && ep.radio_id.trim() !== ""
                      return (
                        <li
                          key={ep.uuid}
                          className="border-t border-border/40 bg-muted/40 transition-colors"
                        >
                          {canEdit ?
                            <button
                              type="button"
                              className="flex min-h-11 w-full items-center gap-2 py-1.5 pl-3 pr-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-muted/25 sm:min-h-0"
                              onClick={() => setDialogEpisode(ep)}
                            >
                              {ep.artwork?.trim() ?
                                <span className="relative size-7 shrink-0 overflow-hidden rounded border border-border sm:size-5">
                                  <Image
                                    src={ep.artwork}
                                    alt=""
                                    width={28}
                                    height={28}
                                    className="size-7 object-cover sm:size-5"
                                    unoptimized
                                  />
                                </span>
                              : null}
                              <span className="min-w-0 flex-1 leading-snug">
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
                          : (
                            <div className="flex min-h-11 items-center gap-2 py-1.5 pl-3 pr-2 text-xs font-normal text-muted-foreground sm:min-h-0">
                              {ep.artwork?.trim() ?
                                <span className="relative size-5 shrink-0 overflow-hidden rounded border border-border opacity-90 sm:size-5">
                                  <Image
                                    src={ep.artwork}
                                    alt=""
                                    width={28}
                                    height={28}
                                    className="size-7 object-cover sm:size-5"
                                    unoptimized
                                  />
                                </span>
                              : null}
                              <span className="min-w-0 flex-1 leading-3.5">
                                {getWtedEpisodeDisplayName(
                                  ep.episode,
                                  ep.display_name,
                                )}{" "}
                                <span className="block text-[0.65rem] italic">
                                  Add a radio_id to edit the setlist here.
                                </span>
                              </span>
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
