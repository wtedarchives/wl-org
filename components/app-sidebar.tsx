"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { FaBluesky } from "react-icons/fa6"
import { Settings2Icon, BugIcon } from "lucide-react"

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
import {
  MessageCircle,
  BookOpenIcon,
  LinkIcon,
  CircleDollarSignIcon,
  ChevronDownIcon,
} from "lucide-react"
import { RadioEmbed } from "@/components/radio-embed"
import { useIsMobile } from "@/hooks/use-mobile"

const WTED_RADIO_SUB = [
  { title: "WTED Info", url: "/wted/info" },
  { title: "GORPs and Contributors", url: "/wted/gorps" },
  { title: "Shows and More", url: "/wted/shows" },
  { title: "About Us and FAQ", url: "/wted/about" },
] as const

const SETLIST_ARCHIVE_SUB = [
  { title: "Tours", url: "/archive/tours" },
  { title: "Songs", url: "/archive/songs" },
  { title: "Stats", url: "/archive/stats" },
  { title: "Personnel", url: "/archive/personnel" },
  { title: "Venues", url: "/archive/venues" },
  { title: "Discography", url: "/archive/discography" },
  { title: "Lists", url: "/archive/lists" },
  { title: "Setlist Game", url: "/archive/setlistgame" },
  { title: "Submit", url: "/archive/submit" },
] as const

/** Hardcoded years for nav; year_id must match Supabase years table (year, year_id). */
const NAV_YEARS = [
  { year: "2012", year_id: "d0a3d0b0-a40f-40f1-9430-712e616ab844" },
  { year: "2013", year_id: "51dc603b-2b18-4c97-8573-1f0c99eae9f1" },
  { year: "2014", year_id: "08778200-4ae7-48f9-b6dc-275842f0a56d" },
  { year: "2015", year_id: "794bb9d6-6483-4cd0-9174-04fa872b4bb0" },
  { year: "2016", year_id: "96b02a0e-1d4d-4baa-9b2e-a8d445ead63b" },
  { year: "2017", year_id: "23989762-c3df-4631-821b-0fb01ee44020" },
  { year: "2018", year_id: "6da8e2f8-14d9-458d-a4ad-7793de2ad94f" },
  { year: "2019", year_id: "d71b7545-574d-4801-808b-fb704e0e80fa" },
  { year: "2020", year_id: "6acf970b-97d4-4d19-a90a-28149e37327c" },
  { year: "2021", year_id: "0e646c0e-3630-413a-b7d5-d52dba1947fe" },
  { year: "2022", year_id: "9f380c88-e925-47c5-a5b0-ac8c18d2be6b" },
  { year: "2023", year_id: "ced3076c-8659-42ce-a2cd-6ca3a871ce10" },
  { year: "2024", year_id: "20765f62-5610-4d2d-b03a-8ddb307577f7" },
  { year: "2025", year_id: "6b13c0c8-3fdc-41bd-996b-f598bd18696e" },
  { year: "2026", year_id: "4ca4a7dd-19c5-45af-ab9b-6f7e20f4b445" },
] as const

const LINKS = [
  { title: "Goose Website", href: "https://www.goosetheband.com/" },
  { title: "Goose Bandcamp Page", href: "https://goosetheband.bandcamp.com/" },
  { title: "Western Sun Foundation", href: "https://westernsunfoundation.org/" },
  { title: "Cash or Trade", href: "https://cashortrade.org/goose-tickets/" },
  { title: "ElGoose.net", href: "https://elgoose.net/" },
] as const

const COMMUNITY_FORUM_SUB = [
  {
    title: "GOOSE(c)",
    url: "https://community.wysterialane.org/chat/c/goosec/14",
    color: "#e04d2f",
  },
  {
    title: "Non-Goose",
    url: "https://community.wysterialane.org/chat/c/ngoosec/56",
    color: "#246151",
  },
  {
    title: "The Couch",
    url: "https://community.wysterialane.org/chat/c/the-couch/3",
    color: "#863523",
  },
] as const

const navMainItems = [
  { title: "Goose 101", url: "/goose101", icon: <BookOpenIcon className="size-4" /> },
] as const

const ADMIN_SUB = [
  { title: "Admin Panel", url: "/archive/admin" },
  { title: "Bugs", url: "/archive/bugs" },
] as const

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
  const isAdminPath = pathname.startsWith("/archive/admin") || pathname.startsWith("/archive/bugs")

  const [wtedOpen, setWtedOpen] = useState(isWtedPath)
  const [setlistOpen, setSetlistOpen] = useState(isSetlistPath)
  const [linksOpen, setLinksOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(isAdminPath)
  const isMobile = useIsMobile()

  // Keep the group expanded when the user is viewing a page in that group
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
      <SidebarHeader className="group/header">
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
                  className="size-5 object-contain transition-transform duration-150 hover:scale-105"
                />
                <span className="relative inline-block min-w-[7rem] text-base font-semibold">
                  <span className="block transition-opacity duration-150 group-hover/header:opacity-0">
                    WTED.org
                  </span>
                  <span className="absolute left-0 top-0 whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover/header:opacity-100">
                    World of TED
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              <SidebarMenuItem
                className="group/item"
                data-open={wtedOpen || undefined}
              >
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
                  <SidebarMenuButton tooltip={item.title} asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      {item.icon}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem
                className="group/item"
                data-open={linksOpen || undefined}
              >
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
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {item.title}
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
              <SidebarMenuItem
                className="group/item"
                data-open={setlistOpen || undefined}
              >
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
                            href={`/archive/years/${year.year_id}`}
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
                    {SETLIST_ARCHIVE_SUB.map((item) => (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton asChild isActive={pathname === item.url}>
                          <Link href={item.url}>{item.title}</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
              {isAdmin && (
                <SidebarMenuItem
                  className="group/item"
                  data-open={adminOpen || undefined}
                >
                  <SidebarMenuButton
                    tooltip="Admin"
                    className="group-data-[state=open]:bg-sidebar-accent"
                    onClick={() => setAdminOpen((o) => !o)}
                  >
                    <Settings2Icon className="size-4" />
                    <span>Admin</span>
                    <ChevronDownIcon
                      className={`ml-auto size-4 transition-transform ${adminOpen ? "rotate-180" : ""}`}
                    />
                  </SidebarMenuButton>
                  {adminOpen && (
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
                        <SidebarMenuSubButton
                          onClick={() => setFindDialogOpen(true)}
                        >
                          Find
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="flex gap-1 px-2 py-1">
                  <SidebarMenuButton asChild className="flex-1">
                    <Link
                      href="/support"
                    >
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
