"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react"

import {
  WL_V2_ARCHIVES_BREADCRUMB_ROOT,
  type BreadcrumbItem,
} from "@/components/setlist-breadcrumb-context"
import {
  WlHomeV2ArchiveCrumbsShell,
  WlHomeV2ArchiveCrumbsTrail,
} from "@/components/wl-home-v2/wl-home-v2-archive-crumbs"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { useWlHomeV2OpenArchiveHub } from "@/components/wl-home-v2/wl-home-v2-open-archive-hub-context"
import { useAuth } from "@/components/auth-context"
import { useSiteSearchAccess } from "@/hooks/use-site-search-access"
import { getDiscographyArchiveUrl } from "@/lib/discography-archive-url"
import { getPersonnelArchiveUrl } from "@/lib/personnel-archive-url"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getSiteSearchArchiveUrl } from "@/lib/site-search-archive-url"
import {
  fetchSiteSearchCategory,
  isSiteSearchCategory,
  SITE_SEARCH_CATEGORIES,
  SITE_SEARCH_CATEGORY_LABELS,
  SITE_SEARCH_MIN_QUERY_LENGTH,
  SITE_SEARCH_PAGE_LIMIT,
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
    return (
      <span className="wl-home-v2-site-search-hit-label">
        {(row.displayname ?? "").trim() || row.name}
      </span>
    )
  }
  if (category === "venues") {
    const row = hit as SiteSearchVenueHit
    return <span className="wl-home-v2-site-search-hit-label">{row.label}</span>
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
  const openArchiveHub = useWlHomeV2OpenArchiveHub()
  const { session } = useAuth()
  const { allowed, loading: accessLoading } = useSiteSearchAccess()
  const router = useRouter()
  const searchParams = useSearchParams()

  const qParam = (searchParams.get("q") ?? "").trim()
  const categoryParam = searchParams.get("category")
  const category: SiteSearchCategory = isSiteSearchCategory(categoryParam)
    ? categoryParam
    : "shows"

  const [draftQ, setDraftQ] = useState(qParam)
  const [items, setItems] = useState<SiteSearchHit[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDraftQ(qParam)
  }, [qParam])

  useEffect(() => {
    if (accessLoading) return
    if (!allowed) {
      router.replace("/archive")
    }
  }, [accessLoading, allowed, router])

  const breadcrumbs: BreadcrumbItem[] = useMemo(
    () => [
      WL_V2_ARCHIVES_BREADCRUMB_ROOT,
      {
        label: qParam ? `Search: ${qParam}` : "Search",
        href: getSiteSearchArchiveUrl(qParam, category),
      },
    ],
    [qParam, category],
  )

  const loadInitial = useCallback(async () => {
    if (!session?.token || !allowed) {
      setItems([])
      setHasMore(false)
      setLoading(false)
      return
    }

    if (qParam.length < SITE_SEARCH_MIN_QUERY_LENGTH) {
      setItems([])
      setHasMore(false)
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
      const data = await fetchSiteSearchCategory({
        accessToken: session.token,
        q: qParam,
        category,
        offset: 0,
        limit: SITE_SEARCH_PAGE_LIMIT,
      })
      setItems(data.items)
      setHasMore(data.hasMore)
    } catch (e) {
      setItems([])
      setHasMore(false)
      setError(e instanceof Error ? e.message : "Search failed")
    } finally {
      setLoading(false)
    }
  }, [qParam, category, session?.token, allowed])

  useEffect(() => {
    void loadInitial()
  }, [loadInitial])

  const onLoadMore = async () => {
    if (loadingMore || !hasMore || !session?.token) return
    setLoadingMore(true)
    setError(null)
    try {
      const data = await fetchSiteSearchCategory({
        accessToken: session.token,
        q: qParam,
        category,
        offset: items.length,
        limit: SITE_SEARCH_PAGE_LIMIT,
      })
      setItems((prev) => [...prev, ...data.items])
      setHasMore(data.hasMore)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed")
    } finally {
      setLoadingMore(false)
    }
  }

  const onSubmitSearch = (e: FormEvent) => {
    e.preventDefault()
    const next = draftQ.trim()
    router.push(getSiteSearchArchiveUrl(next, category))
  }

  const onCategoryChange = (next: SiteSearchCategory) => {
    router.push(getSiteSearchArchiveUrl(qParam, next))
  }

  if (accessLoading || !allowed) {
    return <WlHomeV2PageLoading message="Loading search…" />
  }

  return (
    <div className="wl-home-v2-site-search-page rounded-b-none md:rounded-b-xl overflow-hidden">
      <WlHomeV2ArchiveCrumbsShell
        variant="page-gutter"
        trail={
          <WlHomeV2ArchiveCrumbsTrail
            items={breadcrumbs}
            openArchiveHub={openArchiveHub ?? undefined}
          />
        }
      />

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
                "wl-home-v2-site-search-page-tab",
                cat === category ?
                  "wl-home-v2-site-search-page-tab--active"
                : "",
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
        : items.length === 0 ?
          <p className="wl-home-v2-site-search-status">
            No {SITE_SEARCH_CATEGORY_LABELS[category].toLowerCase()} for “
            {qParam}”.
          </p>
        : <>
            <ul className="wl-home-v2-site-search-page-list">
              {items.map((hit) => (
                <li key={hit.id}>
                  <Link
                    href={hitHref(category, hit)}
                    className="wl-home-v2-site-search-hit wl-home-v2-site-search-page-hit"
                  >
                    <HitContent category={category} hit={hit} />
                  </Link>
                </li>
              ))}
            </ul>
            {hasMore ?
              <div className="wl-home-v2-site-search-page-more">
                <button
                  type="button"
                  className="wl-home-v2-site-search-page-more-btn"
                  onClick={() => void onLoadMore()}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            : null}
          </>
        }
      </div>
    </div>
  )
}
