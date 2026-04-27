"use client"

import type { RefObject } from "react"
import { useEffect, useRef } from "react"

export type WlHomeV2TrailHue = "orange" | "green" | "white" | "rainbow"

type Tweaks = {
  trailEnabled: boolean
  density: number
  hue: WlHomeV2TrailHue
}

/** Interactive surfaces that switch the custom cursor to the link / CTA (green) palette. */
export const WL_HOME_V2_CURSOR_INTERACTIVE_SELECTOR = [
  "a[href]",
  "button:not(:disabled)",
  '[role="link"]',
  '[role="button"]:not([aria-disabled="true"])',
  'input[type="submit"]:not(:disabled)',
  'input[type="button"]:not(:disabled)',
  'input[type="reset"]:not(:disabled)',
  "label[for]",
  "summary",
  ".tile",
].join(",")

function syncInteractiveHover(
  clientX: number,
  clientY: number,
): boolean {
  const top = document.elementFromPoint(clientX, clientY)
  if (!top) return false
  return top.closest(WL_HOME_V2_CURSOR_INTERACTIVE_SELECTOR) != null
}

export function useWlHomeV2CursorTrail(
  coreRef: RefObject<HTMLDivElement | null>,
  ringRef: RefObject<HTMLDivElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  trailEnabled: boolean,
  density: number,
  hue: WlHomeV2TrailHue,
  onFinePointer: (fine: boolean) => void,
) {
  const tweaksRef = useRef<Tweaks>({ trailEnabled, density, hue })
  tweaksRef.current = { trailEnabled, density, hue }

  useEffect(() => {
    const core = coreRef.current
    const ring = ringRef.current
    const canvas = canvasRef.current
    if (!core || !ring || !canvas) return

    const coreEl = core
    const ringEl = ring

    const isFine = window.matchMedia("(pointer: fine)").matches
    onFinePointer(isFine)
    if (!isFine) {
      coreEl.style.display = "none"
      ringEl.style.display = "none"
      canvas.style.display = "none"
      return () => onFinePointer(false)
    }

    coreEl.style.display = ""
    ringEl.style.display = ""
    canvas.style.display = ""

    const cnv = canvas
    const ctx2d = cnv.getContext("2d")
    if (!ctx2d) return () => onFinePointer(false)
    const ctx = ctx2d

    function resize() {
      cnv.width = window.innerWidth * devicePixelRatio
      cnv.height = window.innerHeight * devicePixelRatio
      cnv.style.width = `${window.innerWidth}px`
      cnv.style.height = `${window.innerHeight}px`
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
    }
    resize()
    window.addEventListener("resize", resize)

    let mx = window.innerWidth / 2
    let my = window.innerHeight / 2
    let rx = mx
    let ry = my
    const particles: {
      x: number
      y: number
      vx: number
      vy: number
      r: number
      life: number
      decay: number
      born: number
    }[] = []

    function hueColor(alpha: number, t: number, hue: WlHomeV2TrailHue) {
      switch (hue) {
        case "green":
          return `rgba(88,200,174,${alpha})`
        case "white":
          return `rgba(239,254,250,${alpha})`
        case "rainbow": {
          const h = (t * 0.15) % 360
          return `hsla(${h}, 85%, 65%, ${alpha})`
        }
        default:
          return `rgba(255,122,103,${alpha})`
      }
    }

    function ringColor(hue: WlHomeV2TrailHue) {
      switch (hue) {
        case "green":
          return "rgba(88,200,174,0.6)"
        case "white":
          return "rgba(239,254,250,0.6)"
        case "rainbow":
          return `hsla(${(performance.now() * 0.15) % 360},85%,65%,0.65)`
        default:
          return "rgba(255,122,103,0.55)"
      }
    }

    function ringBorderColor(hue: WlHomeV2TrailHue, hovered: boolean) {
      if (hovered) {
        switch (hue) {
          case "green":
            return "rgba(120,220,195,0.85)"
          case "white":
            return "rgba(255,255,255,0.85)"
          case "rainbow":
            return `hsla(${(performance.now() * 0.15) % 360},85%,72%,0.8)`
          default:
            return "rgba(255,185,153,0.7)"
        }
      }
      return ringColor(hue)
    }

    function coreColor(hue: WlHomeV2TrailHue) {
      switch (hue) {
        case "green":
          return "oklch(0.76 0.06 163)"
        case "white":
          return "#effefa"
        case "rainbow":
          return `hsl(${(performance.now() * 0.15) % 360},85%,62%)`
        default:
          return "oklch(0.72 0.15 25)"
      }
    }

    /** Solid inner dot: brighter when hovering interactive targets (matches reference `.cursor-core.hov`). */
    function coreFillColor(hue: WlHomeV2TrailHue, hovered: boolean) {
      if (hovered) {
        switch (hue) {
          case "green":
            return "oklch(0.82 0.07 163)"
          case "white":
            return "#ffffff"
          case "rainbow":
            return coreColor(hue)
          default:
            return "oklch(0.82 0.10 55)"
        }
      }
      return coreColor(hue)
    }

    const onEnter = () => {
      coreEl.classList.add("hov")
      ringEl.classList.add("hov")
    }
    const onLeave = () => {
      coreEl.classList.remove("hov")
      ringEl.classList.remove("hov")
    }

    const onMove = (e: MouseEvent) => {
      mx = e.clientX
      my = e.clientY
      if (syncInteractiveHover(e.clientX, e.clientY)) onEnter()
      else onLeave()
      const { trailEnabled: te, density: d } = tweaksRef.current
      if (te && d > 0) {
        const count = d
        for (let i = 0; i < count; i++) {
          particles.push({
            x: mx + (Math.random() - 0.5) * 6,
            y: my + (Math.random() - 0.5) * 6,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8 + 0.2,
            r: 2 + Math.random() * 4,
            life: 1,
            decay: 0.015 + Math.random() * 0.02,
            born: performance.now(),
          })
        }
        if (particles.length > 600) particles.splice(0, particles.length - 600)
      }
    }
    window.addEventListener("mousemove", onMove, { passive: true })
    const onBlur = () => onLeave()
    const onVis = () => {
      if (document.visibilityState === "hidden") onLeave()
    }
    window.addEventListener("blur", onBlur)
    document.addEventListener("visibilitychange", onVis)

    let raf = 0
    function tick() {
      const { hue: h } = tweaksRef.current
      rx += (mx - rx) * 0.18
      ry += (my - ry) * 0.18
      coreEl.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`
      ringEl.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`
      const hovered = coreEl.classList.contains("hov")
      /** Interactive hover: paint ring, core, and trail in brand green (any base trail hue). */
      const paintHue: WlHomeV2TrailHue = hovered ? "green" : h
      coreEl.style.border = "none"
      coreEl.style.background = coreFillColor(paintHue, hovered)
      ringEl.style.border = `1.5px solid ${ringBorderColor(paintHue, hovered)}`

      ctx.clearRect(0, 0, cnv.width, cnv.height)
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.02
        p.life -= p.decay
        if (p.life <= 0) {
          particles.splice(i, 1)
          continue
        }
        const a = p.life * 0.7
        ctx.beginPath()
        const t = performance.now() - p.born
        ctx.fillStyle = hueColor(a, t, paintHue)
        ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2)
        ctx.fill()
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("blur", onBlur)
      document.removeEventListener("visibilitychange", onVis)
      onFinePointer(false)
    }
  }, [onFinePointer, coreRef, ringRef, canvasRef])
}
