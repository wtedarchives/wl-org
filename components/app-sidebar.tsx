"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"

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
  { title: "Support WTED", url: "/wted/support" },
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

const navMainItems = [
  { title: "Community Forum", url: "/forum", icon: <MessageSquareIcon className="size-4" /> },
  { title: "Goose 101", url: "/goose101", icon: <BookOpenIcon className="size-4" /> },
  { title: "Links", url: "/links", icon: <LinkIcon className="size-4" /> },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [wtedOpen, setWtedOpen] = useState(false)
  const [setlistOpen, setSetlistOpen] = useState(false)

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
                  className="group-data-[state=open]:bg-sidebar-accent"
                  onClick={() => setWtedOpen((o) => !o)}
                >
                  <Image
                    src="/WTED2.png"
                    alt=""
                    width={24}
                    height={24}
                    className="w-4 h-auto object-contain"
                  />
                  <span>WTED Radio</span>
                  <ChevronDownIcon
                    className={`ml-auto size-4 transition-transform ${wtedOpen ? "rotate-180" : ""}`}
                  />
                </SidebarMenuButton>
                {wtedOpen && (
                  <SidebarMenuSub>
                    {WTED_RADIO_SUB.map((item) => (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton asChild>
                          <Link href={item.url}>{item.title}</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
              {navMainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton tooltip={item.title} asChild>
                    <Link href={item.url}>
                      {item.icon}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
                        <SidebarMenuSubButton asChild>
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
                    <a
                      href="https://www.paypal.com/donate/?hosted_button_id=RGT26R3CG44YJ"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <CircleDollarSignIcon className="size-4" />
                      <span>Support</span>
                    </a>
                  </SidebarMenuButton>
                  <SidebarMenuButton asChild className="flex-1">
                    <a
                      href="https://x.com/dripfieldpro"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      <span>@dripfieldpro</span>
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
