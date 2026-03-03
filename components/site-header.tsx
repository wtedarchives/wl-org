"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"
import { MenuIcon, PanelLeftIcon } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"

const SEGMENT_LABELS: Record<string, string> = {
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
  dashboard: "Dashboard",
}

/** Override breadcrumb label for specific full paths (e.g. wted/info, wted/gorps). */
const PATH_LABELS: Record<string, string> = {
  "wted/info": "WTED Info",
  "wted/gorps": "GORPs and Contributors",
  "wted/shows": "Shows and More",
  "wted/about": "About Us and FAQ",
  support: "Support Wysteria Lane",
}

function pathnameToBreadcrumbs(pathname: string) {
  if (!pathname || pathname === "/") {
    return [{ label: "Home", href: "/" }]
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
  for (const segment of segments) {
    href += `/${segment}`
    pathSoFar.push(segment)
    const pathKey = pathSoFar.join("/")
    const label =
      PATH_LABELS[pathKey] ??
      SEGMENT_LABELS[segment] ??
      segment.charAt(0).toUpperCase() + segment.slice(1)
    items.push({ label, href })
  }
  return items
}

export function SiteHeader({ breadcrumbOverride }: { breadcrumbOverride?: string } = {}) {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const { toggleSidebar } = useSidebar()
  const breadcrumbs = breadcrumbOverride ? [{ label: breadcrumbOverride, href: "" }] : pathnameToBreadcrumbs(pathname ?? "")

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
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb className="flex-1 overflow-hidden">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/" className="flex items-center">
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
              {breadcrumbs.map((item, i) => (
                <span key={item.href} className="contents">
                  {i > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {i === breadcrumbs.length - 1 ? (
                      <BreadcrumbPage className="text-base font-medium">
                        {item.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={item.href}>{item.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </span>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>
    </header>
  )
}
