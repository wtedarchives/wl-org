"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { useSetlistBreadcrumb } from "@/components/setlist-breadcrumb-context"
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
import { MenuIcon, MoreHorizontalIcon, PanelLeftIcon } from "lucide-react"
import {
  useIsDesktopContentLayout,
  useIsMobile,
} from "@/hooks/use-mobile"

const SEGMENT_LABELS: Record<string, string> = {
  dpro: "Setlist Archive",
  years: "Years",
  wted: "WTED Radio",
  forum: "Community Forum",
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

/** Override breadcrumb label for specific full paths (e.g. wted/info, wted/gorps). */
const PATH_LABELS: Record<string, string> = {
  "wted/info": "WTED Info",
  "wted/gorps": "GORPs and Contributors",
  "wted/shows": "Shows and More",
  "wted/about": "About Us and FAQ",
  support: "Support Wysteria Lane",
  archive: "Setlist Archive",
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
  if (!pathname || pathname === "/") {
    return [{ label: "Welcome to Wysteria Lane", href: "/" }]
  }
  const segments = pathname.split("/").filter(Boolean)
  // Standalone pages: breadcrumb is just the page name (no Home in trail).
  if (segments.length === 1 && (segments[0] === "forum" || segments[0] === "goose101")) {
    const label =
      segments[0] === "forum"
        ? (SEGMENT_LABELS.forum ?? "Community Forum")
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
    items.push({ label, href })
  }
  return items
}

export function SiteHeader({ breadcrumbOverride }: { breadcrumbOverride?: string } = {}) {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const isDesktopContent = useIsDesktopContentLayout()
  const { toggleSidebar } = useSidebar()
  const { yearLabel } = useYearBreadcrumb()
  const { setlistBreadcrumbs } = useSetlistBreadcrumb()
  const useYearOverride =
    (pathname ?? "").startsWith("/archive/years/") && yearLabel != null
  const useProfileTrail = (pathname ?? "").startsWith("/archive/profile")
  const useSetlistTrail =
    ((pathname ?? "").startsWith("/archive/setlist/") ||
      (pathname ?? "").startsWith("/archive/setlistgame/") ||
      (pathname ?? "").startsWith("/archive/tours/") ||
      (pathname ?? "").startsWith("/archive/song/") ||
      (pathname ?? "").startsWith("/archive/personnel/") ||
      (pathname ?? "").startsWith("/archive/venue/") ||
      (pathname ?? "").startsWith("/archive/lists/")) &&
    setlistBreadcrumbs != null &&
    setlistBreadcrumbs.length > 0
  const breadcrumbs = breadcrumbOverride
    ? [{ label: breadcrumbOverride, href: "" }]
    : useProfileTrail
      ? [
          { label: "Home", href: "/" },
          { label: "Profile", href: "/archive/profile/overview" },
        ]
      : useSetlistTrail
      ? setlistBreadcrumbs
      : pathnameToBreadcrumbs(pathname ?? "", useYearOverride ? yearLabel : undefined)

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center justify-between gap-1 px-4 lg:gap-2 lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-1 lg:gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            data-sidebar="trigger"
            data-slot="sidebar-trigger"
            className="-ml-1"
            onClick={() => toggleSidebar()}
            aria-label="Toggle Sidebar"
          >
            {isMobile ? (
              <MenuIcon className="size-4" />
            ) : (
              <PanelLeftIcon className="size-4" />
            )}
          </Button>
          <Breadcrumb className="min-w-0 flex-1 overflow-hidden">
            <BreadcrumbList className="flex-nowrap gap-1.5 text-muted-foreground">
              <BreadcrumbItem className="shrink-0">
                <BreadcrumbLink asChild>
                  <Link href="/" className="flex items-center pl-1.5">
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
                        {breadcrumbs.slice(0, -1).map((item) => (
                          <DropdownMenuItem key={item.href} asChild>
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
                  <span key={item.href} className="contents">
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
