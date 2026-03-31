"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { createPortal } from "react-dom"
import { usePathname } from "next/navigation"

import { RadioEmbed } from "@/components/radio-embed"
import { useIsBelowXl } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

type PersistentRadioContextValue = {
  setHomeNode: (el: HTMLDivElement | null) => void
  setSidebarNode: (el: HTMLDivElement | null) => void
  setMobileNode: (el: HTMLDivElement | null) => void
  homeNode: HTMLDivElement | null
  sidebarNode: HTMLDivElement | null
  mobileNode: HTMLDivElement | null
  homeEmbedPulseGen: number
  bumpHomeEmbedPulse: () => void
}

const PersistentRadioContext =
  createContext<PersistentRadioContextValue | null>(null)

/** Passive + capture so we catch nested scrollers and trackpad gestures (incl. overscroll rubber-band). */
const GESTURE_LISTENER_OPTS = { passive: true, capture: true } as const

function usePersistentRadio() {
  const ctx = useContext(PersistentRadioContext)
  if (!ctx) {
    throw new Error("Persistent radio components require PersistentRadioRoot")
  }
  return ctx
}

/** Call from the home WTED card: pulses the floating radio embed on `/` (card slot at xl+, top bar below xl). */
export function useBumpHomeRadioEmbedPulse() {
  const ctx = useContext(PersistentRadioContext)
  return ctx?.bumpHomeEmbedPulse ?? (() => {})
}

/** Placeholder for layout + measurement (`getBoundingClientRect`). Player renders in a body portal. */
export function RadioHomeSlot({ className }: { className?: string }) {
  const { setHomeNode } = usePersistentRadio()
  return (
    <div
      ref={setHomeNode}
      className={cn("min-h-[66px] w-full", className)}
      data-slot="radio-home"
    />
  )
}

export function RadioSidebarSlot({ className }: { className?: string }) {
  const { setSidebarNode } = usePersistentRadio()
  return (
    <div
      ref={setSidebarNode}
      className={cn("min-h-[66px] w-full", className)}
      data-slot="radio-sidebar"
    />
  )
}

export function RadioMobileSlot({ className }: { className?: string }) {
  const { setMobileNode } = usePersistentRadio()
  return (
    <div
      ref={setMobileNode}
      className={cn("min-h-[66px] w-full", className)}
      data-slot="radio-mobile"
    />
  )
}

/** One stable `document.body` portal; iframe stays mounted — shell moves with measured slot. */
function PersistentRadioBodyShell({
  measureTarget,
  homeEmbedPulseGen,
  pulseEmbedOnHomeBump,
}: {
  measureTarget: HTMLElement | null
  homeEmbedPulseGen: number
  /** True on `/` when the WTED card bump should animate the player (home slot or top bar, any width). */
  pulseEmbedOnHomeBump: boolean
}) {
  const shellRef = useRef<HTMLDivElement | null>(null)
  const pulseOverlayRef = useRef<HTMLDivElement | null>(null)

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
    /** Below modal overlays (z-50) so dialogs blur and cover the floating player. */
    shell.style.zIndex = "40"
    shell.style.width = `${r.width}px`
    /** translate3d tracks compositor-driven movement (e.g. Chrome elastic overscroll) better than top/left in some cases. */
    shell.style.transform = `translate3d(${r.left}px, ${r.top}px, 0)`
  }, [measureTarget])

  useLayoutEffect(() => {
    sync()
  }, [sync])

  useEffect(() => {
    sync()
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => sync())
        : null
    if (measureTarget && ro) ro.observe(measureTarget)

    window.addEventListener("resize", sync)

    window.addEventListener("wheel", sync, GESTURE_LISTENER_OPTS)
    window.addEventListener("touchmove", sync, GESTURE_LISTENER_OPTS)

    const vv = window.visualViewport
    if (vv) {
      vv.addEventListener("scroll", sync, GESTURE_LISTENER_OPTS)
      vv.addEventListener("resize", sync)
    }

    let rafId = 0
    const tick = () => {
      sync()
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    const onVisibility = () => {
      cancelAnimationFrame(rafId)
      if (document.visibilityState === "hidden") return
      sync()
      rafId = requestAnimationFrame(tick)
    }
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      cancelAnimationFrame(rafId)
      ro?.disconnect()
      window.removeEventListener("resize", sync)
      window.removeEventListener("wheel", sync, GESTURE_LISTENER_OPTS)
      window.removeEventListener("touchmove", sync, GESTURE_LISTENER_OPTS)
      if (vv) {
        vv.removeEventListener("scroll", sync, GESTURE_LISTENER_OPTS)
        vv.removeEventListener("resize", sync)
      }
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [sync, measureTarget])

  useEffect(() => {
    if (!pulseEmbedOnHomeBump || homeEmbedPulseGen === 0) return
    const el = pulseOverlayRef.current
    if (!el) return
    el.classList.remove("animate-home-radio-embed-pulse")
    void el.offsetWidth
    el.classList.add("animate-home-radio-embed-pulse")
  }, [homeEmbedPulseGen, pulseEmbedOnHomeBump])

  return (
    <div ref={shellRef} className="relative rounded-md">
      <div
        ref={pulseOverlayRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 rounded-md"
      />
      <RadioEmbed />
    </div>
  )
}

function PersistentRadioPortal() {
  const pathname = usePathname()
  const isBelowXl = useIsBelowXl()
  const {
    homeNode,
    sidebarNode,
    mobileNode,
    homeEmbedPulseGen,
  } = usePersistentRadio()
  const [bodyReady, setBodyReady] = useState(false)

  useEffect(() => setBodyReady(true), [])

  const measureTarget = isBelowXl
    ? mobileNode
    : pathname === "/"
      ? homeNode
      : sidebarNode

  const pulseEmbedOnHomeBump = pathname === "/"

  if (!bodyReady || typeof document === "undefined") return null

  return createPortal(
    <PersistentRadioBodyShell
      measureTarget={measureTarget}
      homeEmbedPulseGen={homeEmbedPulseGen}
      pulseEmbedOnHomeBump={pulseEmbedOnHomeBump}
    />,
    document.body,
  )
}

export function PersistentRadioRoot({
  children,
}: {
  children: React.ReactNode
}) {
  const [homeNode, setHomeNode] = useState<HTMLDivElement | null>(null)
  const [sidebarNode, setSidebarNode] = useState<HTMLDivElement | null>(null)
  const [mobileNode, setMobileNode] = useState<HTMLDivElement | null>(null)
  const [homeEmbedPulseGen, setHomeEmbedPulseGen] = useState(0)

  const bumpHomeEmbedPulse = useCallback(() => {
    setHomeEmbedPulseGen((n) => n + 1)
  }, [])

  const setHomeNodeCb = useCallback((el: HTMLDivElement | null) => {
    setHomeNode((prev) => (prev === el ? prev : el))
  }, [])
  const setSidebarNodeCb = useCallback((el: HTMLDivElement | null) => {
    setSidebarNode((prev) => (prev === el ? prev : el))
  }, [])
  const setMobileNodeCb = useCallback((el: HTMLDivElement | null) => {
    setMobileNode((prev) => (prev === el ? prev : el))
  }, [])

  const value = useMemo<PersistentRadioContextValue>(
    () => ({
      setHomeNode: setHomeNodeCb,
      setSidebarNode: setSidebarNodeCb,
      setMobileNode: setMobileNodeCb,
      homeNode,
      sidebarNode,
      mobileNode,
      homeEmbedPulseGen,
      bumpHomeEmbedPulse,
    }),
    [
      setHomeNodeCb,
      setSidebarNodeCb,
      setMobileNodeCb,
      homeNode,
      sidebarNode,
      mobileNode,
      homeEmbedPulseGen,
      bumpHomeEmbedPulse,
    ],
  )

  return (
    <PersistentRadioContext.Provider value={value}>
      {children}
      <PersistentRadioPortal />
    </PersistentRadioContext.Provider>
  )
}
