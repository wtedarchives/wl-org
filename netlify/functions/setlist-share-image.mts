/**
 * Renders the setlist share card as JPEG. Node/Netlify counterpart to the
 * Supabase edge function of the same name.
 *
 * Why it lives here rather than on Supabase: Supabase Edge caps a request at
 * ~2s of CPU, which held the real card to about 0.5M pixels — roughly 562px
 * wide for a long setlist, well short of Instagram's 1080. Netlify runs Node
 * with a 60s limit and the *native* resvg binding, which renders 2.85M pixels
 * in ~470ms. Same card, ~18x the throughput.
 *
 * The card layout, set grouping, view model and rich-text handling are all
 * shared with the Supabase renderer; only the rasterising differs.
 *
 * This function is a PURE RENDERER: it takes an already-built view model in the
 * request body and returns an image. It deliberately does not touch the
 * database, so no Supabase service-role key has to live on Netlify — the
 * caller already holds the data and builds the view model.
 */
import satori from "satori"
import { Resvg } from "@resvg/resvg-js"
import { html as parseHtml } from "satori-html"
import jpeg from "jpeg-js"
import {
  brandMark,
  cardBackground,
  pickShareBackgroundStem,
} from "../../supabase/functions/_shared/setlist-share-card/assets.ts"
import {
  buildSetlistShareCard,
  CARD_WIDTH_PX,
} from "../../supabase/functions/_shared/setlist-share-card/card.ts"
import { CANVAS_BACKGROUND_DATA_URI } from "../../supabase/functions/_shared/setlist-share-card/generated/backgrounds.ts"
import { FONT_BASE64 } from "../../supabase/functions/_shared/setlist-share-card/generated/fonts.ts"
import {
  buildInstagramCanvas,
  fitCardToInstagramCanvas,
  IG_CANVAS_HEIGHT_PX,
  IG_CANVAS_WIDTH_PX,
} from "../../supabase/functions/_shared/setlist-share-card/instagram-canvas.ts"
import { makeRichParser } from "../../supabase/functions/_shared/setlist-share-card/rich-text.ts"
import type { CardViewModel } from "../../supabase/functions/_shared/setlist-share-card/card.ts"

/** Instagram's native width. Netlify has the headroom; Supabase did not. */
const DEFAULT_WIDTH_PX = 1080

/**
 * `card` renders the card at its natural proportions — what Bluesky wants.
 * `instagram` centres that card on a 4:5 canvas, which is what feed posts need.
 */
type OutputFormat = "card" | "instagram"

/** Reads the height Satori laid out, from the SVG root attributes. */
function svgSize(svg: string): { width: number; height: number } {
  const m = /<svg[^>]*\bwidth="([\d.]+)"[^>]*\bheight="([\d.]+)"/.exec(svg)
  if (!m) throw new Error("Could not read the rendered card's size")
  return { width: Number.parseFloat(m[1]!), height: Number.parseFloat(m[2]!) }
}

const pngDataUri = (png: Buffer) =>
  `data:image/png;base64,${png.toString("base64")}`
const DEFAULT_QUALITY = 85

/**
 * Guard rail rather than a real ceiling — 2.85M px renders in under half a
 * second here, but an absurd `width` should not be able to spend 60s of CPU.
 */
const MAX_WIDTH_PX = 2160

const FONTS = [
  { base64: FONT_BASE64.geist400, name: "Geist", weight: 400 },
  { base64: FONT_BASE64.geist500, name: "Geist", weight: 500 },
  { base64: FONT_BASE64.geist600, name: "Geist", weight: 600 },
  { base64: FONT_BASE64.geist700, name: "Geist", weight: 700 },
  { base64: FONT_BASE64.geistMono500, name: "Geist Mono", weight: 500 },
] as const

const fonts = FONTS.map((f) => ({
  name: f.name,
  data: Buffer.from(f.base64, "base64"),
  weight: f.weight as 400 | 500 | 600 | 700,
  style: "normal" as const,
}))

const richParser = makeRichParser(parseHtml)

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url)

  /*
   * Publicly reachable, so the caller (the Supabase `dpro-admin` function)
   * presents a shared secret. There is no database access to protect here, but
   * rendering is CPU work and should not be free to anyone who finds the URL.
   */
  const expected = process.env.SHARE_IMAGE_SECRET
  if (!expected) return jsonError("SHARE_IMAGE_SECRET is not configured", 500)
  const presented =
    req.headers.get("x-share-image-secret") ??
    url.searchParams.get("secret") ??
    ""
  if (presented !== expected) return jsonError("Unauthorized", 401)

  if (req.method !== "POST") {
    return jsonError("POST a { showId, viewModel } body", 405)
  }
  const body = (await req.json().catch(() => null)) as {
    showId?: string
    viewModel?: CardViewModel
  } | null
  const showId = body?.showId
  const vm = body?.viewModel
  if (!showId) return jsonError("showId is required", 400)
  if (!vm?.entries?.length) return jsonError("viewModel.entries is required", 400)

  const stem = pickShareBackgroundStem(showId)

  const format: OutputFormat =
    url.searchParams.get("format") === "instagram" ? "instagram" : "card"
  const quality = Number(url.searchParams.get("quality") ?? DEFAULT_QUALITY)
  const width =
    format === "instagram" ?
      IG_CANVAS_WIDTH_PX
    : Math.min(
        MAX_WIDTH_PX,
        Math.max(
          CARD_WIDTH_PX,
          Number(url.searchParams.get("width") ?? DEFAULT_WIDTH_PX),
        ),
      )

  try {
    const t0 = Date.now()
    const cardOptions = {
      width: CARD_WIDTH_PX,
      // Height omitted so the card grows with the setlist.
      /*
       * Outlines here, unlike the Deno renderer. `@resvg/resvg-js` has no
       * `fontBuffers` option — only font *file paths* — so leaving text as
       * <text> makes it fall back to scanning system fonts, which is both
       * wrong and slow. Outlining costs ~55% more resvg time, which at these
       * speeds is ~45ms. It also makes the card safe to nest as an <image>
       * inside the Instagram canvas, which carries no font context of its own.
       */
      embedFont: true as const,
      fonts,
    }

    let svg = await satori(
      buildSetlistShareCard(
        vm,
        { backgroundSrc: cardBackground(stem), brandMarkSrc: brandMark() },
        richParser,
      ) as never,
      cardOptions,
    )

    let cardRasterMs = 0
    if (format === "instagram") {
      /*
       * The card is rasterised to PNG before being placed on the canvas, rather
       * than nested as an SVG data URI. Nesting looked right but silently
       * dropped the brand mark — resvg does not reliably resolve images inside
       * an embedded SVG. A PNG has no such nesting to resolve.
       */
      const natural = svgSize(svg)
      const fit = fitCardToInstagramCanvas(natural.width, natural.height)
      const canvasBg = CANVAS_BACKGROUND_DATA_URI[stem]
      if (!canvasBg) throw new Error(`No embedded canvas background for "${stem}"`)

      const tCard = Date.now()
      const cardPng = Buffer.from(
        new Resvg(svg, {
          fitTo: { mode: "width", value: fit.width },
          font: { loadSystemFonts: false },
        })
          .render()
          .asPng(),
      )
      cardRasterMs = Date.now() - tCard

      svg = await satori(
        buildInstagramCanvas({
          cardSrc: pngDataUri(cardPng),
          cardWidth: natural.width,
          cardHeight: natural.height,
          backgroundSrc: canvasBg,
        }) as never,
        {
          width: IG_CANVAS_WIDTH_PX,
          height: IG_CANVAS_HEIGHT_PX,
          embedFont: true as const,
          fonts,
        },
      )
    }
    const satoriMs = Date.now() - t0 - cardRasterMs

    const t1 = Date.now()
    const image = new Resvg(svg, {
      fitTo: { mode: "width", value: width },
      font: { loadSystemFonts: false }, // nothing to find; skip the scan
    }).render()
    const outWidth = image.width
    const outHeight = image.height
    const rgba = Buffer.from(image.pixels)
    const resvgMs = Date.now() - t1

    const t2 = Date.now()
    const encoded = jpeg.encode(
      { data: rgba, width: outWidth, height: outHeight },
      quality,
    )
    const jpegMs = Date.now() - t2

    if (url.searchParams.get("debug") === "1") {
      return new Response(
        JSON.stringify({
          ok: true,
          runtime: "netlify",
          format,
          showId,
          background: stem,
          entries: vm.entries.length,
          width: outWidth,
          height: outHeight,
          megapixels: +((outWidth * outHeight) / 1e6).toFixed(3),
          bytes: encoded.data.length,
          timings: { satoriMs, cardRasterMs, resvgMs, jpegMs },
        }),
        { headers: { "Content-Type": "application/json" } },
      )
    }

    return new Response(encoded.data, {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "no-store" },
    })
  } catch (err) {
    console.error("setlist share render failed:", err)
    return jsonError(`Render failed: ${String(err)}`, 500)
  }
}

export const config = { path: "/api/setlist-share-image" }
