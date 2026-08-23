"use client"

import { useEffect } from "react"

import { IosRadioBar } from "@/components/wted/ios-radio/ios-radio-bar"
import {
  IosRadioPlayerProvider,
  useIosRadioPlayerContext,
} from "@/components/wted/ios-radio/ios-radio-player-context"
import {
  getPublicSetlistArchiveUrl,
  IOS_RADIO_EMBED_SETLIST_SOURCE,
  IOS_RADIO_EMBED_SETLIST_TYPE,
} from "@/lib/ios-radio-embed-setlist"

import "./ios-radio-embed.css"

/**
 * Tell the parent `<wl-header>` the current setlist URL so the title click
 * lives on the Discourse page (first-party), not inside this iframe.
 */
function EmbedSetlistBridge() {
  const player = useIosRadioPlayerContext()

  useEffect(() => {
    if (typeof window === "undefined" || window.parent === window) return
    const url =
      player.setlistShowId ?
        getPublicSetlistArchiveUrl(player.setlistShowId)
      : null
    try {
      window.parent.postMessage(
        {
          source: IOS_RADIO_EMBED_SETLIST_SOURCE,
          type: IOS_RADIO_EMBED_SETLIST_TYPE,
          url,
          title: player.displayTitle || null,
        },
        "*",
      )
    } catch {
      // parent gone / sandboxed
    }
  }, [player.setlistShowId, player.displayTitle])

  return null
}

/** Exact header bar, for the Community `<wl-header>` iframe only. */
export function IosRadioEmbed() {
  return (
    <div className="ios-radio-embed">
      <IosRadioPlayerProvider>
        <EmbedSetlistBridge />
        <IosRadioBar openSetlistInNewWindow />
      </IosRadioPlayerProvider>
    </div>
  )
}
