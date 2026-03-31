"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  FaBluesky,
  FaFacebook,
  FaInstagram,
  FaXTwitter,
} from "react-icons/fa6"
import {
  ChevronDownIcon,
  CircleDollarSignIcon,
  Share2Icon,
} from "lucide-react"

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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { RadioSidebarSlot } from "@/components/persistent-radio"
import { useIsBelowXl } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { AppSidebarNavItems } from "./app-sidebar-nav-items"
import {
  FOLLOW_US_LINKS,
  SETLIST_ARCHIVE_SUB,
  type FollowUsNetwork,
} from "./app-sidebar.constants"

function FollowUsPlatformIcon({ network }: { network: FollowUsNetwork }) {
  const iconClass = "size-4 shrink-0"
  switch (network) {
    case "bluesky":
      return <FaBluesky className={iconClass} aria-hidden />
    case "instagram":
      return <FaInstagram className={iconClass} aria-hidden />
    case "facebook":
      return <FaFacebook className={iconClass} aria-hidden />
    case "x":
      return <FaXTwitter className={iconClass} aria-hidden />
  }
}

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
  const [wtedOpen, setWtedOpen] = useState(isWtedPath)
  const [setlistOpen, setSetlistOpen] = useState(isSetlistPath)
  const [linksOpen, setLinksOpen] = useState(false)
  const [merchOpen, setMerchOpen] = useState(false)
  const [publicationsOpen, setPublicationsOpen] = useState(false)
  const [followUsOpen, setFollowUsOpen] = useState(false)
  const isBelowXl = useIsBelowXl()

  useEffect(() => {
    if (isWtedPath) setWtedOpen(true)
  }, [pathname, isWtedPath])
  useEffect(() => {
    if (isSetlistPath) setSetlistOpen(true)
  }, [pathname, isSetlistPath])

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
              wtedOpen={wtedOpen}
              setWtedOpen={setWtedOpen}
              linksOpen={linksOpen}
              setLinksOpen={setLinksOpen}
              merchOpen={merchOpen}
              setMerchOpen={setMerchOpen}
              publicationsOpen={publicationsOpen}
              setPublicationsOpen={setPublicationsOpen}
              setlistOpen={setlistOpen}
              setSetlistOpen={setSetlistOpen}
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
                <SidebarMenuButton asChild>
                  <Link href="/support">
                    <CircleDollarSignIcon className="size-4" />
                    <span>Support</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem
                className="group/item"
                data-open={followUsOpen || undefined}
              >
                <SidebarMenuButton
                  type="button"
                  className="group-data-[state=open]:bg-sidebar-accent"
                  onClick={() => setFollowUsOpen((o) => !o)}
                >
                  <Share2Icon className="size-4" aria-hidden />
                  <span>Follow Us</span>
                  <ChevronDownIcon
                    className={`ml-auto size-4 shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none ${followUsOpen ? "rotate-180" : ""}`}
                  />
                </SidebarMenuButton>
                {followUsOpen && (
                  <SidebarMenuSub>
                    {FOLLOW_US_LINKS.map((item) => (
                      <SidebarMenuSubItem key={item.href}>
                        <SidebarMenuSubButton asChild>
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex min-w-0 items-center gap-2"
                          >
                            <Image
                              src={item.brandSrc}
                              alt=""
                              width={16}
                              height={16}
                              className="size-4 shrink-0 object-contain"
                            />
                            <FollowUsPlatformIcon network={item.network} />
                            <span className="min-w-0 flex-1 text-left leading-snug">
                              {item.label}
                            </span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
