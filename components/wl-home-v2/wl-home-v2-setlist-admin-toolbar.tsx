"use client"

import { LinkSimple, PencilSimple, UploadSimple } from "@phosphor-icons/react"

import { cn } from "@/lib/utils"

export type WlHomeV2SetlistAdminToolbarProps = {
  linkCopied: boolean
  onCopyShowId: () => void
  onEditInAdmin: () => void
}

export function WlHomeV2SetlistAdminToolbar({
  linkCopied,
  onCopyShowId,
  onEditInAdmin,
}: WlHomeV2SetlistAdminToolbarProps) {
  return (
    <div
      className="wl-home-v2-setlist-admin-toolbar"
      role="group"
      aria-label="Admin setlist shortcuts"
    >
      <button
        type="button"
        className={cn(
          "wl-home-v2-setlist-admin-toolbar__btn",
          linkCopied && "wl-home-v2-setlist-admin-toolbar__btn--copied",
        )}
        onClick={onCopyShowId}
        aria-label={
          linkCopied ? "Show ID copied" : "Copy show ID to clipboard"
        }
        title={linkCopied ? "Copied" : "Copy show ID"}
      >
        <LinkSimple className="size-3.5" weight="bold" aria-hidden />
      </button>
      <button
        type="button"
        className="wl-home-v2-setlist-admin-toolbar__btn"
        disabled
        aria-label="Setlist image export (coming soon)"
        title="Setlist image export (coming soon)"
      >
        <UploadSimple className="size-3.5" weight="bold" aria-hidden />
      </button>
      <button
        type="button"
        className="wl-home-v2-setlist-admin-toolbar__btn"
        onClick={onEditInAdmin}
        aria-label="Edit setlist in admin"
        title="Edit setlist in admin"
      >
        <PencilSimple className="size-3.5" weight="bold" aria-hidden />
      </button>
    </div>
  )
}
