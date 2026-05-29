"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

import { SETLIST_ARCHIVE_SUB } from "@/components/app-sidebar.constants"
import { WlHomeV2ArchiveYearsSelector } from "@/components/wl-home-v2/wl-home-v2-archive-years-selector"
import { archiveV2NavHref } from "@/lib/archive-v2-nav-href"
import { cn } from "@/lib/utils"

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
  if (
    v2Href === "/archive/venues" &&
    (base === "/archive/venue" || base === "/old/archive/venue")
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

  return (
    <nav
      className={cn("wl-home-v2-archive-subnav", className)}
      aria-label="Archive sections"
    >
      <WlHomeV2ArchiveYearsSelector onNavigate={onNavigate} />
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

  if (
    pathname == null ||
    !(pathname === "/archive" ||
      pathname.startsWith("/archive/") ||
      pathname === "/user")
  ) {
    return null
  }

  return (
    <WlHomeV2ArchiveSubnavContent className="max-md:hidden" />
  )
}
