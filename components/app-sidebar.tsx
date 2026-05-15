"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
import { RadioSidebarSlot } from "@/components/persistent-radio"
import { useIsBelowXl } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { AppSidebarNavItems } from "./app-sidebar-nav-items"
import { AppSidebarFollowUs } from "./app-sidebar-follow-us"
import { AppSidebarLinksMerchMedia } from "./app-sidebar-links-merch-media"
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { session } = useAuth()
  const { isAdmin } = useAdminStatus(session)
  const openBugCount = useBugCount()
  const [findDialogOpen, setFindDialogOpen] = useState(false)

  const isBelowXl = useIsBelowXl()

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/" className="flex min-w-0 items-center gap-2">
                <Image
                  src="/WL.png"
                  alt=""
                  width={20}
                  height={20}
                  className="size-5 shrink-0 object-contain"
                />
                <span className="min-w-0 truncate text-base font-semibold">
                  Wysteria Lane
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      {!isBelowXl && (
        <div
          className={cn(
            "w-full shrink-0 border-b border-sidebar-border px-2 py-2",
            pathname === "/" && "hidden",
          )}
        >
          <RadioSidebarSlot />
        </div>
      )}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <AppSidebarNavItems
              isAdmin={isAdmin}
              openBugCount={openBugCount}
              onFindClick={() => setFindDialogOpen(true)}
            />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <AppSidebarLinksMerchMedia />
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/support">
                    <CircleDollarSignIcon className="size-4" />
                    <span>Support</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <AppSidebarFollowUs />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="bg-wl-orange py-2 rounded-md mx-2 my-2">
        <NavUser
          onAdminFindClick={
            isAdmin ? () => setFindDialogOpen(true) : undefined
          }
          openBugCount={openBugCount}
        />
      </SidebarFooter>
      {isAdmin && (
        <FindDialog open={findDialogOpen} onOpenChange={setFindDialogOpen} />
      )}
    </Sidebar>
  )
}
