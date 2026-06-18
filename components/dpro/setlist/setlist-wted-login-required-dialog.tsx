"use client"

import { useId } from "react"
import { useWlHomeV2LoginAction } from "@/components/wl-home-v2/wl-home-v2-open-login-context"

import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface SetlistWtedLoginRequiredDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When true, uses the WL Home v2 `modal--wted-request` shell (same as Request a Song). */
  wlHomeV2?: boolean
}

export function SetlistWtedLoginRequiredDialog({
  open,
  onOpenChange,
  wlHomeV2 = false,
}: SetlistWtedLoginRequiredDialogProps) {
  const openLogin = useWlHomeV2LoginAction()
  const headingId = useId()
  const subtextId = useId()
  useWlHomeV2ScrollLock(open && wlHomeV2)

  const handleLogin = () => {
    onOpenChange(false)
    openLogin()
  }

  if (wlHomeV2) {
    return (
      <WlHomeV2ModalPortal open={open}>
        <div
          className={"modal-backdrop" + (open ? " open" : "")}
          id="wl-home-v2-wted-login-required"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) onOpenChange(false)
          }}
        >
          <div
            className="modal modal--wted-request modal--wted-login-required"
            role="dialog"
            aria-modal="true"
            aria-labelledby={headingId}
            aria-describedby={subtextId}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-request-head">
              <div className="modal-request-head-text">
                <h3 id={headingId}>Login Required</h3>
                <p id={subtextId} className="modal-request-sub">
                  You must be logged in to request songs on WTED Goose Radio.
                </p>
              </div>
              <button
                type="button"
                className="modal-request-close"
                onClick={() => onOpenChange(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="modal-setlist-song-footer">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="modal-setlist-song-footer-link"
                onClick={handleLogin}
              >
                Log In
              </Button>
              <button
                type="button"
                className="modal-setlist-song-footer-close"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </WlHomeV2ModalPortal>
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Login Required</AlertDialogTitle>
          <AlertDialogDescription>
            You must be logged in to request songs on WTED Goose Radio.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleLogin}>Log In</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
