/**
 * Rasterises the setlist share card: Satori -> SVG -> resvg -> JPEG.
 *
 * Three stages, not two, because resvg only emits PNG and a PNG of this card at
 * Instagram dimensions lands around 2.3MB — over Bluesky's 2MB embed cap. The
 * same frame as JPEG is roughly 0.23MB.
 *
 * Sizing is the other constraint. Supabase Edge Functions stop a request at
 * about 2 seconds of CPU (`WORKER_RESOURCE_LIMIT`, not liftable by plan) and
 * resvg's cost scales with output pixels. Measured on this card:
 *
 *   1152x1440 (1.66M px)   6/10 succeeded
 *   1080x1350 (1.46M px)   7/10
 *   1024x1280 (1.31M px)  19/20
 *    960x1200 (1.15M px)  20/20   <- target
 *
 * Hence {@link MAX_RENDER_PIXELS}: overshooting it does not fail loudly, it
 * fails intermittently, which is worse. Callers should clamp rather than hope.
 */
import satori from "npm:satori@0.12.1"
import { Resvg, initWasm } from "npm:@resvg/resvg-wasm@2.6.2"
import { html as parseHtml } from "npm:satori-html@0.3.2"
import jpeg from "npm:jpeg-js@0.4.4"

import { FONT_BASE64 } from "./generated/fonts.ts"
import { makeRichParser } from "./rich-text.ts"
import {
  buildSetlistShareCard,
  CARD_WIDTH_PX,
  type CardAssets,
  type CardViewModel,
} from "./card.ts"

/** The measured safe ceiling; see the table above. */
const richParser = makeRichParser(parseHtml)

export const MAX_RENDER_PIXELS = 1_200_000

const RESVG_WASM_URL = "https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm"

const FONT_FILES: ReadonlyArray<{
  base64: string
  name: string
  weight: FontWeight
}> = [
  { base64: FONT_BASE64.geist400, name: "Geist", weight: 400 },
  { base64: FONT_BASE64.geist500, name: "Geist", weight: 500 },
  { base64: FONT_BASE64.geist600, name: "Geist", weight: 600 },
  { base64: FONT_BASE64.geist700, name: "Geist", weight: 700 },
  { base64: FONT_BASE64.geistMono500, name: "Geist Mono", weight: 500 },
]

function decodeBase64(b64: string): ArrayBuffer {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

/** Satori types weight as a literal union, not a plain number. */
type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900

type SatoriFont = {
  name: string
  data: ArrayBuffer
  weight: FontWeight
  style: "normal"
}

let fontsPromise: Promise<SatoriFont[]> | null = null
let wasmPromise: Promise<void> | null = null

/** Decoded once per worker; the buffers are reused across renders. */
function loadFonts(): Promise<SatoriFont[]> {
  fontsPromise ??= Promise.resolve(
    FONT_FILES.map((f) => ({
      name: f.name,
      data: decodeBase64(f.base64),
      weight: f.weight,
      style: "normal" as const,
    })),
  )
  return fontsPromise
}

function ensureWasm(): Promise<void> {
  wasmPromise ??= fetch(RESVG_WASM_URL)
    .then((r) => r.arrayBuffer())
    .then((b) => initWasm(b))
  return wasmPromise
}

export type RenderOptions = {
  /**
   * Desired multiplier on {@link CARD_WIDTH_PX}. The card's height follows its
   * content, so this is a ceiling: a long setlist is scaled down to stay inside
   * {@link MAX_RENDER_PIXELS} rather than being rendered at a size the runtime
   * kills. A 15-song show with coach notes already lays out ~692px tall, which
   * at the nominal 960 width would be 1.48M px — well over budget.
   */
  scale?: number
  /** JPEG quality, 1-100. */
  quality?: number
  /**
   * Fail instead of scaling down when the desired scale exceeds the budget.
   * For callers that need exact dimensions and would rather handle it.
   */
  strict?: boolean
}

export type RenderedCard = {
  /** Backed by a plain ArrayBuffer so it satisfies `BodyInit` directly. */
  jpeg: Uint8Array<ArrayBuffer>
  width: number
  height: number
  /** The scale actually used, after any clamp to the pixel budget. */
  scale: number
  /** True when the requested scale had to be reduced to fit. */
  clamped: boolean
  /** Milliseconds per stage, for budget tracking against the CPU ceiling. */
  timings: { satoriMs: number; resvgMs: number; jpegMs: number }
}

/**
 * Renders the card to JPEG, scaled to fit the pixel budget.
 *
 * Rendering over {@link MAX_RENDER_PIXELS} does not fail cleanly — it fails
 * *intermittently*, which is worse — so an oversized card is scaled down to fit
 * instead. Pass `strict` to get an error rather than a smaller image.
 */
export async function renderSetlistShareCard(
  vm: CardViewModel,
  assets: CardAssets,
  options: RenderOptions = {},
): Promise<RenderedCard> {
  const scale = options.scale ?? 2
  const quality = options.quality ?? 85

  const fonts = await loadFonts()

  const t0 = Date.now()
  const svg = await satori(
    buildSetlistShareCard(vm, assets, richParser) as never,
    {
      width: CARD_WIDTH_PX,
      // Height is deliberately omitted so the card grows with the setlist.
      /*
       * Text stays as <text> rather than being converted to <path>. Embedding
       * outlines made the SVG 321KB against 178KB, and resvg spent ~30% longer
       * parsing them — real money against a 2s CPU ceiling. resvg resolves the
       * glyphs itself from the same TTFs, handed over as `fontBuffers` below.
       */
      embedFont: false,
      fonts,
    },
  )
  const satoriMs = Date.now() - t0

  const naturalHeight = svgHeight(svg)
  const maxScale = fitScale(naturalHeight)
  const clamped = scale > maxScale
  if (clamped && options.strict) {
    throw new RenderTooLargeError(
      Math.round(CARD_WIDTH_PX * scale),
      Math.round(naturalHeight * scale),
      MAX_RENDER_PIXELS,
    )
  }
  const usedScale = clamped ? maxScale : scale
  const outWidth = Math.round(CARD_WIDTH_PX * usedScale)

  await ensureWasm()

  const t1 = Date.now()
  const instance = new Resvg(svg, {
    fitTo: { mode: "width", value: outWidth },
    font: {
      fontBuffers: fonts.map((f) => new Uint8Array(f.data)),
      defaultFontFamily: "Geist",
      loadSystemFonts: false, // nothing to find in the sandbox; skip the scan
    },
  })
  const image = instance.render()
  const width = image.width
  const height = image.height
  const rgba = image.pixels
  image.free?.()
  instance.free?.()
  const resvgMs = Date.now() - t1

  const t2 = Date.now()
  const encoded = jpeg.encode({ data: rgba, width, height }, quality)
  const bytes = new Uint8Array(encoded.data.length)
  bytes.set(encoded.data)
  const jpegMs = Date.now() - t2

  return {
    jpeg: bytes,
    width,
    height,
    scale: usedScale,
    clamped,
    timings: { satoriMs, resvgMs, jpegMs },
  }
}

export class RenderTooLargeError extends Error {
  constructor(
    readonly width: number,
    readonly height: number,
    readonly limit: number,
  ) {
    super(
      `Card would render at ${width}x${height} (${(width * height / 1e6).toFixed(2)}M px), ` +
        `over the ${(limit / 1e6).toFixed(2)}M px budget. Lower the scale.`,
    )
    this.name = "RenderTooLargeError"
  }
}

/** Reads the height Satori laid out, from the SVG root attributes. */
function svgHeight(svg: string): number {
  const attr = /<svg[^>]*\bheight="([\d.]+)"/.exec(svg)
  if (attr) return Number.parseFloat(attr[1]!)
  const viewBox = /<svg[^>]*\bviewBox="[\d.]+ [\d.]+ [\d.]+ ([\d.]+)"/.exec(svg)
  if (viewBox) return Number.parseFloat(viewBox[1]!)
  throw new Error("Could not determine card height from the rendered SVG")
}

/** Largest scale whose output stays inside the pixel budget. */
export function fitScale(naturalHeight: number, budget = MAX_RENDER_PIXELS): number {
  return Math.sqrt(budget / (CARD_WIDTH_PX * naturalHeight))
}
