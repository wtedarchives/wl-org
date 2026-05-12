"use client"

import { Separator } from "@/components/ui/separator"
import { SetlistShowNotes } from "@/components/dpro/setlist/setlist-show-notes"
import type { DiscographyReleaseRow } from "@/hooks/use-discography-release-data"

export function DiscographyReleaseArchiveHero({
  release,
  wlHomeV2Shell,
  releaseArtworkFailed,
  onArtworkError,
  releaseDateLabel,
  discographyLengthDisplay,
}: {
  release: DiscographyReleaseRow
  wlHomeV2Shell: boolean
  releaseArtworkFailed: boolean
  onArtworkError: () => void
  releaseDateLabel: string | null
  discographyLengthDisplay: string | null
}) {
  const artworkBlock =
    release.artwork && !releaseArtworkFailed ?
      <div className="w-full shrink-0 md:w-auto md:max-h-[280px] md:shrink-0 md:self-start">
        <img
          src={release.artwork}
          alt={release.displayname}
          decoding="async"
          className="discography-release-archive__artwork mx-auto block h-auto w-full max-w-full object-contain object-center md:mx-0 md:w-auto md:max-h-[280px]"
          onError={onArtworkError}
        />
      </div>
    : null

  const headerMeta =
    wlHomeV2Shell ?
      <div className="discography-release-archive__header-meta-region">
        <dl className="discography-release-archive__header-meta">
          <dt>Category</dt>
          <dd>{release.category}</dd>
          {releaseDateLabel ?
            <>
              <dt>Release date</dt>
              <dd>{releaseDateLabel}</dd>
            </>
          : null}
          {discographyLengthDisplay ?
            <>
              <dt>Length</dt>
              <dd>
                <span className="discography-release-archive__length-pill tabular-nums">
                  {discographyLengthDisplay}
                </span>
              </dd>
            </>
          : null}
        </dl>
      </div>
    : null

  if (wlHomeV2Shell) {
    return (
      <section
        className="discography-release-archive__hero flex min-w-0 flex-col gap-3 md:gap-4"
        aria-labelledby="discography-release-archive-title"
      >
        <header className="show-header discography-release-archive__banner">
          <div className="discography-release-archive__banner-rows flex min-w-0 flex-1 flex-col gap-5 md:flex-row md:items-start md:gap-6">
            {artworkBlock}
            <div className="left flex min-w-0 w-full flex-1 flex-col gap-4 md:gap-5">
              <div className="show-header-title-row">
                <h1
                  id="discography-release-archive-title"
                  className="show-header-heading"
                >
                  {release.displayname}
                </h1>
              </div>
              {release.artist ?
                <p className="discography-release-archive__artist-meta">
                  {release.artist}
                </p>
              : null}
              {headerMeta}
              <div className="discography-release-archive__coach-notes min-w-0">
                <SetlistShowNotes notes={release.coach_notes} />
              </div>
            </div>
          </div>
        </header>
      </section>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        {release.artwork && !releaseArtworkFailed ?
          <div className="mx-auto w-full max-w-full shrink-0 sm:mx-0 sm:w-max">
            <img
              src={release.artwork}
              alt={release.displayname}
              className="discography-release-archive__artwork block h-auto w-full max-h-none max-w-none rounded-lg border border-border bg-muted/30 shadow-sm transition-all duration-200 ease-out sm:h-auto sm:w-auto sm:max-h-[min(70vh,520px)] sm:max-w-[min(100vw-2rem,280px)]"
              onError={onArtworkError}
            />
          </div>
        : null}

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight leading-5 text-foreground md:text-2xl">
              {release.displayname}
            </h1>
            {release.artist ?
              <p className="mt-1 text-sm text-muted-foreground">
                {release.artist}
              </p>
            : null}
          </div>

          <Separator />

          <dl className="grid gap-2 text-sm">
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              <dt className="text-muted-foreground">Category</dt>
              <dd className="font-medium text-foreground">{release.category}</dd>
            </div>
            {releaseDateLabel ?
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                <dt className="text-muted-foreground">Release date</dt>
                <dd className="font-medium text-foreground">
                  {releaseDateLabel}
                </dd>
              </div>
            : null}
            {discographyLengthDisplay ?
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <dt className="text-muted-foreground">Length</dt>
                <dd className="m-0">
                  <span className="inline-block rounded bg-wl-dark-green px-1.5 py-[1px] text-xs font-medium tabular-nums text-white">
                    {discographyLengthDisplay}
                  </span>
                </dd>
              </div>
            : null}
          </dl>
          <SetlistShowNotes notes={release.coach_notes} />
        </div>
      </div>
    </>
  )
}
