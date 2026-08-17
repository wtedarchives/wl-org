"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"

import { WlHomeV2SetlistShareExportCard } from "@/components/wl-home-v2/wl-home-v2-setlist-share-export-card"
import type { ShowPositionInTour } from "@/hooks/use-show-position-in-tour"
import {
  resolveShareCardShowEntryCoachNotes,
  resolveShareCardShowId,
  SHARE_CARD_READY_SELECTOR,
} from "@/lib/share-card-url"
import { supabase } from "@/lib/supabase"
import { pickShareBackgroundForShow } from "@/lib/wl-home-v2-share-backgrounds"
import type { SetlistEntry, Show } from "@/types/setlist"

import "./wl-home-v2-share-card-page.css"

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

type PageStatus = "loading" | "ready" | "error"

async function loadTourPosition(
  showId: string,
  tourName: string,
): Promise<ShowPositionInTour | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from("shows")
    .select("show_id, show_canonid, show_date, show_group")
    .eq("show_tour", tourName)
  if (error || !data?.length) return null

  const sorted = [...data].sort(
    (
      a: { show_date: string; show_canonid: number | null; show_group: string },
      b: { show_date: string; show_canonid: number | null; show_group: string },
    ) => {
      const timeA = new Date(a.show_date).getTime()
      const timeB = new Date(b.show_date).getTime()
      if (timeA !== timeB) return timeA - timeB
      const aCanon = a.show_canonid !== null
      const bCanon = b.show_canonid !== null
      if (aCanon && bCanon) return a.show_canonid! - b.show_canonid!
      if (aCanon) return -1
      if (bCanon) return 1
      return (a.show_group ?? "").localeCompare(b.show_group ?? "")
    },
  )
  const index = sorted.findIndex((row: { show_id: string }) => row.show_id === showId)
  return index >= 0 ? { position: index + 1, total: sorted.length } : null
}

async function waitForCardPaint(root: HTMLElement): Promise<void> {
  if (document.fonts?.ready) await document.fonts.ready
  const images = Array.from(root.querySelectorAll("img"))
  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth > 0) {
        return img.decode().catch(() => undefined)
      }
      return new Promise<void>((resolve) => {
        img.addEventListener("load", () => resolve(), { once: true })
        img.addEventListener("error", () => resolve(), { once: true })
      })
    }),
  )
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}

export function WlHomeV2ShareCardPage() {
  const searchParams = useSearchParams()
  const showId = resolveShareCardShowId(searchParams)
  const showEntryCoachNotes = resolveShareCardShowEntryCoachNotes(searchParams)

  const [status, setStatus] = useState<PageStatus>("loading")
  const [errorMessage, setErrorMessage] = useState("Missing show id.")
  const [show, setShow] = useState<Show | null>(null)
  const [entries, setEntries] = useState<SetlistEntry[]>([])
  const [tourPosition, setTourPosition] = useState<ShowPositionInTour | null>(
    null,
  )
  const [painted, setPainted] = useState(false)
  const cardRef = useRef<HTMLDivElement | null>(null)

  const backgroundSrc = useMemo(
    () => (showId ? pickShareBackgroundForShow(showId) : ""),
    [showId],
  )

  useEffect(() => {
    let cancelled = false
    setPainted(false)
    setShow(null)
    setEntries([])
    setTourPosition(null)

    if (!showId || !supabase) {
      setErrorMessage(showId ? "Missing Supabase configuration." : "Missing show id.")
      setStatus("error")
      return
    }

    setStatus("loading")
    void (async () => {
      const { data: showRow, error: showError } = await supabase
        .from("shows")
        .select("*")
        .eq("show_id", showId)
        .maybeSingle()
      if (cancelled) return
      if (showError || !showRow) {
        setErrorMessage(showError?.message ?? "Show not found.")
        setStatus("error")
        return
      }

      const nextShow = showRow as Show
      const [{ data: entryRows, error: entryError }, nextTour] = await Promise.all([
        supabase
          .from("setlist_entries")
          .select(ENTRY_SELECT)
          .eq("entry_show", showId)
          .order("entry_set", { ascending: true })
          .order("entry_setnum", { ascending: true }),
        nextShow.show_tour?.trim() ?
          loadTourPosition(showId, nextShow.show_tour.trim())
        : Promise.resolve(null),
      ])
      if (cancelled) return
      if (entryError) {
        setErrorMessage(entryError.message)
        setStatus("error")
        return
      }

      setShow(nextShow)
      setEntries((entryRows ?? []) as unknown as SetlistEntry[])
      setTourPosition(nextTour)
      setStatus("ready")
    })()

    return () => {
      cancelled = true
    }
  }, [showId])

  useEffect(() => {
    if (status !== "ready" || !show || !cardRef.current) return
    let cancelled = false
    const node = cardRef.current
    void waitForCardPaint(node).then(() => {
      if (!cancelled) setPainted(true)
    })
    return () => {
      cancelled = true
    }
  }, [status, show, entries, tourPosition, showEntryCoachNotes])

  const readySelectorId = SHARE_CARD_READY_SELECTOR.slice(1)

  return (
    <div
      className="wl-home-v2-share-card-page"
      data-share-card-status={painted ? "ready" : status}
    >
      {status === "error" ?
        <p className="wl-home-v2-share-card-page__status">{errorMessage}</p>
      : status === "loading" || !show || !backgroundSrc ?
        <p className="wl-home-v2-share-card-page__status">Loading setlist card…</p>
      : <>
          <WlHomeV2SetlistShareExportCard
            ref={cardRef}
            backgroundSrc={backgroundSrc}
            show={show}
            setlist={entries}
            showPositionInTour={tourPosition}
            showEntryCoachNotes={showEntryCoachNotes}
          />
          {painted ?
            <span
              id={readySelectorId}
              className="wl-home-v2-share-card-page__ready"
              aria-hidden
            />
          : null}
        </>
      }
    </div>
  )
}
