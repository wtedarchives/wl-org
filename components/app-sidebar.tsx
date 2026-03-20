"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { FaBluesky } from "react-icons/fa6"
import { CircleDollarSignIcon } from "lucide-react"

import { NavUser } from "@/components/nav-user"
import { useAuth } from "@/components/auth-context"
import { useAdminStatus } from "@/hooks/use-admin-status"
import { useBugCount } from "@/hooks/use-bug-count"
import { FindDialog } from "@/components/dpro/admin/find-dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { RadioEmbed } from "@/components/radio-embed"
import { useIsMobile } from "@/hooks/use-mobile"
import { AppSidebarNavItems } from "./app-sidebar-nav-items"
import { SETLIST_ARCHIVE_SUB } from "./app-sidebar.constants"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { isAdmin } = useAdminStatus(user)
  const openBugCount = useBugCount()
  const [findDialogOpen, setFindDialogOpen] = useState(false)

  const isWtedPath = pathname.startsWith("/wted")
  const isSetlistPath =
    pathname.startsWith("/archive") ||
    SETLIST_ARCHIVE_SUB.some(
      (item) => pathname === item.url || pathname.startsWith(item.url + "/")
    )
  const isAdminPath =
    pathname.startsWith("/archive/admin") ||
    pathname.startsWith("/archive/bugs")

  const [wtedOpen, setWtedOpen] = useState(isWtedPath)
  const [setlistOpen, setSetlistOpen] = useState(isSetlistPath)
  const [linksOpen, setLinksOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(isAdminPath)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (isWtedPath) setWtedOpen(true)
  }, [pathname, isWtedPath])
  useEffect(() => {
    if (isSetlistPath) setSetlistOpen(true)
  }, [pathname, isSetlistPath])
  useEffect(() => {
    if (isAdminPath) setAdminOpen(true)
  }, [pathname, isAdminPath])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/WL.png"
                  alt=""
                  width={20}
                  height={20}
                  className="size-5 object-contain"
                />
                <span className="min-w-[7rem] text-base font-semibold">
                  Wysteria Lane
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <AppSidebarNavItems
              wtedOpen={wtedOpen}
              setWtedOpen={setWtedOpen}
              linksOpen={linksOpen}
              setLinksOpen={setLinksOpen}
              setlistOpen={setlistOpen}
              setSetlistOpen={setSetlistOpen}
              adminOpen={adminOpen}
              setAdminOpen={setAdminOpen}
              isAdmin={isAdmin}
              openBugCount={openBugCount}
              onFindClick={() => setFindDialogOpen(true)}
            />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="flex gap-1 px-2 py-1">
                  <SidebarMenuButton asChild className="flex-1">
                    <Link href="/support">
                      <CircleDollarSignIcon className="size-4" />
                      <span>Support</span>
                    </Link>
                  </SidebarMenuButton>
                  <SidebarMenuButton asChild className="flex-1">
                    <a
                      href="https://bsky.app/profile/wysterialane.org"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FaBluesky className="size-4" />
                      <span>Follow Us</span>
                    </a>
                  </SidebarMenuButton>
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {!isMobile && (
          <div className="w-full border-t border-sidebar-border px-2 py-2">
            <RadioEmbed />
          </div>
        )}
      </SidebarContent>
      <SidebarFooter className="pt-0 pb-2">
        <NavUser />
      </SidebarFooter>
      {isAdmin && (
        <FindDialog open={findDialogOpen} onOpenChange={setFindDialogOpen} />
      )}
    </Sidebar>
  )
}
