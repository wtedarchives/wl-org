"use client"

import {
  Fragment,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react"

import {
  WL_V2_ARCHIVES_BREADCRUMB_ROOT,
  type BreadcrumbItem,
} from "@/components/setlist-breadcrumb-context"
import { cn } from "@/lib/utils"

export type WlHomeV2ArchiveCrumbsVariant = "rail" | "page-gutter"

export type WlHomeV2ArchiveCrumbsShellProps = {
  /** Setlist shell: `8px 28px` inside the years grid. Songs / song: bleed to padded page edges. */
  variant: WlHomeV2ArchiveCrumbsVariant
  /** Extra space below the bar (default: songs/song true, setlist false). */
  bottomSpacing?: boolean
  className?: string
  /** `aria-label` on the selectors column when present. */
  selectorsAriaLabel?: string
  /** Breadcrumb segments inside `<nav className="wl-home-v2-setlist-crumbs-trail">`. */
  trail: ReactNode
  /** Right column (tour/show dropdowns, songs view toggle, etc.). */
  selectors?: ReactNode
}

/**
 * Shared breadcrumb chrome for WL Home v2 archive surfaces (setlist, songs index, song detail).
 * Typography and spacing are driven by `.wl-home-v2-archive-crumbs-shell` in `wl-home-v2.css`.
 */
export function WlHomeV2ArchiveCrumbsShell({
  variant,
  bottomSpacing = variant === "page-gutter",
  className,
  selectorsAriaLabel,
  trail,
  selectors,
}: WlHomeV2ArchiveCrumbsShellProps) {
  return (
    <div
      className={cn(
        "wl-home-v2-archive-crumbs-shell",
        variant === "rail" && "wl-home-v2-archive-crumbs-shell--rail",
        variant === "page-gutter" &&
          "wl-home-v2-archive-crumbs-shell--page-gutter",
        bottomSpacing && "wl-home-v2-archive-crumbs-shell--bottom-spacing",
        className,
      )}
    >
      <div className="wl-home-v2-setlist-crumbs-bar">
        <nav className="wl-home-v2-setlist-crumbs-trail" aria-label="Breadcrumb">
          {trail}
        </nav>
        {selectors ?
          <div
            className="wl-home-v2-setlist-crumbs-selectors"
            {...(selectorsAriaLabel ?
              { "aria-label": selectorsAriaLabel }
            : {})}
          >
            {selectors}
          </div>
        : null}
      </div>
    </div>
  )
}

export type WlHomeV2ArchiveCrumbsTrailProps = {
  items: BreadcrumbItem[]
  /** Primary-click Archives crumb opens hub modal (same as setlist). */
  openArchiveHub?: () => void
  /** Current page segment (e.g. rich song title). Default: `.here` + `item.label`. */
  renderLastCrumb?: (item: BreadcrumbItem, index: number) => ReactNode
}

export function WlHomeV2ArchiveCrumbsTrail({
  items,
  openArchiveHub,
  renderLastCrumb,
}: WlHomeV2ArchiveCrumbsTrailProps) {
  const onArchivesCrumbClick = (e: ReactMouseEvent<HTMLAnchorElement>) => {
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
  }

  if (!items.length) return null

  return (
    <>
      {items.map((item, i) => {
        const isArchivesHub =
          item.href === WL_V2_ARCHIVES_BREADCRUMB_ROOT.href &&
          item.label === WL_V2_ARCHIVES_BREADCRUMB_ROOT.label
        const isLast = i === items.length - 1
        return (
          <Fragment key={`${i}-${item.label}`}>
            {i > 0 ?
              <span className="sep">&gt;</span>
            : null}
            {isLast ?
              <span className="here">
                {renderLastCrumb?.(item, i) ?? item.label}
              </span>
            : isArchivesHub && openArchiveHub ?
              <a href={item.href} onClick={onArchivesCrumbClick}>
                {item.label}
              </a>
            : <a href={item.href}>{item.label}</a>}
          </Fragment>
        )
      })}
    </>
  )
}

/** My Stats (`/archive/profile`) — no session; safe on loading / Suspense fallbacks. */
export const WL_HOME_V2_PROFILE_MY_STATS_CRUMB_ITEMS: BreadcrumbItem[] = [
  WL_V2_ARCHIVES_BREADCRUMB_ROOT,
  { label: "My Stats", href: "/archive/profile?tab=overview" },
]
