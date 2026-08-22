"use client"

import { IosRadioBar } from "@/components/wted/ios-radio/ios-radio-bar"
import { IosRadioPlayerProvider } from "@/components/wted/ios-radio/ios-radio-player-context"

import "./ios-radio-embed.css"

/** Exact header bar, for the Community `<wl-header>` iframe only. */
export function IosRadioEmbed() {
  return (
    <div className="ios-radio-embed">
      <IosRadioPlayerProvider>
        <IosRadioBar openSetlistInNewWindow />
      </IosRadioPlayerProvider>
    </div>
  )
}
