"use client"

import {
  useCallback,
  useLayoutEffect,
  useState,
} from "react"

import { MAIN_INSET_SCROLL_ID } from "@/components/wl-home-shared"

let lockDepth = 0

type Saved = {
  htmlOverflow: string
  htmlOverscroll: string
  bodyOverflow: string
  bodyPosition: string
  bodyTop: string
  bodyLeft: string
  bodyRight: string
  bodyWidth: string
  windowScrollY: number
  inset: HTMLElement | null
  insetOverflow: string
  insetTouchAction: string
  insetOverscroll: string
}

const saved: Saved = {
  htmlOverflow: "",
  htmlOverscroll: "",
  bodyOverflow: "",
  bodyPosition: "",
  bodyTop: "",
  bodyLeft: "",
  bodyRight: "",
  bodyWidth: "",
  windowScrollY: 0,
  inset: null,
  insetOverflow: "",
  insetTouchAction: "",
  insetOverscroll: "",
}

function getScrollableMainInset(): HTMLElement | null {
  const el = document.getElementById(MAIN_INSET_SCROLL_ID)
  if (!(el instanceof HTMLElement)) return null
  const oy = getComputedStyle(el).overflowY
  if (oy === "auto" || oy === "scroll" || oy === "overlay") return el
  return null
}

function applyLock() {
  const html = document.documentElement
  const body = document.body
  saved.htmlOverflow = html.style.overflow
  saved.htmlOverscroll = html.style.overscrollBehavior
  saved.bodyOverflow = body.style.overflow

  html.style.overflow = "hidden"
  html.style.overscrollBehavior = "none"
  body.style.overflow = "hidden"

  const insetEl = getScrollableMainInset()
  if (insetEl) {
    saved.inset = insetEl
    saved.insetOverflow = insetEl.style.overflow
    saved.insetTouchAction = insetEl.style.touchAction
    saved.insetOverscroll = insetEl.style.overscrollBehavior
    insetEl.style.overflow = "hidden"
    insetEl.style.touchAction = "none"
    insetEl.style.overscrollBehavior = "none"
  } else {
    saved.inset = null
    saved.windowScrollY = window.scrollY
    saved.bodyPosition = body.style.position
    saved.bodyTop = body.style.top
    saved.bodyLeft = body.style.left
    saved.bodyRight = body.style.right
    saved.bodyWidth = body.style.width
    body.style.position = "fixed"
    body.style.top = `-${saved.windowScrollY}px`
    body.style.left = "0"
    body.style.right = "0"
    body.style.width = "100%"
  }
}

function releaseLock() {
  const html = document.documentElement
  const body = document.body
  html.style.overflow = saved.htmlOverflow
  html.style.overscrollBehavior = saved.htmlOverscroll
  body.style.overflow = saved.bodyOverflow

  if (saved.inset) {
    saved.inset.style.overflow = saved.insetOverflow
    saved.inset.style.touchAction = saved.insetTouchAction
    saved.inset.style.overscrollBehavior = saved.insetOverscroll
    saved.inset = null
  } else {
    body.style.position = saved.bodyPosition
    body.style.top = saved.bodyTop
    body.style.left = saved.bodyLeft
    body.style.right = saved.bodyRight
    body.style.width = saved.bodyWidth
    window.scrollTo(0, saved.windowScrollY)
  }
}

/**
 * Ref-counted scroll lock for modals / sheets. Handles:
 * - `(main)` layout: `#main-inset-scroll` is the real scroll surface — overflow + touch locking.
 * - WL Home / document scroll: `position: fixed` on `body` + scroll restoration (iOS Safari).
 */
export function useModalScrollLock(active: boolean) {
  useLayoutEffect(() => {
    if (!active) return
    lockDepth += 1
    if (lockDepth === 1) applyLock()
    return () => {
      lockDepth -= 1
      if (lockDepth <= 0) {
        lockDepth = 0
        releaseLock()
      }
    }
  }, [active])
}

type RadixOpenProps = {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?(open: boolean): void
}

/**
 * Mirrors Radix dialog/sheet/alert open state so scroll lock only applies while the overlay is
 * actually open. (DialogContent stays mounted when closed; do not lock “while mounted” there.)
 */
export function useOverlayRootScrollLock({
  open,
  defaultOpen,
  onOpenChange,
}: RadixOpenProps): {
  open: boolean
  onOpenChange: (open: boolean) => void
} {
  const isControlled = open !== undefined
  const [uncontrolledOpen, setUncontrolledOpen] = useState(() => !!defaultOpen)
  const resolvedOpen = isControlled ? !!open : uncontrolledOpen

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [onOpenChange, isControlled],
  )

  useModalScrollLock(resolvedOpen)

  return { open: resolvedOpen, onOpenChange: handleOpenChange }
}
