"use client"

import { useLayoutEffect } from "react"

let lockDepth = 0
let savedHtmlOverflow = ""
let savedBodyOverflow = ""

function applyLock() {
  if (typeof document === "undefined") return
  const html = document.documentElement
  const body = document.body
  savedHtmlOverflow = html.style.overflow
  savedBodyOverflow = body.style.overflow
  html.style.overflow = "hidden"
  body.style.overflow = "hidden"
}

function releaseLock() {
  if (typeof document === "undefined") return
  document.documentElement.style.overflow = savedHtmlOverflow
  document.body.style.overflow = savedBodyOverflow
}

/**
 * Disables document scrolling behind WL Home v2 overlays (custom `.modal-backdrop`).
 * Reference-counted so overlapping overlays (e.g. radio + request) stay locked until all close.
 */
export function useWlHomeV2ScrollLock(active: boolean) {
  useLayoutEffect(() => {
    if (!active) return
    lockDepth += 1
    if (lockDepth === 1) {
      applyLock()
    }
    return () => {
      lockDepth -= 1
      if (lockDepth <= 0) {
        lockDepth = 0
        releaseLock()
      }
    }
  }, [active])
}
