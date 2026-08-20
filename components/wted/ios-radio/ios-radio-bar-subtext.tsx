"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"

import { IosRadioMarquee } from "@/components/wted/ios-radio/ios-radio-bar-marquee"

const PX_PER_SEC = 36
const ROTATE_MS = 8_000
const DISSOLVE_MS = 400

type SubSlide = {
  text: string
  live?: boolean
  online?: boolean
}

function SubLiveDot({ online }: { online: boolean }) {
  return (
    <span
      className={
        online ?
          "ios-radio-bar__live-dot"
        : "ios-radio-bar__live-dot ios-radio-bar__live-dot--off"
      }
    />
  )
}

function SubSlideBody({ slide }: { slide: SubSlide }) {
  return (
    <div
      className={
        slide.live ? "ios-radio-bar__live" : "ios-radio-bar__sub-plain"
      }
    >
      {slide.live ?
        <SubLiveDot online={slide.online !== false} />
      : null}
      <IosRadioMarquee text={slide.text} variant="sub" />
    </div>
  )
}

function DualMarquee({ slides }: { slides: [SubSlide, SubSlide] }) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)
  const [durationSec, setDurationSec] = useState(12)

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const measure = measureRef.current
    if (!viewport || !measure) return

    const update = () => {
      const loopPx = measure.scrollWidth
      if (loopPx > 0) setDurationSec(Math.max(8, loopPx / PX_PER_SEC))
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(viewport)
    ro.observe(measure)
    return () => ro.disconnect()
  }, [slides[0].text, slides[1].text])

  return (
    <div
      ref={viewportRef}
      className="ios-radio-bar__marquee ios-radio-bar__marquee--sub is-scrolling ios-radio-bar__sub-scroll-marquee"
      title={`${slides[0].text} · ${slides[1].text}`}
    >
      <div
        className="ios-radio-bar__marquee-track"
        style={{ ["--ios-radio-marquee-duration" as string]: `${durationSec}s` }}
      >
        {[0, 1].map((copy) => (
          <span
            key={copy}
            ref={copy === 0 ? measureRef : undefined}
            className="ios-radio-bar__sub-scroll-copy"
            aria-hidden={copy === 1}
          >
            {slides.map((slide, i) => (
              <span key={`${copy}-${i}`} className="ios-radio-bar__marquee-unit">
                {slide.live ?
                  <SubLiveDot online={slide.online !== false} />
                : null}
                {slide.text}
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}

function DissolveSub({ slides }: { slides: [SubSlide, SubSlide] }) {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    setIndex(0)
    setVisible(true)
  }, [slides[0].text, slides[1].text])

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduced) return

    let dissolveId: number | undefined
    const rotate = () => {
      setVisible(false)
      dissolveId = window.setTimeout(() => {
        setIndex((i) => (i === 0 ? 1 : 0))
        setVisible(true)
      }, DISSOLVE_MS)
    }
    const intervalId = window.setInterval(rotate, ROTATE_MS)
    return () => {
      window.clearInterval(intervalId)
      if (dissolveId !== undefined) window.clearTimeout(dissolveId)
    }
  }, [slides[0].text, slides[1].text])

  return (
    <div className="ios-radio-bar__sub-dissolve">
      {slides.map((slide, i) => (
        <div
          key={`${slide.text}-${i}`}
          className={[
            "ios-radio-bar__sub-slide",
            i === index && visible ? "" : "is-hidden",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-hidden={i !== index}
        >
          <SubSlideBody slide={slide} />
        </div>
      ))}
    </div>
  )
}

export function IosRadioBarSubtext({
  primary,
  episode,
  live,
  online,
}: {
  primary: string
  episode: string | null
  live: boolean
  online: boolean
}) {
  const first: SubSlide = live ?
    { text: primary, live: true, online }
  : { text: primary }
  const second =
    episode && episode !== primary ? { text: episode } : null

  if (!second) {
    return <SubSlideBody slide={first} />
  }

  const slides: [SubSlide, SubSlide] = [first, second]

  return (
    <div className="ios-radio-bar__sub">
      <div className="ios-radio-bar__sub--mobile">
        <DualMarquee slides={slides} />
      </div>
      <div className="ios-radio-bar__sub--desktop">
        <DissolveSub slides={slides} />
      </div>
    </div>
  )
}
