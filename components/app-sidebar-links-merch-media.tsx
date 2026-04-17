"use client"

import { useEffect, useState, type ReactNode } from "react"
import { LinkIcon, RssIcon, ShoppingCartIcon } from "lucide-react"

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
import { LINKS, MERCH_LINKS, MEDIA_LINKS } from "@/components/app-sidebar.constants"

type LinkItem = { title: string; href: string }

function ExternalLinkList({
  links,
  layout,
  onSelectLink,
}: {
  links: readonly LinkItem[]
  layout: "popover" | "dialog"
  onSelectLink?: () => void
}) {
  const padX = layout === "popover" ? "px-3" : "px-3"
  return (
    <ul className="flex w-max max-w-full flex-col gap-0.5">
      {links.map((item) => (
        <li key={item.href}>
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onSelectLink?.()}
            className={cn(
              "block rounded-md py-1 text-xs leading-snug transition-colors",
              padX,
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            {item.title}
          </a>
        </li>
      ))}
    </ul>
  )
}

function NavLinkColumn({
  title,
  icon,
  links,
}: {
  title: string
  icon: ReactNode
  links: readonly LinkItem[]
}) {
  const { state, isMobile } = useSidebar()
  const useDialog = useIsBelowLg()
  const collapsed = state === "collapsed" && !isMobile
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!useDialog) setMobileOpen(false)
  }, [useDialog])

  const triggerInner = (
    <div className="flex min-w-0 flex-col items-center gap-1">
      <span className="inline-flex shrink-0">{icon}</span>
      <span className="line-clamp-2 w-full text-center text-[10px] font-medium leading-tight">
        {title}
      </span>
    </div>
  )

  return (
    <div className="min-w-0 flex-1">
      {useDialog ? (
        <>
          <SidebarMenuButton
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-expanded={mobileOpen}
            aria-haspopup="dialog"
            className={cn(
              "h-auto min-h-[2.75rem] w-full min-w-0 flex-col gap-1 py-2",
              mobileOpen && "bg-sidebar-accent",
            )}
            title={collapsed ? title : undefined}
          >
            {triggerInner}
          </SidebarMenuButton>
          <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
            <DialogContent
              overlayClassName="z-[60]"
              className={cn(
                "z-[60] flex max-h-[min(90vh,36rem)] w-max max-w-[calc(100vw-1.5rem)] flex-col gap-0 overflow-hidden p-0",
                "duration-200 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-open:ease-out",
                "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:ease-out",
              )}
              showCloseButton
            >
              <DialogHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
                <DialogTitle>{title}</DialogTitle>
              </DialogHeader>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1">
                <ExternalLinkList
                  layout="dialog"
                  links={links}
                  onSelectLink={() => setMobileOpen(false)}
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
              className="h-auto min-h-[2.75rem] w-full min-w-0 flex-col gap-1 py-2 data-[state=open]:bg-sidebar-accent"
              title={collapsed ? title : undefined}
            >
              {triggerInner}
            </SidebarMenuButton>
          </PopoverTrigger>
          <PopoverContent
            side="right"
            align="start"
            sideOffset={8}
            className="w-max max-w-[min(calc(100vw-1rem),100vw)] p-0"
          >
            <div className="py-1">
              <ExternalLinkList layout="popover" links={links} />
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

export function AppSidebarLinksMerchMedia() {
  return (
    <SidebarMenuItem>
      <div className="grid min-w-0 grid-cols-3 gap-1">
        <NavLinkColumn
          title="Links"
          icon={<LinkIcon className="size-4" aria-hidden />}
          links={LINKS}
        />
        <NavLinkColumn
          title="Merch"
          icon={<ShoppingCartIcon className="size-4" aria-hidden />}
          links={MERCH_LINKS}
        />
        <NavLinkColumn
          title="Media"
          icon={<RssIcon className="size-4" aria-hidden />}
          links={MEDIA_LINKS}
        />
      </div>
    </SidebarMenuItem>
  )
}
