"use client"

import { useCallback, useEffect, useState } from "react"

import { cn } from "@/lib/utils"

import { CommunityArchiveSection } from "@/components/community-archive-section"
import { useBumpHomeRadioEmbedPulse } from "@/components/persistent-radio"
import { WlHomeHero } from "@/components/wl-home-hero"
import {
  HOME_BG_IMAGES,
  HOME_BG_ROTATION_MS,
  scrollMainInsetToTopThenPulse,
} from "@/components/wl-home-shared"
import { WlHomeWtedSection } from "@/components/wl-home-wted-section"

export function WlHome() {
  const bumpHomeRadioEmbedPulse = useBumpHomeRadioEmbedPulse()
  const [homeBgIndex, setHomeBgIndex] = useState(0)

  const handleWtedCardClick = useCallback(() => {
    scrollMainInsetToTopThenPulse(bumpHomeRadioEmbedPulse)
  }, [bumpHomeRadioEmbedPulse])

  useEffect(() => {
    const id = window.setInterval(() => {
      setHomeBgIndex((i) => (i + 1) % HOME_BG_IMAGES.length)
    }, HOME_BG_ROTATION_MS)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-b-none bg-wl-dark-green md:rounded-b-xl">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {HOME_BG_IMAGES.map((src, i) => (
          <div
            key={src}
            className={cn(
              "absolute inset-0 bg-cover bg-center bg-fixed transition-opacity duration-1000 ease-in-out motion-reduce:transition-none motion-reduce:duration-0",
              i === homeBgIndex ? "opacity-100" : "opacity-0",
            )}
            style={{ backgroundImage: `url('${src}')` }}
          />
        ))}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(40,91,78,0.8),rgba(40,91,78,0.8))]"
          aria-hidden
        />
      </div>
      <main className="relative z-10 flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
          <WlHomeHero onWtedInlineLinkClick={handleWtedCardClick} />
          <WlHomeWtedSection onWtedCardClick={handleWtedCardClick} />
          <CommunityArchiveSection />
        </div>
      </main>
    </div>
  )
}
