"use client"

import { useLayoutEffect, useRef, useState } from "react"

const PX_PER_SEC = 36
const GAP_PX = 28

export function IosRadioMarquee({
  text,
  variant,
}: {
  text: string
  variant: "title" | "sub"
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)
  const [scrolling, setScrolling] = useState(false)
  const [durationSec, setDurationSec] = useState(10)

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const measure = measureRef.current
    if (!viewport || !measure) return

    const update = () => {
      const textWidth = measure.scrollWidth
      const viewWidth = viewport.clientWidth
      const overflow = textWidth > viewWidth + 1
      setScrolling(overflow)
      if (overflow) {
        const loopPx = textWidth + GAP_PX
        setDurationSec(Math.max(6, loopPx / PX_PER_SEC))
      }
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(viewport)
    return () => ro.disconnect()
  }, [text, variant])

  return (
    <div
      ref={viewportRef}
      className={`ios-radio-bar__marquee ios-radio-bar__marquee--${variant}${
        scrolling ? " is-scrolling" : ""
      }`}
      title={text}
    >
      {scrolling ?
        <div
          className="ios-radio-bar__marquee-track"
          style={{ ["--ios-radio-marquee-duration" as string]: `${durationSec}s` }}
        >
          <span className="ios-radio-bar__marquee-unit">{text}</span>
          <span className="ios-radio-bar__marquee-unit" aria-hidden>
            {text}
          </span>
        </div>
      : <span className="ios-radio-bar__marquee-unit">{text}</span>}
      <span ref={measureRef} className="ios-radio-bar__marquee-measure">
        {text}
      </span>
    </div>
  )
}
