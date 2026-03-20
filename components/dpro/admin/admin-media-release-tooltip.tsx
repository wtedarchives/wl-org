"use client"

import { createPortal } from "react-dom"
import type { ReleaseShow } from "@/types/admin"

interface AdminMediaReleaseTooltipProps {
  release: ReleaseShow | undefined
  position: { x: number; y: number } | null
}

export function AdminMediaReleaseTooltip({
  release,
  position,
}: AdminMediaReleaseTooltipProps) {
  if (!release || !position) return null

  return createPortal(
    <div
      className="pointer-events-none fixed z-[99999] rounded border bg-background px-2 py-1 text-[0.625rem] font-medium shadow-lg"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -100%)",
        marginTop: "-4px",
      }}
    >
      <div className="font-medium">{release.releases?.release_displayname}</div>
      {release.releases?.release_service && (
        <div className="mt-0.5 opacity-75">
          {release.releases.release_service}
        </div>
      )}
    </div>,
    document.body
  )
}
