"use client"

import { useCallback, useEffect, useId, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  setlistUrlRequestsPoster,
  stripSetlistModalQueryParams,
} from "@/lib/setlist-archive-url"
import type { ShowPosterRecord } from "@/types/admin"
import { WlHomeV2SetlistPosterModal } from "@/components/wl-home-v2/wl-home-v2-setlist-poster-modal"

const ROTATE_MS = 3000

type ShowHeaderPosterProps = {
  posters: ShowPosterRecord[]
  alt?: string
  /** When false, only the modal is mounted (for deep links without a visible thumbnail). */
  showThumbnail?: boolean
}

/** Setlist header poster — 1:1 window matching `.left` height; opens poster modal on click. */
export function WlHomeV2SetlistShowHeaderPoster({
  posters,
  alt = "Show poster",
  showThumbnail = true,
}: ShowHeaderPosterProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const headingId = useId()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const withImages = posters.filter((p) => Boolean(p.image?.trim()))
  const urls = withImages.map((p) => p.image!.trim())
  const activeUrl = urls[activeIndex] ?? urls[0] ?? ""

  useEffect(() => {
    setActiveIndex(0)
  }, [posters])

  useEffect(() => {
    if (urls.length === 0) return
    if (setlistUrlRequestsPoster(searchParams)) {
      setModalOpen(true)
    }
  }, [searchParams, urls.length])

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

  const closeModal = useCallback(() => {
    setModalOpen(false)
    if (!setlistUrlRequestsPoster(searchParams)) return
    const next = stripSetlistModalQueryParams(searchParams, { poster: true })
    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname || "/", {
      scroll: false,
    })
  }, [pathname, router, searchParams])

  if (!activeUrl) return null

  return (
    <>
      {showThumbnail ?
        <button
          type="button"
          className="show-header-poster"
          title="View poster"
          aria-label="View show poster"
          onClick={() => setModalOpen(true)}
        >
          {urls.map((url, index) => (
            // eslint-disable-next-line @next/next/no-img-element -- stretch-to-row height needs plain img sizing
            <img
              key={`${withImages[index]?.uuid ?? url}-${url}`}
              src={url}
              alt={index === activeIndex ? alt : ""}
              aria-hidden={index !== activeIndex}
              className={cn(
                "show-header-poster__img",
                index === activeIndex && "show-header-poster__img--active",
              )}
            />
          ))}
        </button>
      : null}
      <WlHomeV2SetlistPosterModal
        open={modalOpen}
        onClose={closeModal}
        headingId={headingId}
        posters={withImages}
        initialIndex={activeIndex}
      />
    </>
  )
}
