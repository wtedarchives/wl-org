"use client"

import { Copy, LinkSimple, PencilSimple, UploadSimple } from "@phosphor-icons/react"

import { cn } from "@/lib/utils"

export type WlHomeV2SetlistAdminToolbarProps = {
  linkCopied?: boolean
  setlistTextCopied?: boolean
  /** Admin-only: copy show ID. */
  onCopyShowId?: () => void
  /** Copy formatted setlist plain text. */
  onCopySetlistText?: () => void
  /** Admin-only: open setlist in admin panel. */
  onEditInAdmin?: () => void
  /** Available to all signed-in users viewing a setlist. */
  onShareSetlistImage?: () => void
}

export function WlHomeV2SetlistAdminToolbar({
  linkCopied = false,
  setlistTextCopied = false,
  onCopyShowId,
  onCopySetlistText,
  onEditInAdmin,
  onShareSetlistImage,
}: WlHomeV2SetlistAdminToolbarProps) {
  return (
    <div
      className="wl-home-v2-setlist-admin-toolbar"
      role="group"
      aria-label="Setlist shortcuts"
    >
      {onCopyShowId ?
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
      : null}
      {onShareSetlistImage ?
        <button
          type="button"
          className="wl-home-v2-setlist-admin-toolbar__btn"
          onClick={onShareSetlistImage}
          aria-label="Generate setlist share image"
          title="Generate setlist image"
        >
          <UploadSimple className="size-3.5" weight="bold" aria-hidden />
        </button>
      : null}
      {onEditInAdmin ?
        <button
          type="button"
          className="wl-home-v2-setlist-admin-toolbar__btn"
          onClick={onEditInAdmin}
          aria-label="Edit setlist in admin"
          title="Edit setlist in admin"
        >
          <PencilSimple className="size-3.5" weight="bold" aria-hidden />
        </button>
      : null}
      {onCopySetlistText ?
        <button
          type="button"
          className={cn(
            "wl-home-v2-setlist-admin-toolbar__btn",
            setlistTextCopied && "wl-home-v2-setlist-admin-toolbar__btn--copied",
          )}
          onClick={onCopySetlistText}
          aria-label={
            setlistTextCopied ? "Setlist copied" : "Copy setlist as plain text"
          }
          title={setlistTextCopied ? "Copied" : "Copy setlist text"}
        >
          <Copy className="size-3.5" weight="bold" aria-hidden />
        </button>
      : null}
    </div>
  )
}
