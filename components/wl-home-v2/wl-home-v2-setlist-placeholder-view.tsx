"use client"

import {
  Fragment,
  useCallback,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from "react"
import Link from "next/link"
import { CaretLeft, CaretRight } from "@phosphor-icons/react"

import {
  WL_V2_ARCHIVES_BREADCRUMB_ROOT,
  type BreadcrumbItem,
} from "@/components/setlist-breadcrumb-context"
import { useWlHomeV2OpenArchiveHub } from "@/components/wl-home-v2/wl-home-v2-open-archive-hub-context"
import { formatSetlistDate } from "@/lib/setlist-utils"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"
import { cn } from "@/lib/utils"
import type { ShowPositionInTour } from "@/hooks/use-show-position-in-tour"
import type { SetlistEntry, Show } from "@/types/setlist"
import { WlHomeV2SetlistTable } from "@/components/wl-home-v2/wl-home-v2-setlist-table"

/** Match `wl-home-v2-years-view` / Tailwind `xl` — desktop two-column layout. */
const TAILWIND_XL_MIN_PX = 1280

type SetlistLayoutMode = "mobile" | "desktop" | null

/**
 * Setlist archive shell: same layout stack as years (`wl-home-v2-years-page` → body →
 * columns → `section` + `aside`). Static mock body from `Setlist.html` (no header/footer/cursor);
 * breadcrumbs use `/old/archive/setlist` resolution when `breadcrumbs` is set.
 */
export function WlHomeV2SetlistPlaceholderView({
  breadcrumbs,
  show,
  setlist,
  showPositionInTour,
  tourShowNav,
  onTourShowSelect,
  maxShowCanonId,
  maxShowCanonIdLoading,
  onJotyBadgeClick,
}: {
  breadcrumbs: BreadcrumbItem[] | null
  show: Show
  setlist: SetlistEntry[]
  onJotyBadgeClick: (entry: SetlistEntry) => void
  showPositionInTour: ShowPositionInTour | null
  tourShowNav: {
    prevShowId: string | null
    nextShowId: string | null
  } | null
  onTourShowSelect: (showId: string) => void
  maxShowCanonId: number | null
  maxShowCanonIdLoading: boolean
}) {
  const openArchiveHub = useWlHomeV2OpenArchiveHub()
  const [layoutMode, setLayoutMode] = useState<SetlistLayoutMode>(null)
  const [attended, setAttended] = useState(false)
  const onAttendClick = useCallback(() => {
    setAttended((v) => !v)
  }, [])

  useLayoutEffect(() => {
    const mq = window.matchMedia(`(min-width: ${TAILWIND_XL_MIN_PX}px)`)
    const apply = () => {
      setLayoutMode(mq.matches ? "desktop" : "mobile")
    }
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [])

  const useCompactTools = layoutMode !== "desktop"

  const showGroupLabel = show.show_group?.trim() ?? ""
  const venueLocation = show.show_venue_location?.trim() ?? ""
  const subvenueLabel = show.show_subvenue?.trim() ?? ""
  const showDetailLabel = show.show_detail?.trim() ?? ""
  const coachNotesText = show.show_coachnotes?.trim() ?? ""

  const showCanonPositionPill =
    show.show_canonid != null &&
    !maxShowCanonIdLoading &&
    maxShowCanonId != null

  const onArchivesCrumbClick = useCallback(
    (e: ReactMouseEvent<HTMLAnchorElement>) => {
      if (
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return
      }
      e.preventDefault()
      openArchiveHub?.()
    },
    [openArchiveHub],
  )

  return (
    <div className="wl-home-v2-years-page wl-home-v2-setlist">
      {breadcrumbs != null && breadcrumbs.length > 0 ?
        <div className="crumbs">
          {breadcrumbs.map((item, i) => {
            const isArchivesHub =
              item.href === WL_V2_ARCHIVES_BREADCRUMB_ROOT.href &&
              item.label === WL_V2_ARCHIVES_BREADCRUMB_ROOT.label
            const isLast = i === breadcrumbs.length - 1
            return (
              <Fragment key={`${i}-${item.label}`}>
                {i > 0 ?
                  <span className="sep">&gt;</span>
                : null}
                {isLast ?
                  <span className="here">{item.label}</span>
                : isArchivesHub && openArchiveHub ?
                  <a href={item.href} onClick={onArchivesCrumbClick}>
                    {item.label}
                  </a>
                : <a href={item.href}>{item.label}</a>}
              </Fragment>
            )
          })}
        </div>
      : null}

      <div className="wl-home-v2-years-body">
        <div
          className={cn(
            "wl-home-v2-years-columns",
            !useCompactTools && "wl-home-v2-years-columns--desktop",
          )}
        >
          <section
            className="wl-home-v2-years-tile wl-home-v2-years-tile--main"
            style={
              {
                "--tile-bg": "url('/newbg3.jpeg')",
              } as CSSProperties
            }
          >
            <div className="wl-home-v2-years-tile-inner min-h-0 flex min-w-0 flex-1 flex-col gap-4">
          <div className="show-header">
            <div className="left">
              <h1>
                <span className="date">{formatSetlistDate(show.show_date)}</span>
                {showGroupLabel ?
                  <>
                    <span className="show-header-title-divider" aria-hidden="true">
                      {" "}
                      ·{" "}
                    </span>
                    <span className="show-header-title-group">{showGroupLabel}</span>
                  </>
                : null}
              </h1>
              {subvenueLabel || venueLocation ?
                <div className="venue">
                  {subvenueLabel ?
                    <>
                      {show.venue_id ?
                        <Link
                          href={getVenueArchiveUrl(show.venue_id)}
                          className="venue-subvenue-link"
                        >
                          {subvenueLabel}
                        </Link>
                      : show.show_subvenue_venue ?
                        <Link
                          href={getVenueArchiveUrl(show.show_subvenue_venue)}
                          className="venue-subvenue-link"
                        >
                          {subvenueLabel}
                        </Link>
                      : <span className="venue-subvenue-text">{subvenueLabel}</span>}
                      {venueLocation ?
                        <>
                          <span className="city" aria-hidden="true">
                            ·
                          </span>
                          <span className="venue-location">{venueLocation}</span>
                        </>
                      : null}
                    </>
                  : venueLocation ?
                    <span className="venue-location">{venueLocation}</span>
                  : null}
                </div>
              : null}
              {showDetailLabel ?
                <div className="show-header-detail">
                  <span className="show-detail-pill">{showDetailLabel}</span>
                </div>
              : null}
            </div>
            <div className="show-header-nav">
              {showCanonPositionPill ?
                <span className="pos">
                  SHOW {show.show_canonid!.toLocaleString("en-US")} OF{" "}
                  {maxShowCanonId!.toLocaleString("en-US")}
                </span>
              : null}
              <div
                className={cn(
                  "show-header-nav-footer",
                  showCanonPositionPill &&
                    "show-header-nav-footer--with-canon-pill",
                )}
              >
                {show.show_tour || showPositionInTour ?
                  <div className="meta show-header-nav-tour">
                    {show.show_tour ?
                      <span className="meta-tour">{show.show_tour}</span>
                    : null}
                    {show.show_tour && showPositionInTour ?
                      <span aria-hidden="true"> · </span>
                    : null}
                    {showPositionInTour ?
                      <span className="meta-tour">
                        Show {showPositionInTour.position} of{" "}
                        {showPositionInTour.total}
                      </span>
                    : null}
                  </div>
                : null}
                <div className="nav-btns">
                  <button
                    type="button"
                    className="nav-btn"
                    aria-label="Previous show in tour"
                    disabled={!tourShowNav?.prevShowId}
                    onClick={() =>
                      tourShowNav?.prevShowId &&
                      onTourShowSelect(tourShowNav.prevShowId)
                    }
                  >
                    <CaretLeft
                      className="size-3.5 shrink-0 opacity-90"
                      aria-hidden
                    />
                    Prev
                  </button>
                  <button
                    type="button"
                    className="nav-btn"
                    aria-label="Next show in tour"
                    disabled={!tourShowNav?.nextShowId}
                    onClick={() =>
                      tourShowNav?.nextShowId &&
                      onTourShowSelect(tourShowNav.nextShowId)
                    }
                  >
                    Next
                    <CaretRight
                      className="size-3.5 shrink-0 opacity-90"
                      aria-hidden
                    />
                  </button>
                </div>
              </div>
            </div>
            {coachNotesText ?
              <div className="show-notes">
                <div className="show-notes-inner">
                  <div className="notes-label">Coach&apos;s Notes</div>
                  <div
                    className="show-notes-body"
                    dangerouslySetInnerHTML={{ __html: coachNotesText }}
                  />
                </div>
              </div>
            : null}
          </div>

          <div className="quick-stats">
            <div className="qs-card">
              <div className="qs-label">Rating</div>
              <div className="stars" style={{ color: "#ffd86b" }}>
                ★ ★ ★ ★ ☆
              </div>
              <div className="qs-value">
                4.3{" "}
                <span
                  style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}
                >
                  · 87 reviews
                </span>
              </div>
            </div>
            <div className="qs-card">
              <div className="qs-label">Attended</div>
              <div className="qs-value">1,842</div>
            </div>
          </div>

          <WlHomeV2SetlistTable
            show={show}
            setlist={setlist}
            onJotyBadgeClick={onJotyBadgeClick}
          />

          <div className="callbacks">
            <div className="cb-label">Callbacks</div>
            <div className="cb-list">
              <span className="cb-pill">Arrow (tease in Hot Tea)</span>
              <span className="cb-pill">Madhuvan (quote in Tumble jam)</span>
              <span className="cb-pill">Echo of a Rose → Hot Tea bridge</span>
            </div>
          </div>
            </div>
          </section>

        <aside
          className="wl-home-v2-years-aside wl-home-v2-setlist-aside"
          aria-label="Show tools"
        >
          <section
            className="wl-home-v2-years-tile"
            style={
              {
                "--tile-bg": "url('/newbg.png')",
              } as CSSProperties
            }
          >
            <div className="wl-home-v2-years-tile-inner flex flex-col gap-3">
              <div className="twin-cards">
                <div className="side-card">
                  <div className="sc-label">Rating</div>
                  <div
                    className="stars"
                    style={{ color: "#ffd86b", fontSize: 14 }}
                  >
                    ★ ★ ★ ★ ☆
                  </div>
                  <div className="sc-value">4.3</div>
                  <div className="sc-sub">87 reviews</div>
                </div>
                <div className="side-card">
                  <div className="sc-label">Attended</div>
                  <div className="sc-value">1,842</div>
                  <div className="sc-sub">of 1,800 seats</div>
                  <button
                    type="button"
                    className={"attend" + (attended ? " attended" : "")}
                    id="attend-btn"
                    onClick={onAttendClick}
                  >
                    {attended ? "✓ Attended" : "Mark as attended"}
                  </button>
                </div>
              </div>

              <a href="#" className="wbtn green">
                <span>Community Discussion</span>
                <span className="arr">→</span>
              </a>
            </div>
          </section>

          <section
            className="wl-home-v2-years-tile"
            style={
              {
                "--tile-bg": "url('/newbg2.jpeg')",
              } as CSSProperties
            }
          >
            <div className="wl-home-v2-years-tile-inner flex flex-col gap-3">
              <div className="side-card">
                <div className="sc-label">Show Stats</div>
                <div className="stat-row">
                  <span className="sr-label">Total length</span>
                  <span className="sr-val">2:47:12</span>
                </div>
                <div className="stat-row">
                  <span className="sr-label">Length rank</span>
                  <span className="sr-val">87th longest</span>
                </div>
                <div className="stat-row">
                  <span className="sr-label">Songs</span>
                  <span className="sr-val">8</span>
                </div>
                <div className="stat-row">
                  <span className="sr-label">Unique tours</span>
                  <span className="sr-val">3</span>
                </div>
                <div className="stat-row">
                  <span className="sr-label">Bust-outs</span>
                  <span className="sr-val">2</span>
                </div>
                <div className="stat-row">
                  <span className="sr-label">Guests</span>
                  <span className="sr-val">1</span>
                </div>
              </div>

              <div className="side-card">
                <div className="sc-label">Show Badges</div>
                <div className="badges">
                  <span className="badge">
                    <span className="badge-dot" />
                    Bust-out Night
                  </span>
                  <span className="badge">
                    <span
                      className="badge-dot"
                      style={{ background: "var(--wl-green)" }}
                    />
                    Guest Sit-in
                  </span>
                  <span className="badge">
                    <span
                      className="badge-dot"
                      style={{ background: "#ffd86b" }}
                    />
                    Acoustic Encore
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section
            className="wl-home-v2-years-tile"
            style={
              {
                "--tile-bg": "url('/newbg4.jpeg')",
              } as CSSProperties
            }
          >
            <div className="wl-home-v2-years-tile-inner">
              <div className="side-card">
                <div className="sc-label">Song Spread</div>
                <div className="spread-row">
                  <span className="swatch" style={{ background: "#58c8ae" }} />
                  <span className="sp-name">Set 1</span>
                  <span className="sp-count">3 · 43:05</span>
                </div>
                <div className="spread-row">
                  <span className="swatch" style={{ background: "#ffb999" }} />
                  <span className="sp-name">Set 2</span>
                  <span className="sp-count">4 · 46:11</span>
                </div>
                <div className="spread-row">
                  <span className="swatch" style={{ background: "#ff7a67" }} />
                  <span className="sp-name">Encore</span>
                  <span className="sp-count">1 · 6:31</span>
                </div>
              </div>
            </div>
          </section>
        </aside>
        </div>
      </div>
    </div>
  )
}
