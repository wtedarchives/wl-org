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
import { IosRadioPlayerProvider } from "@/components/wted/ios-radio/ios-radio-player-context"
import { useIsBelowXl } from "@/hooks/use-mobile"
import { useSiteSearchAccess } from "@/hooks/use-site-search-access"
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
  /** iOS-style header player for `SITE_SEARCH_ALLOWLIST` testers (Luna for everyone else). */
  useCustomPlayer: boolean
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

/** Homepage tile / legacy home card: pulse the header radio embed on `/`. */
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
    useCustomPlayer,
  } = usePersistentRadio()
  const [bodyReady, setBodyReady] = useState(false)
  const [pulseDimVisible, setPulseDimVisible] = useState(false)
  const latestPulseGenForDimRef = useRef(0)

  useEffect(() => setBodyReady(true), [])

  /**
   * `(wl-home-v2)` routes: `RadioHomeSlot` / `RadioMobileSlot` in the header.
   * Non-v2 `(main)` sidebar uses `RadioSidebarSlot`; `MobileRadioBar` uses `RadioMobileSlot`.
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
          useCustomPlayer={useCustomPlayer}
        />,
        document.body,
      )}
    </>
  )
}

/** True when the iOS-style header player is mounted for this visitor. */
export function useCustomIosRadioPlayer() {
  const ctx = useContext(PersistentRadioContext)
  return Boolean(ctx?.useCustomPlayer)
}

export function PersistentRadioRoot({
  children,
}: {
  children: React.ReactNode
}) {
  const { allowed } = useSiteSearchAccess()
  const useCustomPlayer = allowed
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
      useCustomPlayer,
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
      useCustomPlayer,
    ],
  )

  const tree = (
    <>
      {children}
      <PersistentRadioPortal />
    </>
  )

  return (
    <PersistentRadioContext.Provider value={value}>
      <IosRadioPlayerProvider enabled={useCustomPlayer}>
        {tree}
      </IosRadioPlayerProvider>
    </PersistentRadioContext.Provider>
  )
}
