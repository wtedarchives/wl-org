"use client"

import { useEffect, useRef } from "react"

const LAYERS = [
  { color: "rgba(230, 108, 53, 0.42)", gain: 1.1, binStart: 2, binEnd: 18 },
  { color: "rgba(115, 81, 166, 0.48)", gain: 0.94, binStart: 6, binEnd: 28 },
  { color: "rgba(178, 100, 120, 0.52)", gain: 0.78, binStart: 10, binEnd: 40 },
  { color: "rgba(6, 125, 204, 0.55)", gain: 0.61, binStart: 1, binEnd: 22 },
] as const

const POINTS = 28
const LERP = 0.09

function sampleBin(data: Uint8Array, start: number, end: number, t: number) {
  const span = Math.max(1, end - start)
  const index = start + Math.min(span - 1, Math.floor(t * span))
  const prev = data[Math.max(start, index - 1)] ?? 0
  const curr = data[index] ?? 0
  const next = data[Math.min(end - 1, index + 1)] ?? 0
  return (prev + curr * 2 + next) / 4 / 255
}

function lerpDisplay(display: Float32Array, target: number[]) {
  for (let i = 0; i < display.length; i++) {
    const next = target[i] ?? 0
    display[i] = display[i]! + (next - display[i]!) * LERP
  }
}

function strokeWave(
  ctx: CanvasRenderingContext2D,
  values: Float32Array,
  width: number,
  height: number,
  gain: number,
) {
  const last = values.length - 1
  const xAt = (i: number) => (i / last) * width
  const yAt = (i: number) => {
    const peaked = Math.pow(Math.max(0, values[i] ?? 0), 0.9)
    return height - Math.min(height, peaked * gain * height)
  }

  ctx.beginPath()
  ctx.moveTo(0, height)
  ctx.lineTo(0, yAt(0))
  for (let i = 0; i < last; i++) {
    const p0 = i === 0 ? 0 : i - 1
    const p1 = i
    const p2 = i + 1
    const p3 = i + 2 > last ? last : i + 2
    const x1 = xAt(p1)
    const y1 = yAt(p1)
    const x2 = xAt(p2)
    const y2 = yAt(p2)
    ctx.bezierCurveTo(
      x1 + (xAt(p2) - xAt(p0)) / 6,
      y1 + (yAt(p2) - yAt(p0)) / 6,
      x2 - (xAt(p3) - xAt(p1)) / 6,
      y2 - (yAt(p3) - yAt(p1)) / 6,
      x2,
      y2,
    )
  }
  ctx.lineTo(width, height)
  ctx.closePath()
}

export function IosRadioBarVisualizer({
  analyser,
  active,
}: {
  analyser: AnalyserNode | null
  active: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !analyser || !active) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return
    }

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const bins = new Uint8Array(analyser.frequencyBinCount)
    const displays = LAYERS.map(() => new Float32Array(POINTS + 1))
    let raf = 0
    let running = true
    let lastW = 0
    let lastH = 0

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const rect = canvas.getBoundingClientRect()
      const w = Math.max(1, Math.round(rect.width * dpr))
      const h = Math.max(1, Math.round(rect.height * dpr))
      if (w === lastW && h === lastH) return
      lastW = w
      lastH = h
      canvas.width = w
      canvas.height = h
    }

    const draw = () => {
      if (!running) return
      resize()
      analyser.getByteFrequencyData(bins)
      const { width, height } = canvas
      ctx.clearRect(0, 0, width, height)
      LAYERS.forEach((layer, layerIndex) => {
        const target: number[] = []
        for (let i = 0; i <= POINTS; i++) {
          target.push(sampleBin(bins, layer.binStart, layer.binEnd, i / POINTS))
        }
        const display = displays[layerIndex]!
        lerpDisplay(display, target)
        strokeWave(ctx, display, width, height, layer.gain)
        ctx.fillStyle = layer.color
        ctx.fill()
      })
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => {
      running = false
      cancelAnimationFrame(raf)
    }
  }, [analyser, active])

  if (!active || !analyser) return null

  return (
    <canvas
      ref={canvasRef}
      className="ios-radio-bar__visualizer"
      aria-hidden
    />
  )
}
