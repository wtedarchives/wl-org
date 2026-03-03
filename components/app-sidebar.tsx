"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { FaBluesky } from "react-icons/fa6"

import { NavUser } from "@/components/nav-user"
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
  MessageSquareIcon,
  BookOpenIcon,
  LibraryIcon,
  LinkIcon,
  CircleDollarSignIcon,
  ChevronDownIcon,
} from "lucide-react"

const WTED_RADIO_SUB = [
  { title: "WTED Info", url: "/wted/info" },
  { title: "GORPs and Contributors", url: "/wted/gorps" },
  { title: "Shows and More", url: "/wted/shows" },
  { title: "About Us and FAQ", url: "/wted/about" },
] as const

const SETLIST_ARCHIVE_SUB = [
  { title: "Tours", url: "/tours" },
  { title: "Songs", url: "/songs" },
  { title: "Personnel", url: "/personnel" },
  { title: "Venues", url: "/venues" },
  { title: "Discography", url: "/discography" },
  { title: "Lists", url: "/lists" },
  { title: "Setlist Game", url: "/setlistgame" },
  { title: "Submit", url: "/submit" },
] as const

const LINKS = [
  { title: "Goose Website", href: "https://www.goosetheband.com/" },
  { title: "Goose Bandcamp Page", href: "https://goosetheband.bandcamp.com/" },
  { title: "Western Sun Foundation", href: "https://westernsunfoundation.org/" },
  { title: "Cash or Trade", href: "https://cashortrade.org/goose-tickets/" },
  { title: "ElGoose.net", href: "https://elgoose.net/" },
] as const

const navMainItems = [
  { title: "Community Forum", url: "/forum", icon: <MessageSquareIcon className="size-4" /> },
  { title: "Goose 101", url: "/goose101", icon: <BookOpenIcon className="size-4" /> },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const isWtedPath = pathname.startsWith("/wted")
  const isSetlistPath = SETLIST_ARCHIVE_SUB.some(
    (item) => pathname === item.url || pathname.startsWith(item.url + "/")
  )

  const [wtedOpen, setWtedOpen] = useState(isWtedPath)
  const [setlistOpen, setSetlistOpen] = useState(isSetlistPath)
  const [linksOpen, setLinksOpen] = useState(false)

  // Keep the group expanded when the user is viewing a page in that group
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
                  className="size-5 object-contain transition-transform duration-150 hover:scale-105"
                />
                <span className="text-base font-semibold">Wysteria Lane</span>
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
                        src="/WTED2.png"
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
                  className="group-data-[state=open]:bg-sidebar-accent"
                  onClick={() => setSetlistOpen((o) => !o)}
                >
                  <LibraryIcon className="size-4" />
                  <span>Setlist Archive</span>
                  <ChevronDownIcon
                    className={`ml-auto size-4 transition-transform ${setlistOpen ? "rotate-180" : ""}`}
                  />
                </SidebarMenuButton>
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
        <div className="w-full border-t border-sidebar-border px-2 py-2">
          <iframe
            src="https://www.coreyterrell.com/assets/external/radio.html"
            title="WTED Radio"
            className="w-full rounded-md border-0"
            style={{ height: "66px" }}
          />
        </div>
      </SidebarContent>
      <SidebarFooter className="pt-0 pb-2">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
