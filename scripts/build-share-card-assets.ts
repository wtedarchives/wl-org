/**
 * Bakes the setlist share-card background assets for the server-side (Satori)
 * renderer.
 *
 * Satori supports neither CSS `filter` nor stylesheets, so the treatment that
 * `.wl-home-v2-share-export__bg-img` applies in the browser
 * (`grayscale(35%) brightness(0.8)`, at `opacity: 0.9` over the frame colour)
 * has to be baked into the file instead. The wash gradient on top of it is a
 * plain `linear-gradient`, which Satori does support, so that stays in the card.
 *
 * Two variants per source image:
 *   *-canvas.jpg  untreated, for the Instagram letterbox canvas behind the card
 *   *-card.jpg    treated, for the card's own background layer
 *
 * Run: deno run -A scripts/build-share-card-assets.ts
 */
import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts"

const SOURCES = ["newbg.png", "newbg2.jpeg", "newbg3.jpeg", "newbg4.jpeg"]

const PUBLIC_DIR = new URL("../public/", import.meta.url)
const OUT_DIR = new URL("../supabase/functions/_shared/share-card-assets/", import.meta.url)

/**
 * Instagram letterbox canvas: 4:5 at Instagram's native 1080 width.
 *
 * This was 960x1200 while the renderer ran on Supabase Edge, whose ~2s CPU cap
 * held the card to about 0.5M pixels. On Netlify the native renderer does
 * 1080x1350 comfortably, so the canvas is back at full size.
 */
const CANVAS_W = 1080
const CANVAS_H = 1350
const CANVAS_QUALITY = 62

/** The card frame is 432 CSS px wide and grows tall; it is cover-cropped. */
const CARD_W = 540
const CARD_H = 1200
const CARD_QUALITY = 50

/** `.wl-home-v2-share-export__frame` background, which the 0.9 opacity sits over. */
const FRAME_RGB = [49, 58, 52] as const
const GRAYSCALE = 0.35
const BRIGHTNESS = 0.8
const OPACITY = 0.9

/** Scale to fill, then centre-crop — the equivalent of `object-fit: cover`. */
function cover(img: Image, w: number, h: number): Image {
  const scale = Math.max(w / img.width, h / img.height)
  const rw = Math.ceil(img.width * scale)
  const rh = Math.ceil(img.height * scale)
  const resized = img.resize(rw, rh)
  return resized.crop(
    Math.floor((rw - w) / 2),
    Math.floor((rh - h) / 2),
    w,
    h,
  )
}

/** grayscale() then brightness(), per the CSS filter order, then composite. */
function applyCardTreatment(img: Image): Image {
  const bmp = img.bitmap
  for (let i = 0; i < bmp.length; i += 4) {
    const r = bmp[i]!, g = bmp[i + 1]!, b = bmp[i + 2]!
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    let nr = r + (lum - r) * GRAYSCALE
    let ng = g + (lum - g) * GRAYSCALE
    let nb = b + (lum - b) * GRAYSCALE
    nr *= BRIGHTNESS
    ng *= BRIGHTNESS
    nb *= BRIGHTNESS
    bmp[i]     = Math.round(FRAME_RGB[0] * (1 - OPACITY) + nr * OPACITY)
    bmp[i + 1] = Math.round(FRAME_RGB[1] * (1 - OPACITY) + ng * OPACITY)
    bmp[i + 2] = Math.round(FRAME_RGB[2] * (1 - OPACITY) + nb * OPACITY)
    bmp[i + 3] = 255
  }
  return img
}

await Deno.mkdir(OUT_DIR, { recursive: true })

for (const name of SOURCES) {
  const stem = name.replace(/\.(png|jpe?g)$/i, "")
  const raw = await Deno.readFile(new URL(name, PUBLIC_DIR))
  const src = await Image.decode(raw)

  const canvas = cover(src.clone(), CANVAS_W, CANVAS_H)
  const canvasJpg = await canvas.encodeJPEG(CANVAS_QUALITY)
  await Deno.writeFile(new URL(`${stem}-canvas.jpg`, OUT_DIR), canvasJpg)

  const card = applyCardTreatment(cover(src.clone(), CARD_W, CARD_H))
  const cardJpg = await card.encodeJPEG(CARD_QUALITY)
  await Deno.writeFile(new URL(`${stem}-card.jpg`, OUT_DIR), cardJpg)

  const kb = (n: number) => `${(n / 1024).toFixed(0)}KB`
  console.log(
    `${stem.padEnd(8)} ${String(src.width).padStart(5)}x${src.height} ${kb(raw.length).padStart(7)}` +
    `  ->  canvas ${kb(canvasJpg.length).padStart(6)}   card ${kb(cardJpg.length).padStart(6)}`,
  )
}

console.log("\nWrote to supabase/functions/_shared/share-card-assets/")
