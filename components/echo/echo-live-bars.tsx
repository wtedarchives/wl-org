"use client"

import type { CSSProperties } from "react"

import { SongDisplayName } from "@/components/dpro/song-display-name"
import { echoTourSurfaceBgStyle } from "@/lib/echo-tour-surface-bg"
import { cn } from "@/lib/utils"

import type { EchoLiveBar } from "./echo-live-data"

export function EchoLiveBars({
  title,
  items,
  variant,
  empty,
  loading,
}: {
  title: string
  items: EchoLiveBar[]
  variant: "accent" | "sage"
  empty: string
  loading?: boolean
}) {
  return (
    <div className="echo-live-card" style={echoTourSurfaceBgStyle(title)}>
      <div
        className={cn(
          "echo-tour-kicker echo-live-card-kicker",
          variant === "sage" && "is-sage",
        )}
      >
        {title}
      </div>
      {loading && items.length === 0 ?
        <p className="echo-live-empty">Loading…</p>
      : items.length === 0 ?
        <p className="echo-live-empty">{empty}</p>
      : <div className="echo-live-bars">
          {items.map((item) => (
            <div key={item.song} className="echo-live-bar-row">
              <div className="echo-live-bar-meta">
                <span className="echo-live-bar-name">
                  <SongDisplayName
                    song={item.song}
                    songDisplayName={item.displayName}
                    compactInline
                    underlineOnHover={false}
                  />
                </span>
                <span className="echo-live-bar-count">{item.count}</span>
              </div>
              <div className="echo-live-bar-track">
                <div
                  className={cn(
                    "echo-live-bar-fill",
                    variant === "sage" && "is-sage",
                  )}
                  style={{ "--echo-bar": item.width } as CSSProperties}
                />
              </div>
            </div>
          ))}
        </div>}
    </div>
  )
}
