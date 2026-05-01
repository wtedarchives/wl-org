"use client"

import Image from "next/image"
import {
  FaBluesky,
  FaFacebook,
  FaInstagram,
  FaXTwitter,
} from "react-icons/fa6"

import {
  FOLLOW_US_GROUPS,
  type FollowUsLinkItem,
  type FollowUsNetwork,
} from "@/components/app-sidebar.constants"
import { cn } from "@/lib/utils"

function FollowUsPlatformIcon({
  network,
  wlModal,
  tile,
}: {
  network: FollowUsNetwork
  wlModal?: boolean
  /** Archive-style modal tiles: 22px to match hub icons. */
  tile?: boolean
}) {
  const iconClass = cn(
    "shrink-0",
    tile ? "size-[22px]" : "size-4",
    wlModal && !tile && "text-[var(--wl-light-orange)]",
  )
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

export type FollowUsLinksGridLayout = "popover" | "dialog" | "wl-modal"

export function FollowUsLinksGrid({
  layout,
  onSelectLink,
}: {
  layout: FollowUsLinksGridLayout
  onSelectLink?: () => void
}) {
  const isPopover = layout === "popover"
  const isDialog = layout === "dialog"

  if (layout === "wl-modal") {
    return (
      <div className="modal-follow-us-stack">
        {FOLLOW_US_GROUPS.map((group) => (
          <section
            key={group.id}
            className="modal-follow-us-group"
            aria-label={group.title}
          >
            <div className="modal-follow-us-group-head">
              <Image
                src={group.brandSrc}
                alt=""
                width={24}
                height={24}
                className="modal-follow-us-group-logo shrink-0 object-contain"
              />
              <h4 className="modal-follow-us-group-heading">{group.title}</h4>
            </div>
            <div className="modal-follow-us-group-tiles">
              {sortLinksByPlatform(
                group.links,
                group.platformOrder ?? PLATFORM_ORDER,
              ).map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-archive-tile"
                  onClick={() => onSelectLink?.()}
                >
                  <span className="modal-archive-tile-top">
                    <span className="modal-archive-tile-title">
                      {item.label}
                    </span>
                    <span className="modal-archive-tile-icon">
                      <FollowUsPlatformIcon network={item.network} tile />
                    </span>
                  </span>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "grid gap-0",
        isPopover && "grid-cols-1 sm:grid-cols-3 sm:divide-x sm:divide-border",
        isDialog && "grid-cols-1",
      )}
    >
      {FOLLOW_US_GROUPS.map((group) => (
        <section
          key={group.id}
          className={cn(
            "flex flex-col",
            isPopover && "p-3 first:pt-3 last:pb-3 sm:p-4",
            isDialog &&
              "border-b border-border py-3 last:border-b-0 last:pb-0",
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
            <h3
              className={cn(
                "text-sm font-semibold leading-tight",
                "text-foreground",
              )}
            >
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
                    "flex items-center gap-2 rounded-md py-2 text-xs leading-snug transition-colors duration-200 ease-out",
                    isPopover && "px-1",
                    isDialog && "px-6",
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
