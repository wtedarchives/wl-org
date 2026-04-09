"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import {
  FaBluesky,
  FaFacebook,
  FaInstagram,
  FaXTwitter,
} from "react-icons/fa6"
import { ChevronRightIcon, Share2Icon } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { useIsBelowLg } from "@/hooks/use-mobile"
import {
  FOLLOW_US_GROUPS,
  type FollowUsLinkItem,
  type FollowUsNetwork,
} from "@/components/app-sidebar.constants"

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

const PLATFORM_ORDER: readonly FollowUsNetwork[] = [
  "bluesky",
  "x",
  "instagram",
  "facebook",
]

function sortLinksByPlatform(
  links: readonly FollowUsLinkItem[],
  order: readonly FollowUsNetwork[] = PLATFORM_ORDER,
): FollowUsLinkItem[] {
  return [...links].sort(
    (a, b) => order.indexOf(a.network) - order.indexOf(b.network),
  )
}

function FollowUsLinksGrid({
  layout,
  onSelectLink,
}: {
  layout: "popover" | "dialog"
  onSelectLink?: () => void
}) {
  const isPopoverLayout = layout === "popover"
  return (
    <div
      className={cn(
        "grid gap-0",
        isPopoverLayout
          ? "grid-cols-1 sm:grid-cols-3 sm:divide-x sm:divide-border"
          : "grid-cols-1",
      )}
    >
      {FOLLOW_US_GROUPS.map((group) => (
        <section
          key={group.id}
          className={cn(
            "flex flex-col",
            isPopoverLayout
              ? "p-3 first:pt-3 last:pb-3 sm:p-4"
              : "border-b border-border py-3 last:border-b-0 last:pb-0",
          )}
        >
          <div className="flex items-center gap-2 pb-3">
            <Image
              src={group.brandSrc}
              alt=""
              width={24}
              height={24}
              className="size-6 shrink-0 object-contain"
            />
            <h3 className="text-sm font-semibold leading-tight text-foreground">
              {group.title}
            </h3>
          </div>
          <ul className="flex flex-col gap-0.5">
            {sortLinksByPlatform(
              group.links,
              group.platformOrder ?? PLATFORM_ORDER,
            ).map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onSelectLink?.()}
                  className={cn(
                    "flex items-center gap-2 rounded-md py-2 text-xs leading-snug transition-colors",
                    isPopoverLayout ? "px-1" : "px-6",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  )}
                >
                  <FollowUsPlatformIcon network={item.network} />
                  <span className="min-w-0 flex-1">{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

export function AppSidebarFollowUs() {
  const { state, isMobile } = useSidebar()
  const followUsDialog = useIsBelowLg()
  const collapsed = state === "collapsed" && !isMobile
  const [mobileFollowOpen, setMobileFollowOpen] = useState(false)

  useEffect(() => {
    if (!followUsDialog) setMobileFollowOpen(false)
  }, [followUsDialog])

  const triggerButton = (
    <>
      <Share2Icon className="size-4" aria-hidden />
      <span>Follow Us</span>
      <ChevronRightIcon
        className="ml-auto size-4 shrink-0 opacity-70"
        aria-hidden
      />
    </>
  )

  return (
    <SidebarMenuItem>
      {followUsDialog ? (
        <>
          <SidebarMenuButton
            type="button"
            onClick={() => setMobileFollowOpen(true)}
            aria-expanded={mobileFollowOpen}
            aria-haspopup="dialog"
            className={cn(
              mobileFollowOpen && "bg-sidebar-accent",
            )}
          >
            {triggerButton}
          </SidebarMenuButton>
          <Dialog open={mobileFollowOpen} onOpenChange={setMobileFollowOpen}>
            <DialogContent
              overlayClassName="z-[60]"
              className={cn(
                "z-[60] flex max-h-[min(90vh,36rem)] w-[calc(100vw-1.5rem)] max-w-md flex-col gap-0 overflow-hidden p-0 sm:max-w-md",
                "duration-200 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-open:ease-out",
                "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:ease-out",
              )}
              showCloseButton
            >
              <DialogHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
                <DialogTitle>Follow us</DialogTitle>
              </DialogHeader>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
                <FollowUsLinksGrid
                  layout="dialog"
                  onSelectLink={() => setMobileFollowOpen(false)}
                />
              </div>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <Popover>
          <PopoverTrigger asChild>
            <SidebarMenuButton
              type="button"
              className="data-[state=open]:bg-sidebar-accent"
              title={collapsed ? "Follow us" : undefined}
            >
              {triggerButton}
            </SidebarMenuButton>
          </PopoverTrigger>
          <PopoverContent
            side="right"
            align="start"
            sideOffset={8}
            className="w-[min(calc(100vw-1rem),38rem)] p-0"
          >
            <FollowUsLinksGrid layout="popover" />
          </PopoverContent>
        </Popover>
      )}
    </SidebarMenuItem>
  )
}
