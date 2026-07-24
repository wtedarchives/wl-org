"use client"

import { useEffect, useId, useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { useTourPosters } from "@/hooks/use-show-poster-image"
import { WlHomeV2SetlistPosterModal } from "@/components/wl-home-v2/wl-home-v2-setlist-poster-modal"
import { Card, CardContent } from "@/components/ui/card"
import "./tour-posters.css"

const ROTATE_MS = 3000

interface TourPostersProps {
  tourName: string
  showIds: string[]
  /** WL Home tour stats: match Guest Appearances widget-panel chrome. */
  wlHomeV2?: boolean
}

/**
 * Tour-associated posters (via tour name and/or linked shows).
 * Dissolves between images; click opens the setlist-style poster modal.
 * Hidden when there are no posters.
 */
export function TourPosters({
  tourName,
  showIds,
  wlHomeV2 = false,
}: TourPostersProps) {
  const posters = useTourPosters(tourName, showIds)
  const [activeIndex, setActiveIndex] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const headingId = useId()

  const withImages = (posters ?? []).filter((p) => Boolean(p.image?.trim()))
  const urls = withImages.map((p) => p.image!.trim())
  const activeUrl = urls[activeIndex] ?? urls[0] ?? ""

  const showLabelsByUuid = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const p of posters ?? []) {
      if (!p.image?.trim() || p.showLabels.length === 0) continue
      map[p.uuid] = p.showLabels
    }
    return map
  }, [posters])

  useEffect(() => {
    setActiveIndex(0)
  }, [posters])

  useEffect(() => {
    if (urls.length <= 1 || modalOpen) return
    if (typeof window !== "undefined") {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")
      if (reduce.matches) return
    }
    const id = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % urls.length)
    }, ROTATE_MS)
    return () => window.clearInterval(id)
  }, [posters, urls.length, modalOpen])

  if (posters == null || withImages.length === 0 || !activeUrl) return null

  const gallery = (
    <button
      type="button"
      className="tour-posters-gallery"
      title="View posters"
      aria-label="View tour posters"
      onClick={() => setModalOpen(true)}
    >
      {urls.map((url, index) => (
        // eslint-disable-next-line @next/next/no-img-element -- dissolve layer needs plain img
        <img
          key={`${withImages[index]?.uuid ?? url}-${url}`}
          src={url}
          alt={index === activeIndex ? "Tour poster" : ""}
          aria-hidden={index !== activeIndex}
          className={cn(
            "tour-posters-gallery__img",
            index === activeIndex && "tour-posters-gallery__img--active",
          )}
        />
      ))}
    </button>
  )

  const modal = (
    <WlHomeV2SetlistPosterModal
      open={modalOpen}
      onClose={() => setModalOpen(false)}
      headingId={headingId}
      posters={withImages}
      initialIndex={activeIndex}
      hideTours
      showLabelsByUuid={showLabelsByUuid}
    />
  )

  if (wlHomeV2) {
    return (
      <>
        <div className="widget-panel tour-posters-panel w-full min-w-0 shrink-0 overflow-hidden">
          <div className="wp-head wl-home-v2-years-shows-wp-head">
            <span className="min-w-0 truncate">Posters</span>
          </div>
          {gallery}
        </div>
        {modal}
      </>
    )
  }

  return (
    <>
      <Card className="ring-0 overflow-hidden border border-border/60 bg-card/80 py-0">
        <div className="bg-muted/60 px-3 py-1.5">
          <h2 className="text-sm font-semibold">Posters</h2>
        </div>
        <CardContent className="p-0">{gallery}</CardContent>
      </Card>
      {modal}
    </>
  )
}
