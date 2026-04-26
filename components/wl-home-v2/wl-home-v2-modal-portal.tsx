"use client"

import { createPortal } from "react-dom"
import { useEffect, useState, type ReactNode } from "react"

type WlHomeV2ModalPortalProps = {
  open: boolean
  children: ReactNode
}

/**
 * Mounts modal trees on `document.body` with a `.wl-home-v2` wrapper so existing
 * `.wl-home-v2 .modal-backdrop` / `.modal` CSS applies, while stacking above
 * `#__next` (top bar, persistent radio shell, etc.).
 */
export function WlHomeV2ModalPortal({
  open,
  children,
}: WlHomeV2ModalPortalProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted || typeof document === "undefined") return null
  return createPortal(
    <div
      className="wl-home-v2 wl-home-v2-modal-layer"
      aria-hidden={open ? undefined : true}
    >
      {children}
    </div>,
    document.body,
  )
}
