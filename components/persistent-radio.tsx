"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { createPortal } from "react-dom"
import { usePathname } from "next/navigation"

import { PersistentRadioBodyShell } from "@/components/persistent-radio-body-shell"
import { useIsBelowXl } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

type PersistentRadioContextValue = {
  setHomeNode: (el: HTMLDivElement | null) => void
  setSidebarNode: (el: HTMLDivElement | null) => void
  setMobileNode: (el: HTMLDivElement | null) => void
  /** Index `/` only: measure target on the Goose Radio tile (header slots stay unmounted). */
  setHomepageTopNode: (el: HTMLDivElement | null) => void
  /**
   * Index `/`: set true once the Goose Radio tile anchor is mounted.
   * Hides/skips positioning the floating iframe until the slot exists — avoids measuring a missing node.
   */
  setHomepageRadioTileScheduleReady: (ready: boolean) => void
  homeNode: HTMLDivElement | null
  sidebarNode: HTMLDivElement | null
  mobileNode: HTMLDivElement | null
  homepageTopNode: HTMLDivElement | null
  /** `/` Goose Radio tile: true once the tile anchor is mounted (floating embed anchors). */
  homepageRadioTileScheduleReady: boolean
  homeEmbedPulseGen: number
  bumpHomeEmbedPulse: () => void
}

const PersistentRadioContext =
  createContext<PersistentRadioContextValue | null>(null)

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

/** Goose Radio homepage tile only: signal when the tile anchor is mounted for floating embed positioning. */
export function usePersistentRadioTileScheduleGate() {
  const ctx = useContext(PersistentRadioContext)
  if (!ctx) {
    throw new Error(
      "usePersistentRadioTileScheduleGate requires PersistentRadioRoot",
    )
  }
  return ctx.setHomepageRadioTileScheduleReady
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

/** Index `/`: measure target inside the Goose Radio homepage tile while the header embed is hidden. */
export function RadioHomepageTopSlot({ className }: { className?: string }) {
  const { setHomepageTopNode } = usePersistentRadio()
  return (
    <div
      ref={setHomepageTopNode}
      className={cn("min-h-[66px] w-full", className)}
      data-slot="radio-homepage-top"
    />
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
    homepageTopNode,
    homepageRadioTileScheduleReady,
    homeEmbedPulseGen,
  } = usePersistentRadio()
  const [bodyReady, setBodyReady] = useState(false)
  const [pulseDimVisible, setPulseDimVisible] = useState(false)
  const latestPulseGenForDimRef = useRef(0)

  useEffect(() => setBodyReady(true), [])

  /**
   * `/`: header hides the radio chrome; `RadioHomepageTopSlot` on the Goose Radio tile is the anchor.
   * Other `(wl-home-v2)` routes: `RadioHomeSlot` / `RadioMobileSlot` in the header.
   * Non-v2 `(main)` sidebar uses `RadioSidebarSlot`; `MobileRadioBar` uses `RadioMobileSlot`.
   */
  const isHomeIndex = pathname === "/"
  const measureTarget = isHomeIndex
    ? (homepageRadioTileScheduleReady ? homepageTopNode : null)
    : isBelowXl
      ? (mobileNode ?? homeNode)
      : (homeNode ?? sidebarNode)

  const pulseEmbedOnHomeBump = isHomeIndex

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
  const [homepageTopNode, setHomepageTopNode] = useState<
    HTMLDivElement | null
  >(null)
  /** `/` Goose Radio tile: wait for tile anchor mount before anchoring the embed */
  const [homepageRadioTileScheduleReady, setHomepageRadioTileScheduleReady] =
    useState(false)
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
  const setHomepageTopNodeCb = useCallback((el: HTMLDivElement | null) => {
    setHomepageTopNode((prev) => (prev === el ? prev : el))
  }, [])
  const setHomepageRadioTileScheduleReadyCb = useCallback(
    (ready: boolean) => {
      setHomepageRadioTileScheduleReady((prev) =>
        prev === ready ? prev : ready,
      )
    },
    [],
  )

  const value = useMemo<PersistentRadioContextValue>(
    () => ({
      setHomeNode: setHomeNodeCb,
      setSidebarNode: setSidebarNodeCb,
      setMobileNode: setMobileNodeCb,
      setHomepageTopNode: setHomepageTopNodeCb,
      setHomepageRadioTileScheduleReady: setHomepageRadioTileScheduleReadyCb,
      homeNode,
      sidebarNode,
      mobileNode,
      homepageTopNode,
      homepageRadioTileScheduleReady,
      homeEmbedPulseGen,
      bumpHomeEmbedPulse,
    }),
    [
      setHomeNodeCb,
      setSidebarNodeCb,
      setMobileNodeCb,
      setHomepageTopNodeCb,
      setHomepageRadioTileScheduleReadyCb,
      homeNode,
      sidebarNode,
      mobileNode,
      homepageTopNode,
      homepageRadioTileScheduleReady,
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
