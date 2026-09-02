"use client"

import Link from "next/link"

import { getEchoArchiveUrl } from "@/lib/echo-archive-url"
import { echoTourSurfaceBgStyle } from "@/lib/echo-tour-surface-bg"
import { cn } from "@/lib/utils"
import type { EchoNavId } from "./echo-tour-data"

const NAV_ITEMS: { id: EchoNavId; label: string }[] = [
  { id: "tour", label: "Tour" },
  { id: "tours", label: "History" },
  { id: "profile", label: "Profile" },
]

export function EchoTourNav({ active }: { active: EchoNavId }) {
  return (
    <div className="echo-tour-bar" style={echoTourSurfaceBgStyle("nav")}>
      <div className="echo-tour-brand">
        <Link href={getEchoArchiveUrl("tour")} className="echo-tour-brand-name" scroll={false}>
          Echo of a Show
        </Link>
      </div>
      <div className="echo-tour-nav" role="tablist" aria-label="Echo of a Show">
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === active
          return (
            <Link
              key={item.id}
              href={getEchoArchiveUrl(item.id)}
              role="tab"
              aria-selected={isActive}
              className={cn("echo-tour-nav-btn", isActive && "is-active")}
              scroll={false}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
