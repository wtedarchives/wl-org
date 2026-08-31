"use client"

import { cn } from "@/lib/utils"
import type { EchoNavId } from "./echo-tour-data"

const NAV_ITEMS: { id: EchoNavId; label: string }[] = [
  { id: "tour", label: "Tour" },
  { id: "show", label: "Live show" },
  { id: "tours", label: "Past tours" },
  { id: "profile", label: "Profile" },
]

export function EchoTourNav({
  active,
  onNavigate,
}: {
  active: EchoNavId
  onNavigate: (id: EchoNavId) => void
}) {
  return (
    <div className="echo-tour-bar">
      <div className="echo-tour-brand">
        <span className="echo-tour-brand-name">Echo of a Show</span>
      </div>
      <div className="echo-tour-nav" role="tablist" aria-label="Echo of a Show">
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === active
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={cn("echo-tour-nav-btn", isActive && "is-active")}
              onClick={() => onNavigate(item.id)}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
