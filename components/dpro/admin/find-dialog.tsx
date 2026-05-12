"use client"

import { useEffect, useId, useState } from "react"
import { useRouter } from "next/navigation"

import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getUserProfileUrl } from "@/lib/user-profile-url"

interface FindDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FindDialog({ open, onOpenChange }: FindDialogProps) {
  const router = useRouter()
  const headingId = useId()
  const subtextId = useId()
  const showFieldId = useId()
  const userFieldId = useId()
  const [showId, setShowId] = useState("")
  const [userId, setUserId] = useState("")

  useWlHomeV2ScrollLock(open)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  const handleClose = () => {
    onOpenChange(false)
  }

  const handleFindShow = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = showId.trim()
    if (!trimmed) return
    onOpenChange(false)
    router.push(getSetlistArchiveUrl(trimmed))
    setShowId("")
  }

  const handleFindUser = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = userId.trim()
    if (!trimmed) return
    onOpenChange(false)
    router.push(getUserProfileUrl(trimmed))
    setUserId("")
  }

  const backdropClass = open ? "modal-backdrop open" : "modal-backdrop"

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className={backdropClass}
        id="admin-find-modal"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onOpenChange(false)
        }}
      >
        <div
          className="modal modal--wted-request modal--dpro-find"
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          aria-describedby={subtextId}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-request-head">
            <div className="modal-request-head-text">
              <h3 id={headingId}>Find</h3>
              <p id={subtextId} className="modal-request-sub">
                Jump to a setlist by show UUID or a public profile by user
                UUID.
              </p>
            </div>
            <button
              type="button"
              className="modal-request-close"
              onClick={handleClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="modal-request-body">
            <div className="modal-dpro-find-inner">
              <form
                className="modal-dpro-find-form"
                onSubmit={handleFindShow}
              >
                <Label htmlFor={showFieldId} className="modal-dpro-find-label">
                  Show ID
                </Label>
                <div className="modal-dpro-find-field-row">
                  <Input
                    id={showFieldId}
                    placeholder="Enter show UUID"
                    value={showId}
                    onChange={(e) => setShowId(e.target.value)}
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    className="wbtn primary modal-dpro-find-submit"
                    disabled={!showId.trim()}
                  >
                    Go
                  </button>
                </div>
              </form>
              <form
                className="modal-dpro-find-form"
                onSubmit={handleFindUser}
              >
                <Label htmlFor={userFieldId} className="modal-dpro-find-label">
                  User ID
                </Label>
                <div className="modal-dpro-find-field-row">
                  <Input
                    id={userFieldId}
                    placeholder="Enter user UUID"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    className="wbtn primary modal-dpro-find-submit"
                    disabled={!userId.trim()}
                  >
                    Go
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}
