"use client"

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
  forum: "Forum",
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

function pathnameToBreadcrumbs(pathname: string) {
  if (!pathname || pathname === "/") {
    return [{ label: "Home", href: "/" }]
  }
  const segments = pathname.split("/").filter(Boolean)
  const items: { label: string; href: string }[] = [{ label: "Home", href: "/" }]
  let href = ""
  for (const segment of segments) {
    href += `/${segment}`
    const label = SEGMENT_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1)
    items.push({ label, href })
  }
  return items
}

export function SiteHeader() {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const { toggleSidebar } = useSidebar()
  const breadcrumbs = pathnameToBreadcrumbs(pathname ?? "")

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
