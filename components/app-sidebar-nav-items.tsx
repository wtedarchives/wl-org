"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDownIcon, LinkIcon, MessageCircle, Settings2Icon } from "lucide-react"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { sidebarMenuButtonVariants } from "@/components/ui/sidebar-menu"
import { cn } from "@/lib/utils"
import { getYearArchiveUrl } from "@/lib/year-archive-url"
import {
  WTED_RADIO_SUB,
  SETLIST_ARCHIVE_SUB,
  NAV_YEARS,
  LINKS,
  COMMUNITY_FORUM_SUB,
  navMainItems,
  ADMIN_SUB,
} from "./app-sidebar.constants"

interface AppSidebarNavItemsProps {
  wtedOpen: boolean
  setWtedOpen: (fn: (o: boolean) => boolean) => void
  linksOpen: boolean
  setLinksOpen: (fn: (o: boolean) => boolean) => void
  setlistOpen: boolean
  setSetlistOpen: (fn: (o: boolean) => boolean) => void
  isAdmin: boolean
  openBugCount: number | null
  onFindClick: () => void
}

export function AppSidebarNavItems({
  wtedOpen,
  setWtedOpen,
  linksOpen,
  setLinksOpen,
  setlistOpen,
  setSetlistOpen,
  isAdmin,
  openBugCount,
  onFindClick,
}: AppSidebarNavItemsProps) {
  const pathname = usePathname()

  return (
    <SidebarMenu>
      <SidebarMenuItem className="group/item" data-open={wtedOpen || undefined}>
        <SidebarMenuButton
          tooltip="WTED Radio"
          isActive={pathname === "/wted/info"}
          className="group-data-[state=open]:bg-sidebar-accent data-[slot=sidebar-menu-button]:p-0"
          asChild
        >
          <div className="flex w-full min-w-0 items-center">
            <Link
              href="/wted/info"
              className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5"
            >
              <Image
                src="/WTED3.png"
                alt=""
                width={24}
                height={24}
                className="w-4 h-auto object-contain"
              />
              <span>WTED Radio</span>
            </Link>
            <button
              type="button"
              className="flex shrink-0 items-center justify-center p-2"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setWtedOpen((o) => !o)
              }}
              aria-label="Toggle WTED submenu"
            >
              <ChevronDownIcon
                className={`size-4 transition-transform ${wtedOpen ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </SidebarMenuButton>
        {wtedOpen && (
          <SidebarMenuSub>
            {WTED_RADIO_SUB.map((item) => (
              <SidebarMenuSubItem key={item.title}>
                <SidebarMenuSubButton asChild isActive={pathname === item.url}>
                  <Link href={item.url}>{item.title}</Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        )}
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton tooltip="Community Forum" asChild>
          <a
            href="https://community.wysterialane.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <Image
              src="/WL.png"
              alt=""
              width={16}
              height={16}
              className="size-4 shrink-0 object-contain"
            />
            <span>Community Forum</span>
          </a>
        </SidebarMenuButton>
        <SidebarMenuSub>
          {COMMUNITY_FORUM_SUB.map((item) => (
            <SidebarMenuSubItem key={item.title}>
              <SidebarMenuSubButton asChild>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <MessageCircle
                    className="size-4 shrink-0"
                    fill={item.color}
                    strokeWidth={0}
                  />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </SidebarMenuItem>
      {navMainItems.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            tooltip={item.title}
            asChild
            isActive={pathname === item.url}
          >
            <Link href={item.url}>
              {item.icon}
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
      <SidebarMenuItem className="group/item" data-open={linksOpen || undefined}>
        <SidebarMenuButton
          tooltip="Links"
          className="group-data-[state=open]:bg-sidebar-accent"
          onClick={() => setLinksOpen((o) => !o)}
        >
          <LinkIcon className="size-4" />
          <span>Links</span>
          <ChevronDownIcon
            className={`ml-auto size-4 transition-transform ${linksOpen ? "rotate-180" : ""}`}
          />
        </SidebarMenuButton>
        {linksOpen && (
          <SidebarMenuSub>
            {LINKS.map((item) => (
              <SidebarMenuSubItem key={item.title}>
                <SidebarMenuSubButton asChild>
                  <a href={item.href} target="_blank" rel="noreferrer">
                    {item.title}
                  </a>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        )}
      </SidebarMenuItem>
      <SidebarMenuItem className="group/item" data-open={setlistOpen || undefined}>
        <SidebarMenuButton
          tooltip="Setlist Archive"
          isActive={pathname === "/archive"}
          className="group-data-[state=open]:bg-sidebar-accent data-[slot=sidebar-menu-button]:p-0"
          asChild
        >
          <div className="flex w-full min-w-0 items-center">
            <Link
              href="/archive"
              className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5"
            >
              <Image
                src="/wted-sa-cropped-2.png"
                alt=""
                width={16}
                height={16}
                className="size-4 shrink-0 object-contain"
              />
              <span>Setlist Archive</span>
            </Link>
            <button
              type="button"
              className="flex shrink-0 items-center justify-center p-2"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setSetlistOpen((o) => !o)
              }}
              aria-label="Toggle Setlist Archive submenu"
            >
              <ChevronDownIcon
                className={`size-4 transition-transform ${setlistOpen ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </SidebarMenuButton>
        {setlistOpen && NAV_YEARS.length > 0 && (
          <div className="px-2 pt-1 text-[0.625rem] font-medium text-sidebar-foreground">
            <div className="flex flex-wrap items-center gap-1 pb-1">
              {NAV_YEARS.map((year, index) => (
                <span key={year.year_id} className="flex items-center gap-1">
                  <Link
                    href={getYearArchiveUrl(year.year_id)}
                    className="hover:underline"
                  >
                    {year.year}
                  </Link>
                  {index < NAV_YEARS.length - 1 && (
                    <span className="text-[0.5rem] opacity-70">•</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
        {setlistOpen && (
          <SidebarMenuSub>
            {SETLIST_ARCHIVE_SUB.map((item) => {
              const isSubmit = item.title === "Submit"
              const href = isSubmit
                ? `${pathname || "/"}${(pathname || "/").includes("?") ? "&" : "?"}submit=1`
                : item.url
              return (
                <SidebarMenuSubItem key={item.title}>
                  <SidebarMenuSubButton asChild isActive={pathname === item.url}>
                    <Link href={href}>{item.title}</Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              )
            })}
          </SidebarMenuSub>
        )}
      </SidebarMenuItem>
      {isAdmin && (
        <SidebarMenuItem className="group/item" data-open>
          <div
            data-slot="sidebar-menu-button"
            data-sidebar="menu-button"
            title="Admin"
            className={cn(
              sidebarMenuButtonVariants(),
              "group-data-[state=open]:bg-sidebar-accent cursor-default hover:bg-transparent active:bg-transparent",
            )}
          >
            <Settings2Icon className="size-4" />
            <span>Admin</span>
          </div>
          <SidebarMenuSub>
            {ADMIN_SUB.map((item) => (
              <SidebarMenuSubItem key={item.title}>
                <SidebarMenuSubButton asChild isActive={pathname === item.url}>
                  <Link href={item.url} className="flex items-center gap-2">
                    {item.title}
                    {item.title === "Bugs" &&
                      openBugCount != null &&
                      openBugCount > 0 && (
                        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                          {openBugCount > 99 ? "99+" : openBugCount}
                        </span>
                      )}
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
            <SidebarMenuSubItem>
              <SidebarMenuSubButton onClick={onFindClick}>
                Find
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        </SidebarMenuItem>
      )}
    </SidebarMenu>
  )
}
