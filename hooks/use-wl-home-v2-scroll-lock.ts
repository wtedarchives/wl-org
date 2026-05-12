"use client"

import { useModalScrollLock } from "@/hooks/use-modal-scroll-lock"

/**
 * Disables scrolling behind WL Home v2 overlays (custom `.modal-backdrop`).
 * Reference-counted so overlapping overlays (e.g. radio + request) stay locked until all close.
 *
 * Uses the shared modal scroll lock (main inset + iOS document freeze); see `useModalScrollLock`.
 */
export function useWlHomeV2ScrollLock(active: boolean) {
  useModalScrollLock(active)
}
