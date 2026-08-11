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

type SetlistShareCaptureContextValue = {
  /**
   * Base64 JPEG (no data: prefix) of the setlist share card with coach notes,
   * or null when capture isn't possible. Never throws — a failed capture must
   * not block the Discourse/push/Bluesky send.
   */
  capture: () => Promise<string | null>
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
  const [show, setShow] = useState<Show | null>(null)
  const [entries, setEntries] = useState<SetlistEntry[]>([])

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

  const capture = useCallback(async (): Promise<string | null> => {
    if (!showId) return null
    try {
      // Refetch first: the entry being announced was likely just added, and a
      // stale card would omit the very song this post is about.
      const [freshShow, freshEntries] = await Promise.all([
        loadShow(),
        loadEntries(),
      ])
      if (!freshShow || freshEntries.length === 0) return null
      setShow(freshShow)
      setEntries(freshEntries)

      // Let React commit the refreshed card before rasterising it.
      await new Promise((resolve) =>
        requestAnimationFrame(() => resolve(null)),
      )
      await new Promise((resolve) =>
        requestAnimationFrame(() => resolve(null)),
      )

      const node = captureRef.current
      if (!node) return null

      for (const step of CAPTURE_STEPS) {
        const dataUrl = await toJpeg(node, {
          cacheBust: true,
          pixelRatio: step.pixelRatio,
          quality: step.quality,
          backgroundColor: CAPTURE_BACKGROUND,
        })
        const base64 = dataUrl ? base64FromDataUrl(dataUrl) : null
        if (!base64) continue
        if (decodedByteLength(base64) <= MAX_BYTES) return base64
      }

      console.error(
        "share capture: every quality step exceeded the size budget",
      )
      return null
    } catch (err) {
      console.error("share capture failed:", err)
      return null
    }
  }, [showId, loadShow, loadEntries])

  const value = useMemo<SetlistShareCaptureContextValue>(
    () => ({ capture }),
    [capture],
  )

  return (
    <SetlistShareCaptureContext.Provider value={value}>
      {children}
      {show && entries.length > 0 ? (
        /* Offscreen rather than hidden — html-to-image needs real layout, so
           display:none / visibility:hidden would capture nothing. */
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
        </div>
      ) : null}
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
