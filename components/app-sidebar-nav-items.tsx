"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ExternalLinkIcon, MessageCircle, Settings2Icon } from "lucide-react"
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
  COMMUNITY_FORUM_SUB,
  navMainItems,
  ADMIN_SUB,
} from "./app-sidebar.constants"
interface AppSidebarNavItemsProps {
  isAdmin: boolean
  openBugCount: number | null
  onFindClick: () => void
}

function isWtedSubItemActive(pathname: string, url: (typeof WTED_RADIO_SUB)[number]["url"]) {
  if (pathname === url) return true
  if (
    url === "/wted/program-director" &&
    (pathname === "/wted/episode" || pathname === "/old/wted/episode")
  ) {
    return true
  }
  return false
}

export function AppSidebarNavItems({
  isAdmin,
  openBugCount,
  onFindClick,
}: AppSidebarNavItemsProps) {
  const pathname = usePathname()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip="WTED Radio"
          isActive={pathname.startsWith("/wted")}
          asChild
        >
          <Link href="/wted/program-director" className="flex min-w-0 items-center gap-2">
            <Image
              src="/WTED3.png"
              alt=""
              width={24}
              height={24}
              className="w-4 h-auto object-contain"
            />
            <span>WTED Radio</span>
          </Link>
        </SidebarMenuButton>
        <SidebarMenuSub>
          {WTED_RADIO_SUB.map((item) => (
            <SidebarMenuSubItem key={item.title}>
              <SidebarMenuSubButton
                asChild
                isActive={isWtedSubItemActive(pathname, item.url)}
              >
                <Link href={item.url}>{item.title}</Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton tooltip="Wysteria Lane Community" asChild>
          <a
            href="https://community.wysterialane.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-0 items-center gap-2"
          >
            <Image
              src="/WL.png"
              alt=""
              width={16}
              height={16}
              className="size-4 shrink-0 object-contain"
            />
            <span className="min-w-0 flex-1">Wysteria Lane Community</span>
            <ExternalLinkIcon className="size-4 shrink-0" aria-hidden />
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
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip="WTED Archives"
          isActive={
            pathname.startsWith("/archive") ||
            pathname.startsWith("/old/archive") ||
            pathname === "/goose101" ||
            pathname === "/old/goose101"
          }
          asChild
        >
          <Link href="/archive" className="flex min-w-0 items-center gap-2">
            <Image
              src="/wted-sa-cropped-2.png"
              alt=""
              width={16}
              height={16}
              className="size-4 shrink-0 object-contain"
            />
            <span>WTED Archives</span>
          </Link>
        </SidebarMenuButton>
        <SidebarMenuSub className="grid grid-cols-2">
            {NAV_YEARS.length > 0 && (
              <SidebarMenuSubItem className="col-span-2">
                <div className="text-[0.625rem] font-medium text-sidebar-foreground pl-2">
                  <div className="flex flex-wrap items-center gap-1 pb-2">
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
              </SidebarMenuSubItem>
            )}
            {NAV_YEARS.length > 0 && (
              <SidebarMenuSubItem className="col-span-2" aria-hidden>
                <div className="-mx-2.5 border-t border-sidebar-border pb-1" />
              </SidebarMenuSubItem>
            )}
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
          <SidebarMenuSub className="grid grid-cols-2">
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
