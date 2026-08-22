"use client"

import { useCallback, useEffect, useLayoutEffect, useRef } from "react"

import { IosRadioBar } from "@/components/wted/ios-radio/ios-radio-bar"
// Revert to Luna: uncomment RadioEmbed and the ternary below.
// import { RadioEmbed } from "@/components/radio-embed"

const SCROLL_LISTENER_OPTS = { passive: true, capture: true } as const

/**
 * Single player on `document.body` (iOS-style bar; Luna kept commented for revert).
 * Aligns to the slot with `fixed` + `translate3d`.
 * Updates are rAF-coalesced (scroll / wheel / resize / etc.) — not a perpetual rAF loop —
 * to reduce overscroll jitter while keeping playback across route changes.
 */
export function PersistentRadioBodyShell({
  measureTarget,
  homeEmbedPulseGen,
  pulseEmbedOnHomeBump,
  useCustomPlayer,
}: {
  measureTarget: HTMLElement | null
  homeEmbedPulseGen: number
  pulseEmbedOnHomeBump: boolean
  useCustomPlayer: boolean
}) {
  const shellRef = useRef<HTMLDivElement | null>(null)
  const pulseOverlayRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef(0)

  const sync = useCallback(() => {
    const shell = shellRef.current
    const el = measureTarget
    if (!shell) return
    if (!el) {
      shell.style.visibility = "hidden"
      shell.style.pointerEvents = "none"
      return
    }
    const r = el.getBoundingClientRect()
    if (r.width < 2 || r.height < 2) {
      shell.style.visibility = "hidden"
      shell.style.pointerEvents = "none"
      shell.style.transform = "none"
      return
    }
    shell.style.visibility = "visible"
    shell.style.pointerEvents = "auto"
    shell.style.position = "fixed"
    shell.style.top = "0"
    shell.style.left = "0"
    /** Below modal overlays (z-50). */
    shell.style.zIndex = "40"
    shell.style.width = `${r.width}px`
    if (useCustomPlayer) {
      const barHeight = shell.offsetHeight
      if (barHeight > 0) el.style.height = `${barHeight}px`
    }
    const placed = el.getBoundingClientRect()
    shell.style.transform = `translate3d(${placed.left}px, ${placed.top}px, 0)`
  }, [measureTarget, useCustomPlayer])

  const scheduleSync = useCallback(() => {
    if (rafRef.current !== 0) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0
      sync()
    })
  }, [sync])

  useLayoutEffect(() => {
    sync()
  }, [sync])

  /** Re-sync when the anchor first appears and while ON AIR content settles layout. */
  useLayoutEffect(() => {
    if (!measureTarget) return
    sync()
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => sync())
    })
    const t1 = window.setTimeout(() => sync(), 120)
    const t2 = window.setTimeout(() => sync(), 400)
    const t3 = window.setTimeout(() => sync(), 800)
    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [measureTarget, sync])

  useEffect(() => {
    scheduleSync()
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => scheduleSync())
        : null
    if (measureTarget && ro) ro.observe(measureTarget)
    if (useCustomPlayer && shellRef.current && ro) {
      ro.observe(shellRef.current)
    }

    window.addEventListener("resize", scheduleSync)

    document.addEventListener("scroll", scheduleSync, SCROLL_LISTENER_OPTS)
    document.addEventListener("wheel", scheduleSync, SCROLL_LISTENER_OPTS)
    document.addEventListener("touchmove", scheduleSync, SCROLL_LISTENER_OPTS)

    const vv = window.visualViewport
    if (vv) {
      vv.addEventListener("scroll", scheduleSync, { passive: true })
      vv.addEventListener("resize", scheduleSync)
    }

    return () => {
      if (rafRef.current !== 0) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = 0
      }
      ro?.disconnect()
      window.removeEventListener("resize", scheduleSync)
      document.removeEventListener("scroll", scheduleSync, SCROLL_LISTENER_OPTS)
      document.removeEventListener("wheel", scheduleSync, SCROLL_LISTENER_OPTS)
      document.removeEventListener("touchmove", scheduleSync, SCROLL_LISTENER_OPTS)
      if (vv) {
        vv.removeEventListener("scroll", scheduleSync)
        vv.removeEventListener("resize", scheduleSync)
      }
    }
  }, [measureTarget, scheduleSync, useCustomPlayer])

  useLayoutEffect(() => {
    return () => {
      if (measureTarget) measureTarget.style.height = ""
    }
  }, [measureTarget, useCustomPlayer])

  useEffect(() => {
    if (!pulseEmbedOnHomeBump || homeEmbedPulseGen === 0) return
    const el = pulseOverlayRef.current
    if (!el) return
    el.classList.remove("animate-home-radio-embed-pulse")
    void el.offsetWidth
    el.classList.add("animate-home-radio-embed-pulse")
  }, [homeEmbedPulseGen, pulseEmbedOnHomeBump])

  return (
    <div
      ref={shellRef}
      className={
        useCustomPlayer ? "relative overflow-hidden rounded-[10px]" : (
          "relative rounded-md"
        )
      }
    >
      <div
        ref={pulseOverlayRef}
        aria-hidden
        className={
          useCustomPlayer ?
            "pointer-events-none absolute inset-0 z-10 rounded-[10px]"
          : "pointer-events-none absolute inset-0 z-10 rounded-md"
        }
      />
      <IosRadioBar />
      {/* Revert to Luna: {useCustomPlayer ? <IosRadioBar /> : <RadioEmbed />} */}
    </div>
  )
}
