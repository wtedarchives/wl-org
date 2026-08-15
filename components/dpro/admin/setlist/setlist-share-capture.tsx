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

import { supabase } from "@/lib/supabase"
import { useShowPositionInTour } from "@/hooks/use-show-position-in-tour"
import { pickRandomShareBackground } from "@/lib/wl-home-v2-share-backgrounds"
import { WlHomeV2SetlistShareExportCard } from "@/components/wl-home-v2/wl-home-v2-setlist-share-export-card"
import {
  bakeSetlistShareImages,
  decodedByteLength,
  isSetlistShareCaptureIOSWebKit,
  letterboxSetlistShareCardForInstagram,
  rasteriseSetlistShareNode,
  rasteriseSetlistShareNodeToPng,
  withSetlistShareCaptureLive,
} from "@/lib/wl-setlist-share-capture"
import type { SetlistEntry, Show } from "@/types/setlist"

import "./setlist-share-capture.css"

/**
 * Capture ladder. The share card's own export is 432px × 5 = 2160px wide, which
 * is far more than Bluesky renders and risks the 2MB embed cap, so Bluesky gets
 * its own smaller rungs. Each is tried in order until one fits {@link MAX_BYTES}.
 */
const CAPTURE_STEPS = [
  { pixelRatio: 3, quality: 0.85 },
  { pixelRatio: 2, quality: 0.8 },
  { pixelRatio: 2, quality: 0.6 },
] as const

/** iOS: CSS-scale the live card (not canvas-upscale a 1× JPEG). */
const IOS_CAPTURE_STEPS = [
  { pixelRatio: 3, quality: 0.85 },
  { pixelRatio: 2, quality: 0.8 },
  { pixelRatio: 2, quality: 0.6 },
] as const

/** Headroom under the 2,000,000-byte `app.bsky.embed.images` limit. */
const MAX_BYTES = 1_600_000

/**
 * Instagram canvas: exactly 4:5. Composited in canvas (not html-to-image) so
 * CSS transform + a second background <img> cannot vanish on iOS.
 *
 * 576×720 CSS at pixelRatio 2 → 1152×1440, under Instagram's 1440px max width.
 */
const IG_CANVAS_WIDTH_PX = 576
const IG_CANVAS_HEIGHT_PX = 720
const IG_CANVAS_PADDING_PX = 16
const IG_CARD_CAPTURE_SCALE = 3
const IG_MAX_BYTES = 4_000_000

type SetlistShareCaptureContextValue = {
  /**
   * Base64 JPEG (no data: prefix) of the setlist share card with coach notes,
   * or null when capture isn't possible. Never throws — a failed capture must
   * not block the Discourse/push/Bluesky send.
   */
  capture: () => Promise<string | null>
  /** Same card, letterboxed into a fixed 4:5 canvas for Instagram. */
  captureInstagram: () => Promise<string | null>
}

const SetlistShareCaptureContext =
  createContext<SetlistShareCaptureContextValue | null>(null)

/** Entries shaped for the share card, including the nested song display name. */
const ENTRY_SELECT = `
  entry_id,
  entry_set,
  entry_setnum,
  entry_setorder,
  entry_song,
  entry_short,
  entry_segue,
  entry_length,
  entry_placement,
  entry_coachnotes,
  entry_show,
  songs ( song_displayname )
`

/**
 * Renders the setlist share card offscreen and exposes a capture function.
 *
 * The card is a DOM component captured with `html-to-image`, so it can only be
 * produced in the browser — the edge function has no DOM. Mounting it here (in
 * the admin setlist tab) lets the brain button attach the exact same image the
 * share modal produces, rather than a server-side reimplementation.
 */
export function SetlistShareCaptureProvider({
  showId,
  children,
}: {
  showId: string | undefined
  children: React.ReactNode
}) {
  const captureRef = useRef<HTMLDivElement | null>(null)
  const layerRef = useRef<HTMLDivElement | null>(null)
  const [show, setShow] = useState<Show | null>(null)
  const [entries, setEntries] = useState<SetlistEntry[]>([])
  // Portal target is only available after mount (static export prerenders this).
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fixed per show so successive song posts in one show share a background.
  const backgroundSrc = useMemo(
    () => pickRandomShareBackground(),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-roll per show
    [showId],
  )

  const showPositionInTour = useShowPositionInTour(
    showId,
    show?.show_tour ?? undefined,
  )

  /** The card needs the full show row, not the admin tab's trimmed projection. */
  const loadShow = useCallback(async (): Promise<Show | null> => {
    if (!showId || !supabase) return null
    const { data, error } = await supabase
      .from("shows")
      .select("*")
      .eq("show_id", showId)
      .maybeSingle()
    if (error) {
      console.error("share capture show fetch:", error.message)
      return null
    }
    return (data as Show | null) ?? null
  }, [showId])

  const loadEntries = useCallback(async (): Promise<SetlistEntry[]> => {
    if (!showId || !supabase) return []
    const { data, error } = await supabase
      .from("setlist_entries")
      .select(ENTRY_SELECT)
      .eq("entry_show", showId)
      .order("entry_set", { ascending: true })
      .order("entry_setnum", { ascending: true })
    if (error) {
      console.error("share capture entries fetch:", error.message)
      return []
    }
    return (data ?? []) as unknown as SetlistEntry[]
  }, [showId])

  useEffect(() => {
    let cancelled = false
    if (!showId) {
      setShow(null)
      setEntries([])
      return
    }
    void (async () => {
      const [nextShow, nextEntries] = await Promise.all([
        loadShow(),
        loadEntries(),
      ])
      if (cancelled) return
      setShow(nextShow)
      setEntries(nextEntries)
    })()
    return () => {
      cancelled = true
    }
  }, [showId, loadShow, loadEntries])

  /**
   * Refetch, commit, and hand back the node to rasterise. The entry being
   * announced was likely just added, and a stale card would omit the very song
   * the post is about.
   */
  const prepareNode = useCallback(async (): Promise<HTMLDivElement | null> => {
    const [freshShow, freshEntries] = await Promise.all([
      loadShow(),
      loadEntries(),
    ])
    if (!freshShow || freshEntries.length === 0) return null
    setShow(freshShow)
    setEntries(freshEntries)

    // Two frames: one for React to commit, one for layout to settle.
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))

    return captureRef.current
  }, [loadShow, loadEntries])

  const withPreparedCard = useCallback(
    async <T,>(run: (node: HTMLDivElement) => Promise<T>): Promise<T | null> => {
      const layer = layerRef.current
      const node = await prepareNode()
      if (!layer || !node) return null
      return withSetlistShareCaptureLive(layer, async () => {
        const restore = await bakeSetlistShareImages(node)
        try {
          return await run(node)
        } finally {
          restore()
        }
      })
    },
    [prepareNode],
  )

  const capture = useCallback(async (): Promise<string | null> => {
    if (!showId) return null
    try {
      return await withPreparedCard((node) => {
        const steps = isSetlistShareCaptureIOSWebKit() ?
          IOS_CAPTURE_STEPS
        : CAPTURE_STEPS
        return rasteriseSetlistShareNode(node, steps, MAX_BYTES, "share capture")
      })
    } catch (err) {
      console.error("share capture failed:", err)
      return null
    }
  }, [showId, withPreparedCard])

  const captureInstagram = useCallback(async (): Promise<string | null> => {
    if (!showId) return null
    try {
      const cardDataUrl = await withPreparedCard((node) =>
        rasteriseSetlistShareNodeToPng(node, IG_CARD_CAPTURE_SCALE),
      )
      if (!cardDataUrl) return null
      const pixelRatio = 2
      const qualities = [0.92, 0.8, 0.65]
      for (const quality of qualities) {
        const base64 = await letterboxSetlistShareCardForInstagram(
          cardDataUrl,
          backgroundSrc,
          IG_CANVAS_WIDTH_PX,
          IG_CANVAS_HEIGHT_PX,
          IG_CANVAS_PADDING_PX,
          pixelRatio,
          quality,
        )
        if (base64 && decodedByteLength(base64) <= IG_MAX_BYTES) return base64
      }
      console.error("instagram capture: every quality step exceeded the size budget")
      return null
    } catch (err) {
      console.error("instagram capture failed:", err)
      return null
    }
  }, [showId, withPreparedCard, backgroundSrc])

  const value = useMemo<SetlistShareCaptureContextValue>(
    () => ({ capture, captureInstagram }),
    [capture, captureInstagram],
  )

  return (
    <SetlistShareCaptureContext.Provider value={value}>
      {children}
      {mounted && show && entries.length > 0 ?
        /*
         * Portalled to <body>, matching where the share modal's Radix Dialog
         * puts the card. The card's palette comes from custom properties scoped
         * to `.wl-home-v2` (e.g. `--wl-deep-green`), so rendering it inside the
         * admin tree instead resolves variables the modal leaves unset and
         * changes the output — the brand bar picks up a solid green fill, and
         * ancestor-scoped table rules shift the row padding. Same DOM position
         * as the modal ⇒ same cascade ⇒ same image.
         *
         * Offscreen when idle (html-to-image needs real layout, so display:none
         * would capture nothing). `--live` during capture moves it on-screen.
         */
        createPortal(
          <div ref={layerRef} className="wl-setlist-share-capture" aria-hidden>
            <WlHomeV2SetlistShareExportCard
              ref={captureRef}
              backgroundSrc={backgroundSrc}
              show={show}
              setlist={entries}
              showPositionInTour={showPositionInTour}
              showEntryCoachNotes
            />
          </div>,
          document.body,
        )
      : null}
    </SetlistShareCaptureContext.Provider>
  )
}

/**
 * Capture handle for the brain button. Returns null outside the provider so the
 * button still works (posting without an image) if the provider isn't mounted.
 */
export function useSetlistShareCapture(): SetlistShareCaptureContextValue | null {
  return useContext(SetlistShareCaptureContext)
}
