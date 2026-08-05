"use client"

import Link from "next/link"

import { getDiscographyArchiveUrl } from "@/lib/discography-archive-url"
import { getPersonnelArchiveUrl } from "@/lib/personnel-archive-url"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getSiteSearchArchiveUrl } from "@/lib/site-search-archive-url"
import {
  SITE_SEARCH_CATEGORY_LABELS,
  siteSearchHasHits,
  type SiteSearchCategory,
  type SiteSearchResponse,
} from "@/lib/site-search"
import { getSongArchiveUrl } from "@/lib/song-archive-url"
import { getTourArchiveUrl } from "@/lib/tour-archive-url"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"

type WlHomeV2SiteSearchResultsProps = {
  results: SiteSearchResponse | null
  loading: boolean
  error: string | null
  hint: string | null
  onNavigate?: () => void
}

function Section({
  title,
  seeMoreLabel,
  children,
  seeMoreHref,
  onNavigate,
}: {
  title: string
  seeMoreLabel?: string
  children: React.ReactNode
  seeMoreHref?: string | null
  onNavigate?: () => void
}) {
  return (
    <section className="wl-home-v2-site-search-section">
      <h4 className="wl-home-v2-site-search-section-title">{title}</h4>
      <ul className="wl-home-v2-site-search-list">{children}</ul>
      {seeMoreHref && seeMoreLabel ?
        <Link
          href={seeMoreHref}
          className="wl-home-v2-site-search-see-more"
          onClick={onNavigate}
        >
          {seeMoreLabel}
        </Link>
      : null}
    </section>
  )
}

function seeMoreFor(
  results: SiteSearchResponse,
  category: SiteSearchCategory,
): string | null {
  if (!results.hasMore[category]) return null
  return getSiteSearchArchiveUrl(results.q, category)
}

export function WlHomeV2SiteSearchResults({
  results,
  loading,
  error,
  hint,
  onNavigate,
}: WlHomeV2SiteSearchResultsProps) {
  if (hint) {
    return <p className="wl-home-v2-site-search-status">{hint}</p>
  }
  if (loading) {
    return <p className="wl-home-v2-site-search-status">Searching…</p>
  }
  if (error) {
    return (
      <p className="wl-home-v2-site-search-status wl-home-v2-site-search-status--error">
        {error}
      </p>
    )
  }
  if (!results) {
    return (
      <p className="wl-home-v2-site-search-status">
        Press enter to search WTED Archives.
      </p>
    )
  }
  if (!siteSearchHasHits(results)) {
    return (
      <p className="wl-home-v2-site-search-status">
        No results for “{results.q}”.
      </p>
    )
  }

  return (
    <div className="wl-home-v2-site-search-results">
      {results.shows.length > 0 ?
        <Section
          title={SITE_SEARCH_CATEGORY_LABELS.shows}
          seeMoreLabel="See more shows"
          seeMoreHref={seeMoreFor(results, "shows")}
          onNavigate={onNavigate}
        >
          {results.shows.map((hit) => (
            <li key={hit.id}>
              <Link
                href={getSetlistArchiveUrl(hit.id)}
                className="wl-home-v2-site-search-hit"
                onClick={onNavigate}
              >
                <span className="wl-home-v2-site-search-hit-label">
                  {hit.label}
                </span>
                {hit.detail ?
                  <span className="wl-home-v2-site-search-hit-detail">
                    {hit.detail}
                  </span>
                : null}
              </Link>
            </li>
          ))}
        </Section>
      : null}

      {results.songs.length > 0 ?
        <Section
          title={SITE_SEARCH_CATEGORY_LABELS.songs}
          seeMoreLabel="See more songs"
          seeMoreHref={seeMoreFor(results, "songs")}
          onNavigate={onNavigate}
        >
          {results.songs.map((hit) => (
            <li key={hit.id}>
              <Link
                href={getSongArchiveUrl(hit.id)}
                className="wl-home-v2-site-search-hit"
                onClick={onNavigate}
              >
                <span className="wl-home-v2-site-search-hit-label">
                  {hit.song}
                </span>
              </Link>
            </li>
          ))}
        </Section>
      : null}

      {results.discography.length > 0 ?
        <Section
          title={SITE_SEARCH_CATEGORY_LABELS.discography}
          seeMoreLabel="See more discography"
          seeMoreHref={seeMoreFor(results, "discography")}
          onNavigate={onNavigate}
        >
          {results.discography.map((hit) => (
            <li key={hit.id}>
              <Link
                href={getDiscographyArchiveUrl(hit.id)}
                className="wl-home-v2-site-search-hit"
                onClick={onNavigate}
              >
                <span className="wl-home-v2-site-search-hit-label">
                  {(hit.displayname ?? "").trim() || hit.name}
                </span>
              </Link>
            </li>
          ))}
        </Section>
      : null}

      {results.venues.length > 0 ?
        <Section
          title={SITE_SEARCH_CATEGORY_LABELS.venues}
          seeMoreLabel="See more venues"
          seeMoreHref={seeMoreFor(results, "venues")}
          onNavigate={onNavigate}
        >
          {results.venues.map((hit) => (
            <li key={hit.id}>
              <Link
                href={getVenueArchiveUrl(hit.id)}
                className="wl-home-v2-site-search-hit"
                onClick={onNavigate}
              >
                <span className="wl-home-v2-site-search-hit-label">
                  {hit.label}
                </span>
              </Link>
            </li>
          ))}
        </Section>
      : null}

      {results.tours.length > 0 ?
        <Section
          title={SITE_SEARCH_CATEGORY_LABELS.tours}
          seeMoreLabel="See more tours"
          seeMoreHref={seeMoreFor(results, "tours")}
          onNavigate={onNavigate}
        >
          {results.tours.map((hit) => (
            <li key={hit.id}>
              <Link
                href={getTourArchiveUrl(hit.id)}
                className="wl-home-v2-site-search-hit"
                onClick={onNavigate}
              >
                <span className="wl-home-v2-site-search-hit-label">
                  {hit.tour}
                </span>
              </Link>
            </li>
          ))}
        </Section>
      : null}

      {results.personnel.length > 0 ?
        <Section
          title={SITE_SEARCH_CATEGORY_LABELS.personnel}
          seeMoreLabel="See more personnel"
          seeMoreHref={seeMoreFor(results, "personnel")}
          onNavigate={onNavigate}
        >
          {results.personnel.map((hit) => (
            <li key={hit.id}>
              <Link
                href={getPersonnelArchiveUrl(hit.id)}
                className="wl-home-v2-site-search-hit"
                onClick={onNavigate}
              >
                <span className="wl-home-v2-site-search-hit-label">
                  {hit.guest}
                </span>
              </Link>
            </li>
          ))}
        </Section>
      : null}
    </div>
  )
}
