"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

import {
  NAV_YEARS,
  SETLIST_ARCHIVE_SUB,
} from "@/components/app-sidebar.constants"
import { archiveV2NavHref } from "@/lib/archive-v2-nav-href"
import { cn } from "@/lib/utils"
import { getYearArchiveUrl } from "@/lib/year-archive-url"

function useArchiveSubmitHref(): string {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const params = new URLSearchParams(searchParams.toString())
  params.set("submit", "1")
  const q = params.toString()
  const base = pathname || "/archive"
  return q ? `${base}?${q}` : `${base}?submit=1`
}

function isSectionLinkActive(
  pathname: string | null,
  v2Href: string,
  legacyHref: string,
) {
  const p = pathname ?? ""
  const base = p.split("?")[0] ?? ""
  if (base === v2Href || base === legacyHref) return true
  if (
    v2Href === "/archive/songs" &&
    (base === "/archive/song" || base === "/old/archive/song")
  ) {
    return true
  }
  return false
}

export type WlHomeV2ArchiveSubnavContentProps = {
  className?: string
  /** Close mobile menu after navigation (header drawer). */
  onNavigate?: () => void
}

/** Shared years + section links; use under the header bar or inside the mobile menu. */
export function WlHomeV2ArchiveSubnavContent({
  className,
  onNavigate,
}: WlHomeV2ArchiveSubnavContentProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const submitHref = useArchiveSubmitHref()
  const currentYearId = searchParams.get("id")?.trim() ?? ""

  return (
    <nav
      className={cn("wl-home-v2-archive-subnav", className)}
      aria-label="Archive sections"
    >
      <div className="wl-home-v2-archive-subnav-row wl-home-v2-archive-subnav-row--years">
        {NAV_YEARS.map((year, index) => {
          const href = getYearArchiveUrl(year.year_id)
          const isActive =
            pathname === "/archive/years" && currentYearId === year.year_id
          return (
            <span key={year.year_id} className="wl-home-v2-archive-subnav-year-item">
              {index > 0 ?
                <span className="wl-home-v2-archive-subnav-sep" aria-hidden>
                  •
                </span>
              : null}
              <Link
                href={href}
                className={cn(
                  "wl-home-v2-archive-subnav-link wl-home-v2-archive-subnav-link--year",
                  isActive && "wl-home-v2-archive-subnav-link--active",
                )}
                onClick={onNavigate}
              >
                {year.year}
              </Link>
            </span>
          )
        })}
      </div>
      <div className="wl-home-v2-archive-subnav-row wl-home-v2-archive-subnav-row--sections">
        {SETLIST_ARCHIVE_SUB.map((item) => {
          const isSubmit = item.title === "Submit"
          const legacyHref = item.url
          const v2Href = archiveV2NavHref(legacyHref)
          const href = isSubmit ? submitHref : v2Href
          const isActive =
            isSubmit ?
              searchParams.get("submit") === "1"
            : isSectionLinkActive(pathname, v2Href, legacyHref)
          return (
            <Link
              key={item.title}
              href={href}
              className={cn(
                "wl-home-v2-archive-subnav-pill",
                isActive && "wl-home-v2-archive-subnav-pill--active",
              )}
              onClick={onNavigate}
            >
              {item.title}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export function WlHomeV2ArchiveSubnav() {
  const pathname = usePathname()

  if (pathname == null || !(pathname === "/archive" || pathname.startsWith("/archive/"))) {
    return null
  }

  return (
    <WlHomeV2ArchiveSubnavContent className="max-md:hidden" />
  )
}
