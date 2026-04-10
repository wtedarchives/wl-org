"use client"

import { useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { useProgramDirectorData } from "@/hooks/use-program-director-data"
import { getWtedEpisodeDisplayName } from "@/lib/wted-episode-display-name"
import { getWtedEpisodeUrl } from "@/lib/wted-episode-url"

export function ProgramDirectorContent() {
  const { shows, loading, error } = useProgramDirectorData()

  useEffect(() => {
    document.title = "Program Director – WysteriaLane.org"
    return () => {
      document.title = ""
    }
  }, [])

  if (loading) {
    return <LoadingPageCard message="Loading program director data…" />
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 rounded-b-none md:rounded-b-xl overflow-hidden">
        <div className="flex flex-1 items-center justify-center py-12">
          <p className="text-center text-sm text-muted-foreground">
            Could not load Program Director data. Please reload the page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 rounded-b-none md:rounded-b-xl overflow-hidden">
      <div className="mb-1 w-full">
        <Card className="overflow-hidden border border-border/60 bg-card/80 shadow-sm py-0">
          <div className="bg-muted/60 flex min-w-0 flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="shrink-0 text-sm font-semibold">
                WTED Radio Program Director
              </h1>
            </div>
          </div>
          <CardContent className="border-t border-border/40 bg-muted/20 px-3 py-3 text-xs leading-relaxed text-muted-foreground">
            <p>
              <a
                href="https://www.wtedradio.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:underline"
              >
                WTED Goose Radio
              </a>{" "}
              is a station that celebrates the band Goose as well as Goose-related projects
              and forerunners like Vasudo, Great Blue, and Orebolo. It streams a
              mix of studio and live recordings from the band&apos;s various
              catalogs as well as commentary, special event simulcasts, and
              other programming. Below is a list of shows and episodes on WTED.
              Episodes with a published track listing link to the full episode
              page.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8 w-full min-w-0 space-y-3 pb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Shows
        </h2>
        <div className="columns-1 gap-x-4 space-y-4 md:columns-2 lg:columns-3 xl:columns-4">
          {shows.map((showItem) => (
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
              {showItem.episodes.length > 0 ? (
                <ul>
                  {showItem.episodes.map((ep) => (
                    <li
                      key={ep.uuid}
                      className="border-t border-border/40 bg-muted/40 transition-colors hover:bg-muted/20"
                    >
                      {ep.hasEntries ? (
                        <Link
                          href={getWtedEpisodeUrl(ep.uuid)}
                          className="flex min-h-11 items-center gap-2 py-1.5 pl-3 pr-2 text-xs font-medium text-foreground hover:underline sm:min-h-0"
                        >
                          {ep.artwork?.trim() ? (
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
                          ) : null}
                          <span className="min-w-0 flex-1 leading-3.5">
                            {getWtedEpisodeDisplayName(
                              ep.episode,
                              ep.display_name,
                            )}
                          </span>
                        </Link>
                      ) : (
                        <div className="flex min-h-11 items-center gap-2 py-1.5 pl-3 pr-2 text-xs font-normal text-muted-foreground sm:min-h-0">
                          {ep.artwork?.trim() ? (
                            <span className="relative size-7 shrink-0 overflow-hidden rounded border border-border opacity-90 sm:size-5">
                              <Image
                                src={ep.artwork}
                                alt=""
                                width={28}
                                height={28}
                                className="size-7 object-cover sm:size-5"
                                unoptimized
                              />
                            </span>
                          ) : null}
                          <span className="min-w-0 flex-1 leading-3.5">
                            {getWtedEpisodeDisplayName(
                              ep.episode,
                              ep.display_name,
                            )}
                          </span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-3 py-2 text-xs italic text-muted-foreground">
                  No episodes found
                </p>
              )}
            </CardContent>
          </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
