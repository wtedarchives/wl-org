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
import { toJpeg } from "html-to-image"

import { supabase } from "@/lib/supabase"
import { useShowPositionInTour } from "@/hooks/use-show-position-in-tour"
import { pickRandomShareBackground } from "@/lib/wl-home-v2-share-backgrounds"
import { WL_HOME_V2_SETLIST_SHARE_EXPORT_WIDTH_PX } from "@/lib/wl-home-v2-setlist-share-export-config"
import { WlHomeV2SetlistShareExportCard } from "@/components/wl-home-v2/wl-home-v2-setlist-share-export-card"
import type { SetlistEntry, Show } from "@/types/setlist"

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

/** Headroom under the 2,000,000-byte `app.bsky.embed.images` limit. */
const MAX_BYTES = 1_600_000

/** JPEG has no alpha — the capture needs an opaque ground behind the card. */
const CAPTURE_BACKGROUND = "#000000"

/**
 * Instagram canvas: exactly 4:5, the tallest ratio Instagram accepts for a feed
 * image (it rejects anything outside 4:5–1.91:1). The card is centred inside
 * this frame and scaled down when a long setlist would overflow, so the ratio is
 * fixed by construction and can never drift into rejection territory.
 *
 * 576×720 CSS at pixelRatio 2 → 1152×1440, under Instagram's 1440px max width.
 */
const IG_CANVAS_WIDTH_PX = 576
const IG_CANVAS_HEIGHT_PX = 720
const IG_CANVAS_PADDING_PX = 16
const IG_CAPTURE_STEPS = [
  { pixelRatio: 2, quality: 0.9 },
  { pixelRatio: 2, quality: 0.75 },
  { pixelRatio: 1.5, quality: 0.7 },
] as const

/** Instagram's own limit is 8MB; this is comfortable headroom. */
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

const base64FromDataUrl = (dataUrl: string): string | null => {
  const comma = dataUrl.indexOf(",")
  if (comma < 0) return null
  const payload = dataUrl.slice(comma + 1)
  return payload.trim() ? payload : null
}

/** base64 length → decoded byte length, accounting for `=` padding. */
const decodedByteLength = (base64: string): number => {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0
  return Math.floor((base64.length * 3) / 4) - padding
}

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
  const igCaptureRef = useRef<HTMLDivElement | null>(null)
  const igCardRef = useRef<HTMLDivElement | null>(null)
  const [igScale, setIgScale] = useState(1)
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
   * Fit the card to the 4:5 canvas. Scales up to fill the width on short
   * setlists and down to fit the height on long ones. `offsetHeight` ignores
   * transforms, so the measurement stays stable across recalculations.
   */
  useEffect(() => {
    const card = igCardRef.current
    if (!card) return
    const width = card.offsetWidth
    const height = card.offsetHeight
    if (!width || !height) return
    const availableWidth = IG_CANVAS_WIDTH_PX - IG_CANVAS_PADDING_PX * 2
    const availableHeight = IG_CANVAS_HEIGHT_PX - IG_CANVAS_PADDING_PX * 2
    const next = Math.min(availableWidth / width, availableHeight / height)
    setIgScale(Number.isFinite(next) && next > 0 ? next : 1)
  }, [show, entries])

  /**
   * Refetch, commit, and hand back the node to rasterise. The entry being
   * announced was likely just added, and a stale card would omit the very song
   * the post is about.
   */
  const prepareNode = useCallback(
    async (ref: typeof captureRef): Promise<HTMLDivElement | null> => {
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

      return ref.current
    },
    [loadShow, loadEntries],
  )

  /** Try each quality rung until one lands under `maxBytes`. */
  const rasterise = useCallback(
    async (
      node: HTMLDivElement,
      steps: ReadonlyArray<{ pixelRatio: number; quality: number }>,
      maxBytes: number,
      label: string,
    ): Promise<string | null> => {
      for (const step of steps) {
        const dataUrl = await toJpeg(node, {
          cacheBust: true,
          pixelRatio: step.pixelRatio,
          quality: step.quality,
          backgroundColor: CAPTURE_BACKGROUND,
        })
        const base64 = dataUrl ? base64FromDataUrl(dataUrl) : null
        if (!base64) continue
        if (decodedByteLength(base64) <= maxBytes) return base64
      }
      console.error(`${label}: every quality step exceeded the size budget`)
      return null
    },
    [],
  )

  const capture = useCallback(async (): Promise<string | null> => {
    if (!showId) return null
    try {
      const node = await prepareNode(captureRef)
      if (!node) return null
      return await rasterise(node, CAPTURE_STEPS, MAX_BYTES, "share capture")
    } catch (err) {
      console.error("share capture failed:", err)
      return null
    }
  }, [showId, prepareNode, rasterise])

  const captureInstagram = useCallback(async (): Promise<string | null> => {
    if (!showId) return null
    try {
      const node = await prepareNode(igCaptureRef)
      if (!node) return null
      return await rasterise(
        node,
        IG_CAPTURE_STEPS,
        IG_MAX_BYTES,
        "instagram capture",
      )
    } catch (err) {
      console.error("instagram capture failed:", err)
      return null
    }
  }, [showId, prepareNode, rasterise])

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
         * Offscreen rather than hidden: html-to-image needs real layout, so
         * display:none / visibility:hidden would capture nothing.
         */
        createPortal(
          <div
            aria-hidden
            style={{
              position: "fixed",
              top: 0,
              left: -99999,
              width: WL_HOME_V2_SETLIST_SHARE_EXPORT_WIDTH_PX,
              pointerEvents: "none",
              zIndex: -1,
            }}
          >
            <WlHomeV2SetlistShareExportCard
              ref={captureRef}
              backgroundSrc={backgroundSrc}
              show={show}
              setlist={entries}
              showPositionInTour={showPositionInTour}
              showEntryCoachNotes
            />

            {/*
             * Instagram frame — a fixed 4:5 canvas with the same card centred
             * inside it. Instagram rejects feed images outside 4:5–1.91:1, and
             * the card grows with the setlist, so pinning the canvas and scaling
             * the card to fit makes rejection impossible regardless of length.
             */}
            <div
              ref={igCaptureRef}
              style={{
                width: IG_CANVAS_WIDTH_PX,
                height: IG_CANVAS_HEIGHT_PX,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                background: CAPTURE_BACKGROUND,
                position: "relative",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- JPEG capture; must rasterize reliably */}
              <img
                src={backgroundSrc}
                alt=""
                crossOrigin="anonymous"
                draggable={false}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              <div
                style={{
                  position: "relative",
                  transform: `scale(${igScale})`,
                  transformOrigin: "center center",
                }}
              >
                <WlHomeV2SetlistShareExportCard
                  ref={igCardRef}
                  backgroundSrc={backgroundSrc}
                  show={show}
                  setlist={entries}
                  showPositionInTour={showPositionInTour}
                  showEntryCoachNotes
                />
              </div>
            </div>
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
