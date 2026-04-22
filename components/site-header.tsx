"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { usePublicProfileBreadcrumb } from "@/components/public-profile-breadcrumb-context"
import {
  useSetlistBreadcrumb,
  WTED_ARCHIVES_BREADCRUMB_ROOT,
} from "@/components/setlist-breadcrumb-context"
import { useYearBreadcrumb } from "@/components/year-breadcrumb-context"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSidebar } from "@/components/ui/sidebar"
import { MenuIcon, MoreHorizontalIcon } from "lucide-react"
import {
  useIsDesktopContentLayout,
  useIsMobile,
} from "@/hooks/use-mobile"

const SEGMENT_LABELS: Record<string, string> = {
  dpro: WTED_ARCHIVES_BREADCRUMB_ROOT.label,
  years: "Years",
  wted: "WTED Radio",
  forum: "Wysteria Lane Community",
  goose101: "Goose 101",
  links: "Links",
  tours: "Tours",
  songs: "Songs",
  personnel: "Personnel",
  venues: "Venues",
  discography: "Discography",
  lists: "Lists",
  setlistgame: "Setlist Game",
  submit: "Submit",
  login: "Sign In",
  signup: "Create Account",
  "reset-password": "Reset Password",
  "update-password": "Update Password",
  profile: "My Stats",
  settings: "Settings",
  overview: "Overview",
}

/** Override breadcrumb label for specific full paths (e.g. wted/gorps). */
const PATH_LABELS: Record<string, string> = {
  "wted/gorps": "GORPs and Contributors",
  "wted/shows": "Shows and More",
  "wted/about": "About Us and FAQ",
  "wted/program-director": "Program Director",
  support: "Support Wysteria Lane",
  archive: WTED_ARCHIVES_BREADCRUMB_ROOT.label,
}

/** True if segment looks like a UUID (so we show a placeholder instead of raw id in breadcrumbs). */
function isUuidLikeSegment(segment: string): boolean {
  if (!segment || segment.length < 32) return false
  const hexBlock = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return hexBlock.test(segment) || /^[0-9a-f]{32}$/i.test(segment)
}

function pathnameToBreadcrumbs(
  pathname: string,
  lastSegmentLabelOverride?: string | null,
) {
  if (pathname === "/old") {
    return [{ label: "Welcome to Wysteria Lane", href: "/old" }]
  }
  let pathForCrumb = pathname
  let oldArchiveHrefPrefix = false
  if (pathname.startsWith("/old/archive")) {
    oldArchiveHrefPrefix = true
    pathForCrumb = "/archive" + pathname.slice("/old/archive".length)
  }
  if (!pathForCrumb || pathForCrumb === "/") {
    return [{ label: "Welcome to Wysteria Lane", href: "/" }]
  }
  const segments = pathForCrumb.split("/").filter(Boolean)
  // Standalone pages: breadcrumb is just the page name (no Home in trail).
  if (segments.length === 1 && (segments[0] === "forum" || segments[0] === "goose101")) {
    const label =
      segments[0] === "forum"
        ? (SEGMENT_LABELS.forum ?? "Wysteria Lane Community")
        : (SEGMENT_LABELS.goose101 ?? "Goose 101")
    return [{ label, href: `/${segments[0]}` }]
  }

  const items: { label: string; href: string }[] = []
  let href = ""
  const pathSoFar: string[] = []
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    href += `/${segment}`
    pathSoFar.push(segment)
    const pathKey = pathSoFar.join("/")
    const isLastSegment = i === segments.length - 1
    const explicitLabel =
      PATH_LABELS[pathKey] ?? SEGMENT_LABELS[segment]
    const label =
      isLastSegment && lastSegmentLabelOverride != null
        ? lastSegmentLabelOverride
        : explicitLabel ??
          (isUuidLikeSegment(segment) ? "…" : segment.charAt(0).toUpperCase() + segment.slice(1))
    const itemHref =
      segment === "wted" ? "/wted/program-director" : href
    items.push({ label, href: itemHref })
  }
  if (!oldArchiveHrefPrefix) return items
  return items.map((item) => ({
    ...item,
    href:
      item.href.startsWith("/archive") ? `/old${item.href}` : item.href,
  }))
}

export function SiteHeader({ breadcrumbOverride }: { breadcrumbOverride?: string } = {}) {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const isDesktopContent = useIsDesktopContentLayout()
  const { toggleSidebar } = useSidebar()
  const { yearLabel, yearDetailHref } = useYearBreadcrumb()
  const { setlistBreadcrumbs } = useSetlistBreadcrumb()
  const { publicProfileBreadcrumbLabel } = usePublicProfileBreadcrumb()
  const legacyHomeHref = (pathname ?? "").startsWith("/old") ? "/old" : "/"
  const isPublicUserProfilePath = (pathname ?? "").startsWith(
    "/old/archive/user",
  )
  const useYearOverride =
    ((pathname ?? "") === "/old/archive/years" ||
      (pathname ?? "").startsWith("/old/archive/years/")) &&
    yearLabel != null
  const useProfileTrail = (pathname ?? "").startsWith("/old/archive/profile")
  const useSetlistTrail =
    (((pathname ?? "") === "/old/archive/setlist" ||
      (pathname ?? "").startsWith("/old/archive/setlist/") ||
      (pathname ?? "") === "/old/archive/setlistgame" ||
      (pathname ?? "") === "/old/archive/tours" ||
      (pathname ?? "").startsWith("/old/archive/tours/") ||
      (pathname ?? "") === "/old/archive/song" ||
      (pathname ?? "").startsWith("/old/archive/song/") ||
      (pathname ?? "") === "/old/archive/personnel" ||
      (pathname ?? "").startsWith("/old/archive/personnel/") ||
      (pathname ?? "") === "/old/archive/venue" ||
      (pathname ?? "") === "/old/archive/lists" ||
      (pathname ?? "") === "/old/archive/discography" ||
      (pathname ?? "").startsWith("/old/archive/discography/")) ||
      (pathname ?? "") === "/wted/episode") &&
    setlistBreadcrumbs != null &&
    setlistBreadcrumbs.length > 0
  const breadcrumbs = breadcrumbOverride
    ? [{ label: breadcrumbOverride, href: "" }]
    : isPublicUserProfilePath
      ? [
          {
            label: publicProfileBreadcrumbLabel ?? "Profile",
            href: "",
          },
        ]
    : useProfileTrail
      ? [
          { label: "Home", href: legacyHomeHref },
          { label: "Profile", href: "/old/archive/profile/overview" },
        ]
      : useSetlistTrail
      ? setlistBreadcrumbs
      : (() => {
          const trail = pathnameToBreadcrumbs(
            pathname ?? "",
            useYearOverride ? yearLabel : undefined,
          )
          if (
            useYearOverride &&
            yearDetailHref &&
            trail.length > 0
          ) {
            const last = trail.length - 1
            return trail.map((item, i) =>
              i === last ? { ...item, href: yearDetailHref } : item,
            )
          }
          return trail
        })()

  return (
    <header className="flex h-11 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-11">
      <div className="flex w-full items-center justify-between gap-1 px-4 lg:gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 md:gap-1 lg:gap-2">
          {isMobile ?
            <Button
              variant="ghost"
              size="icon-sm"
              data-sidebar="trigger"
              data-slot="sidebar-trigger"
              className="-ml-1"
              onClick={() => toggleSidebar()}
              aria-label="Toggle Sidebar"
            >
              <MenuIcon className="size-4" />
            </Button>
          : null}
          <Breadcrumb className="min-w-0 flex-1 overflow-hidden">
            <BreadcrumbList className="flex-nowrap gap-1.5 text-muted-foreground">
              <BreadcrumbItem className="shrink-0">
                <BreadcrumbLink asChild>
                  <Link href={legacyHomeHref} className="flex items-center">
                    <Image
                      src="/WL.png"
                      alt="Home"
                      width={20}
                      height={20}
                      className="size-5 object-contain transition-transform duration-150 hover:scale-105"
                    />
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              {breadcrumbs.length > 1 && !isDesktopContent ? (
                <>
                  <BreadcrumbItem className="shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label="Show breadcrumb trail"
                        >
                          <MoreHorizontalIcon className="size-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" side="bottom">
                        {breadcrumbs.slice(0, -1).map((item, i) => (
                          <DropdownMenuItem key={`${i}-${item.label}-${item.href}`} asChild>
                            {item.href ? (
                              <Link href={item.href}>{item.label}</Link>
                            ) : (
                              <span>{item.label}</span>
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem className="min-w-0 shrink">
                    <BreadcrumbPage className="block min-w-0 truncate text-base font-medium text-foreground">
                      {breadcrumbs[breadcrumbs.length - 1].label}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              ) : breadcrumbs.length > 1 && isDesktopContent ? (
                breadcrumbs.map((item, i) => (
                  <span key={`${i}-${item.label}-${item.href}`} className="contents">
                    {i > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem className="min-w-0 shrink">
                      {i === breadcrumbs.length - 1 ? (
                        <BreadcrumbPage className="block min-w-0 truncate text-base font-medium text-foreground">
                          {item.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={item.href} className="block min-w-0 truncate">
                            {item.label}
                          </Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </span>
                ))
              ) : breadcrumbs.length === 1 ? (
                <BreadcrumbItem className="min-w-0 shrink">
                  <BreadcrumbPage className="block min-w-0 truncate text-base font-medium text-foreground">
                    {breadcrumbs[0].label}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              ) : null}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>
    </header>
  )
}
