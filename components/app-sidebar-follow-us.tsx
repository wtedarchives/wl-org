"use client"

import { useEffect, useState } from "react"
import { ChevronRightIcon, Share2Icon } from "lucide-react"

import { FollowUsLinksGrid } from "@/components/follow-us-links-grid"
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
