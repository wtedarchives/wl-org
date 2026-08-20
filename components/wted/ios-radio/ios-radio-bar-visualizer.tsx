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
const FREQ_LIVE_MIN = 6
const ENVELOPE_ATTACK = 0.1
const ENVELOPE_RELEASE = 0.08
const ENVELOPE_REST = 0.003

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

function maxByte(data: Uint8Array) {
  let max = 0
  for (let i = 0; i < data.length; i++) {
    const value = data[i] ?? 0
    if (value > max) max = value
  }
  return max
}

function timeDomainPeak(data: Uint8Array) {
  let peak = 0
  for (let i = 0; i < data.length; i++) {
    const delta = Math.abs((data[i] ?? 128) - 128)
    if (delta > peak) peak = delta
  }
  return peak / 128
}

/** iOS Safari often returns silence from MediaElementSource; keep the waves moving. */
function fallbackWave(nowMs: number, layerIndex: number, energy: number) {
  const t = nowMs / 1000
  const amp = 0.35 + energy * 0.55
  const target: number[] = []
  for (let i = 0; i <= POINTS; i++) {
    const x = i / POINTS
    const wave =
      amp *
      (0.55 +
        0.28 * Math.sin(t * (0.85 + layerIndex * 0.17) + x * 5.1) +
        0.17 * Math.sin(t * (1.45 + layerIndex * 0.11) + x * 9.4 + layerIndex * 0.7))
    target.push(Math.max(0.06, Math.min(1, wave)))
  }
  return target
}

function layerTargets(
  analyser: AnalyserNode | null,
  freq: Uint8Array,
  time: Uint8Array,
  nowMs: number,
): number[][] {
  if (analyser) {
    analyser.getByteFrequencyData(freq)
    if (maxByte(freq) >= FREQ_LIVE_MIN) {
      return LAYERS.map((layer) => {
        const target: number[] = []
        for (let i = 0; i <= POINTS; i++) {
          target.push(sampleBin(freq, layer.binStart, layer.binEnd, i / POINTS))
        }
        return target
      })
    }
    analyser.getByteTimeDomainData(time)
  }
  const energy = analyser ? Math.min(1, timeDomainPeak(time) * 2.2) : 0.55
  return LAYERS.map((_, layerIndex) => fallbackWave(nowMs, layerIndex, energy))
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
  const activeRef = useRef(active)
  const analyserRef = useRef(analyser)
  const startLoopRef = useRef<(() => void) | null>(null)

  activeRef.current = active
  analyserRef.current = analyser

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return
    }

    const freq = new Uint8Array(256)
    const time = new Uint8Array(512)
    const displays = LAYERS.map(() => new Float32Array(POINTS + 1))
    let envelope = 0
    let raf = 0
    let running = false
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

    const tick = () => {
      if (!running) return
      const want = activeRef.current ? 1 : 0
      const rate = want > envelope ? ENVELOPE_ATTACK : ENVELOPE_RELEASE
      envelope += (want - envelope) * rate

      if (envelope < ENVELOPE_REST && want === 0) {
        envelope = 0
        running = false
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        return
      }

      resize()
      const { width, height } = canvas
      ctx.clearRect(0, 0, width, height)

      if (want === 1) {
        const targets = layerTargets(
          analyserRef.current,
          freq,
          time,
          performance.now(),
        )
        LAYERS.forEach((_, layerIndex) => {
          lerpDisplay(displays[layerIndex]!, targets[layerIndex] ?? [])
        })
      }

      LAYERS.forEach((layer, layerIndex) => {
        strokeWave(
          ctx,
          displays[layerIndex]!,
          width,
          height,
          layer.gain * envelope,
        )
        ctx.fillStyle = layer.color
        ctx.fill()
      })
      raf = requestAnimationFrame(tick)
    }

    const startLoop = () => {
      if (running) return
      running = true
      raf = requestAnimationFrame(tick)
    }
    startLoopRef.current = startLoop
    if (activeRef.current) startLoop()

    return () => {
      running = false
      startLoopRef.current = null
      cancelAnimationFrame(raf)
    }
  }, [])

  useEffect(() => {
    if (active) startLoopRef.current?.()
  }, [active])

  return (
    <canvas
      ref={canvasRef}
      className="ios-radio-bar__visualizer"
      aria-hidden
    />
  )
}
