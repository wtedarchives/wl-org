"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react"

import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import {
  siteSearchShowsSupportTourTable,
  WlHomeV2SiteSearchShowsTable,
} from "@/components/wl-home-v2/wl-home-v2-site-search-shows-table"
import { getDiscographyArchiveUrl } from "@/lib/discography-archive-url"
import { getPersonnelArchiveUrl } from "@/lib/personnel-archive-url"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getSiteSearchArchiveUrl } from "@/lib/site-search-archive-url"
import {
  fetchSiteSearchCategoryAll,
  isSiteSearchCategory,
  SITE_SEARCH_CATEGORIES,
  SITE_SEARCH_CATEGORY_LABELS,
  SITE_SEARCH_MIN_QUERY_LENGTH,
  type SiteSearchCategory,
  type SiteSearchDiscographyHit,
  type SiteSearchHit,
  type SiteSearchPersonnelHit,
  type SiteSearchShowHit,
  type SiteSearchSongHit,
  type SiteSearchTourHit,
  type SiteSearchVenueHit,
} from "@/lib/site-search"
import { getSongArchiveUrl } from "@/lib/song-archive-url"
import { getTourArchiveUrl } from "@/lib/tour-archive-url"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"

function hitHref(category: SiteSearchCategory, hit: SiteSearchHit): string {
  switch (category) {
    case "shows":
      return getSetlistArchiveUrl(hit.id)
    case "songs":
      return getSongArchiveUrl(hit.id)
    case "discography":
      return getDiscographyArchiveUrl(hit.id)
    case "venues":
      return getVenueArchiveUrl(hit.id)
    case "tours":
      return getTourArchiveUrl(hit.id)
    case "personnel":
      return getPersonnelArchiveUrl(hit.id)
  }
}

function HitContent({
  category,
  hit,
}: {
  category: SiteSearchCategory
  hit: SiteSearchHit
}) {
  if (category === "shows") {
    const show = hit as SiteSearchShowHit
    return (
      <>
        <span className="wl-home-v2-site-search-hit-label">{show.label}</span>
        {show.detail ?
          <span className="wl-home-v2-site-search-hit-detail">{show.detail}</span>
        : null}
      </>
    )
  }
  if (category === "songs") {
    const song = hit as SiteSearchSongHit
    return (
      <span className="wl-home-v2-site-search-hit-label">{song.song}</span>
    )
  }
  if (category === "discography") {
    const row = hit as SiteSearchDiscographyHit
    const artist = (row.artist ?? "").trim()
    return (
      <span className="wl-home-v2-site-search-hit-inline">
        <span className="wl-home-v2-site-search-hit-label">
          {(row.displayname ?? "").trim() || row.name}
        </span>
        {artist ?
          <span className="wl-home-v2-site-search-meta-pill">{artist}</span>
        : null}
      </span>
    )
  }
  if (category === "venues") {
    const row = hit as SiteSearchVenueHit
    const divider = " – "
    const label = typeof row.label === "string" ? row.label : ""
    const fromLabel = label.includes(divider) ? label.split(divider) : [label]
    const subvenue =
      (row.subvenue ?? "").trim() || fromLabel[0]?.trim() || label || "Venue"
    const location =
      (row.location ?? "").trim() ||
      (fromLabel.length > 1 ? fromLabel.slice(1).join(divider).trim() : "")
    return (
      <span className="wl-home-v2-site-search-hit-inline">
        <span className="wl-home-v2-site-search-hit-label">{subvenue}</span>
        {location ?
          <span className="wl-home-v2-site-search-meta-pill">{location}</span>
        : null}
      </span>
    )
  }
  if (category === "tours") {
    const row = hit as SiteSearchTourHit
    return <span className="wl-home-v2-site-search-hit-label">{row.tour}</span>
  }
  const row = hit as SiteSearchPersonnelHit
  return (
    <span className="wl-home-v2-site-search-hit-label">{row.guest}</span>
  )
}

export function WlHomeV2SiteSearchArchiveView() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const qParam = (searchParams.get("q") ?? "").trim()
  const categoryParam = searchParams.get("category")
  const category: SiteSearchCategory = isSiteSearchCategory(categoryParam)
    ? categoryParam
    : "shows"

  const [draftQ, setDraftQ] = useState(qParam)
  const [items, setItems] = useState<SiteSearchHit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDraftQ(qParam)
  }, [qParam])

  const loadInitial = useCallback(async () => {
    if (qParam.length < SITE_SEARCH_MIN_QUERY_LENGTH) {
      setItems([])
      setLoading(false)
      setError(
        qParam.length === 0
          ? null
          : `Enter at least ${SITE_SEARCH_MIN_QUERY_LENGTH} characters.`,
      )
      return
    }

    setLoading(true)
    setError(null)
    try {
      const all = await fetchSiteSearchCategoryAll({
        q: qParam,
        category,
      })
      setItems(all)
    } catch (e) {
      setItems([])
      setError(e instanceof Error ? e.message : "Search failed")
    } finally {
      setLoading(false)
    }
  }, [qParam, category])

  useEffect(() => {
    void loadInitial()
  }, [loadInitial])

  const onSubmitSearch = (e: FormEvent) => {
    e.preventDefault()
    const next = draftQ.trim()
    router.push(getSiteSearchArchiveUrl(next, category))
  }

  const onCategoryChange = (next: SiteSearchCategory) => {
    router.push(getSiteSearchArchiveUrl(qParam, next))
  }

  return (
    <div className="wl-home-v2-site-search-page rounded-b-none md:rounded-b-xl overflow-hidden">
      <div className="wl-home-v2-site-search-page-inner">
        <header className="wl-home-v2-site-search-page-head">
          <h1 className="wl-home-v2-site-search-page-title">Search</h1>
          <form
            className="wl-home-v2-site-search-field wl-home-v2-site-search-page-form"
            onSubmit={onSubmitSearch}
            role="search"
          >
            <label htmlFor="archive-site-search-q" className="sr-only">
              Search WTED
            </label>
            <input
              id="archive-site-search-q"
              type="search"
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
              placeholder="Search WTED..."
              className="wl-home-v2-site-search-input"
              autoComplete="off"
            />
            <button
              type="submit"
              className="wl-home-v2-site-search-submit"
              aria-label="Search"
            >
              Go
            </button>
          </form>
        </header>

        <div
          className="wl-home-v2-site-search-page-tabs"
          role="tablist"
          aria-label="Result categories"
        >
          {SITE_SEARCH_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={cat === category}
              className={[
                "wl-home-v2-archive-subnav-pill",
                cat === category ? "wl-home-v2-archive-subnav-pill--active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onCategoryChange(cat)}
            >
              {SITE_SEARCH_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {loading ?
          <WlHomeV2PageLoading message="Loading search results…" />
        : error ?
          <p className="wl-home-v2-site-search-status wl-home-v2-site-search-status--error">
            {error}
          </p>
        : qParam.length < SITE_SEARCH_MIN_QUERY_LENGTH ?
          <p className="wl-home-v2-site-search-status">
            Enter a search of at least {SITE_SEARCH_MIN_QUERY_LENGTH} characters.
          </p>
        : category === "shows" &&
          items.length > 0 &&
          siteSearchShowsSupportTourTable(items as SiteSearchShowHit[]) ?
          <WlHomeV2SiteSearchShowsTable hits={items as SiteSearchShowHit[]} />
        : <div className="widget-panel wl-home-v2-years-shows-panel wl-home-v2-years-shows-panel--natural wl-home-v2-site-search-results-panel">
            {items.length === 0 ?
              <p className="wl-home-v2-site-search-status">
                No {SITE_SEARCH_CATEGORY_LABELS[category].toLowerCase()} for “
                {qParam}”.
              </p>
            : items.map((hit) => (
                <Link
                  key={hit.id}
                  href={hitHref(category, hit)}
                  className="topic-row wl-home-v2-site-search-page-topic-row"
                >
                  <span className="wl-home-v2-site-search-page-topic-main">
                    <HitContent category={category} hit={hit} />
                  </span>
                </Link>
              ))
            }
          </div>
        }
      </div>
    </div>
  )
}
