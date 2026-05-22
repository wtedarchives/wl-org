"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

export type RotatingBandcampArtworkProps = {
  images: readonly string[]
  intervalMs: number
  className?: string
  /** For `next/image` `sizes` when using a non-default box. */
  imageSizes?: string
}

export function RotatingBandcampArtwork({
  images,
  intervalMs,
  className,
  imageSizes = "24px",
}: RotatingBandcampArtworkProps) {
  const [index, setIndex] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduceMotion(mql.matches)
    const onChange = () => setReduceMotion(mql.matches)
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  useEffect(() => {
    if (reduceMotion || images.length <= 1) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % images.length)
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [reduceMotion, intervalMs, images.length])

  if (images.length === 0) return null

  return (
    <span
      className={cn(
        "relative size-6 shrink-0 overflow-hidden rounded-sm border border-neutral-700/30",
        className,
      )}
      aria-hidden
    >
      {images.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          sizes={imageSizes}
          className={cn(
            "object-cover transition-opacity duration-500 ease-in-out motion-reduce:transition-none",
            i === index ? "z-[1] opacity-100" : "z-0 opacity-0",
          )}
          unoptimized
          onError={(e) => {
            const el = e.target as HTMLImageElement
            if (el) el.style.display = "none"
          }}
        />
      ))}
    </span>
  )
}

export const DRIPFIELD_ROTATING_IMAGES = [
  "https://f4.bcbits.com/img/a4268106680_10.jpg",
  "https://f4.bcbits.com/img/a0624853062_10.jpg",
  "https://f4.bcbits.com/img/a1427709217_10.jpg",
] as const

export const DRIPFIELD_ROTATE_MS = 2000

export function DripfieldRotatingArtwork({
  className,
  imageSizes,
}: Pick<RotatingBandcampArtworkProps, "className" | "imageSizes">) {
  return (
    <RotatingBandcampArtwork
      images={DRIPFIELD_ROTATING_IMAGES}
      intervalMs={DRIPFIELD_ROTATE_MS}
      className={className}
      imageSizes={imageSizes}
    />
  )
}

/** Full album / EP performances list (`category_complete`). */
export const CATEGORY_COMPLETE_ROTATING_IMAGES = [
  "https://f4.bcbits.com/img/a2223100564_10.jpg",
  "https://f4.bcbits.com/img/a1944816514_10.jpg",
  "https://f4.bcbits.com/img/a1517447168_10.jpg",
  "https://f4.bcbits.com/img/a0238290447_10.jpg",
  "https://f4.bcbits.com/img/a3138437016_10.jpg",
  "https://f4.bcbits.com/img/a2590856745_10.jpg",
  "https://f4.bcbits.com/img/a1186995527_10.jpg",
  "https://f4.bcbits.com/img/a3562184768_10.jpg",
  "https://f4.bcbits.com/img/a4008514666_10.jpg",
] as const

export const CATEGORY_COMPLETE_ROTATE_MS = 1750

export function CategoryCompleteRotatingArtwork({
  className,
  imageSizes,
}: Pick<RotatingBandcampArtworkProps, "className" | "imageSizes">) {
  return (
    <RotatingBandcampArtwork
      images={CATEGORY_COMPLETE_ROTATING_IMAGES}
      intervalMs={CATEGORY_COMPLETE_ROTATE_MS}
      className={className}
      imageSizes={imageSizes}
    />
  )
}

/** Jive suite list (`jive_complete`) / setlist Jive badge. */
export const JIVE_ROTATING_IMAGES = [
  "https://i.postimg.cc/3xqM6kdr/jive1.png",
  "https://i.postimg.cc/6pPsS8yQ/jive2.png",
  "https://i.postimg.cc/XYPMhrpJ/jivelee.png",
] as const

export const JIVE_ROTATE_MS = 1250

export function JiveRotatingArtwork({
  className,
  imageSizes,
}: Pick<RotatingBandcampArtworkProps, "className" | "imageSizes">) {
  return (
    <RotatingBandcampArtwork
      images={JIVE_ROTATING_IMAGES}
      intervalMs={JIVE_ROTATE_MS}
      className={className}
      imageSizes={imageSizes}
    />
  )
}

/** Cover-song themed lists (segues, popular placements, unfinished/reprised archive headers). */
export const COVER_SONGS_ROTATING_IMAGES = [
  "https://i.postimg.cc/T3CcwTqj/image.jpg",
  "https://f4.bcbits.com/img/a2223100564_10.jpg",
  "https://f4.bcbits.com/img/a1944816514_10.jpg",
  "https://f4.bcbits.com/img/a1517447168_10.jpg",
  "https://f4.bcbits.com/img/a0238290447_10.jpg",
  "https://f4.bcbits.com/img/a3138437016_10.jpg",
] as const

export const COVER_SONGS_ROTATE_MS = 2000

export function CoverSongsRotatingArtwork({
  className,
  imageSizes,
}: Pick<RotatingBandcampArtworkProps, "className" | "imageSizes">) {
  return (
    <RotatingBandcampArtwork
      images={COVER_SONGS_ROTATING_IMAGES}
      intervalMs={COVER_SONGS_ROTATE_MS}
      className={className}
      imageSizes={imageSizes}
    />
  )
}
