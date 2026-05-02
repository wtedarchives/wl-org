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

const SCROLL_LISTENER_OPTS = { passive: true, capture: true } as const

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

/** Layout placeholder; player stays on `document.body` (see shell) so the iframe is never reparented. */
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

/**
 * Single iframe on `document.body`. Aligns to the slot with `fixed` + `translate3d`.
 * Updates are rAF-coalesced (scroll / wheel / resize / etc.) — not a perpetual rAF loop —
 * to reduce overscroll jitter while keeping playback across route changes.
 */
function PersistentRadioBodyShell({
  measureTarget,
  homeEmbedPulseGen,
  pulseEmbedOnHomeBump,
}: {
  measureTarget: HTMLElement | null
  homeEmbedPulseGen: number
  pulseEmbedOnHomeBump: boolean
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
    shell.style.transform = `translate3d(${r.left}px, ${r.top}px, 0)`
  }, [measureTarget])

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

  useEffect(() => {
    scheduleSync()
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => scheduleSync())
        : null
    if (measureTarget && ro) ro.observe(measureTarget)

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
  }, [measureTarget, scheduleSync])

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

function HomeRadioPulseDimOverlay({
  pulseGen,
  onAnimationComplete,
}: {
  pulseGen: number
  onAnimationComplete: (pulseGen: number) => void
}) {
  return createPortal(
    <div
      className="pointer-events-auto fixed inset-0 z-[39] animate-home-radio-page-dim"
      aria-hidden
      onAnimationEnd={(e) => {
        if (e.animationName === "home-radio-page-dim") {
          onAnimationComplete(pulseGen)
        }
      }}
    />,
    document.body,
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
  const [pulseDimVisible, setPulseDimVisible] = useState(false)
  const latestPulseGenForDimRef = useRef(0)

  useEffect(() => setBodyReady(true), [])

  /**
   * Homepage and other `(wl-home-v2)` pages mount `RadioHomeSlot` in the header only
   * (no `(main)` sidebar / `MobileRadioBar`). Non-`/` v2 routes must still anchor to
   * `homeNode`, not `sidebarNode`, or the shell hides the iframe and the slot looks empty.
   */
  const measureTarget = isBelowXl
    ? (mobileNode ?? homeNode)
    : (homeNode ?? sidebarNode)

  const pulseEmbedOnHomeBump = pathname === "/"

  useEffect(() => {
    if (!pulseEmbedOnHomeBump || homeEmbedPulseGen === 0) return
    latestPulseGenForDimRef.current = homeEmbedPulseGen
    setPulseDimVisible(true)
  }, [homeEmbedPulseGen, pulseEmbedOnHomeBump])

  const onRadioDimAnimationComplete = useCallback((completedGen: number) => {
    if (completedGen === latestPulseGenForDimRef.current) {
      setPulseDimVisible(false)
    }
  }, [])

  useEffect(() => {
    if (pulseEmbedOnHomeBump) return
    setPulseDimVisible(false)
  }, [pulseEmbedOnHomeBump])

  if (!bodyReady || typeof document === "undefined") return null

  return (
    <>
      {pulseDimVisible && pulseEmbedOnHomeBump ?
        <HomeRadioPulseDimOverlay
          key={homeEmbedPulseGen}
          pulseGen={homeEmbedPulseGen}
          onAnimationComplete={onRadioDimAnimationComplete}
        />
      : null}
      {createPortal(
        <PersistentRadioBodyShell
          measureTarget={measureTarget}
          homeEmbedPulseGen={homeEmbedPulseGen}
          pulseEmbedOnHomeBump={pulseEmbedOnHomeBump}
        />,
        document.body,
      )}
    </>
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
