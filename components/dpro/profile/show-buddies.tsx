"use client"

import Link from "next/link"

import { WlWidgetPanelLoading } from "@/components/dpro/wl-widget-panel-loading"
import { useShowBuddies } from "@/hooks/use-show-buddies"
import { getUserProfileUrl } from "@/lib/user-profile-url"
import { cn } from "@/lib/utils"

import "./show-buddies.css"

type ShowBuddiesProps = {
  userId: string | null
  isOwnProfile: boolean
  username?: string | null
  refetchKey?: number
}

function ShowBuddiesHeader() {
  return (
    <div className="wp-head wl-home-v2-years-shows-wp-head wl-home-v2-profile-show-buddies__head">
      <span className="min-w-0 truncate">Show Buddies</span>
      <span className="wl-home-v2-profile-show-buddies__disclaimer">
        2+ shows shared
      </span>
    </div>
  )
}

export function ShowBuddies({
  userId,
  isOwnProfile,
  username = null,
  refetchKey = 0,
}: ShowBuddiesProps) {
  const { buddies, loading, error } = useShowBuddies(userId, refetchKey)
  const listedBuddies = buddies.filter((b) => b.sharedShowCount > 1)

  const panelPadClass = isOwnProfile
    ? "wl-home-v2-profile-shows-panel--own"
    : "wl-home-v2-profile-shows-panel--public"

  const emptyMsg = isOwnProfile
    ? "No show buddies with 2+ shared shows yet."
    : username
      ? `${username} doesn't have any show buddies with 2+ shared shows yet.`
      : "No show buddies with 2+ shared shows yet."

  if (loading) {
    return (
      <WlWidgetPanelLoading
        message={
          isOwnProfile ?
            "Loading show buddies…"
          : `Loading ${username ? `${username}'s` : "their"} show buddies…`
        }
      />
    )
  }

  if (!userId) {
    return (
      <div
        className={cn(
          "widget-panel wl-home-v2-profile-show-buddies",
          panelPadClass,
        )}
      >
        <ShowBuddiesHeader />
        <div className="wl-home-v2-profile-show-buddies__body">
          <p className="wl-home-v2-profile-show-buddies__empty">
            Please log in to see show buddies.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "widget-panel wl-home-v2-profile-show-buddies",
        panelPadClass,
      )}
    >
      <ShowBuddiesHeader />
      <div className="wl-home-v2-profile-show-buddies__body">
        {error ?
          <p className="wl-home-v2-profile-show-buddies__empty">{error}</p>
        : listedBuddies.length === 0 ?
          <p className="wl-home-v2-profile-show-buddies__empty">{emptyMsg}</p>
        : <ul className="wl-home-v2-profile-show-buddies__list">
            {listedBuddies.map((buddy) => (
              <li key={buddy.userId} className="wl-home-v2-profile-show-buddies__row">
                <Link
                  href={getUserProfileUrl(buddy.userId)}
                  className="wl-home-v2-profile-show-buddies__user"
                >
                  {buddy.username}
                </Link>
                <span className="wl-home-v2-profile-show-buddies__count">
                  {buddy.sharedShowCount.toLocaleString("en-US")}
                </span>
              </li>
            ))}
          </ul>
        }
      </div>
    </div>
  )
}
