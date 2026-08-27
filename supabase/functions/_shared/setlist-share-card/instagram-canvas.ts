/**
 * The Instagram letterbox: the setlist card fitted onto a 4:5 canvas.
 *
 * Instagram feed posts want 4:5, but the card's height follows its setlist, so
 * it is almost never 4:5 on its own. The card is therefore rendered at its
 * natural proportions, then centred on a 1080x1350 canvas over the same show's
 * background photo — the same composition the browser produced with a canvas
 * `drawImage`, rebuilt in flex.
 *
 * The card arrives as an already-rendered SVG data URI rather than as a nested
 * tree. Satori cannot measure a subtree and scale it to fit in one pass, and
 * embedding the finished SVG avoids `transform: scale()` entirely: the fitted
 * size is computed here and handed to the <img> directly.
 *
 * Keep this module import-free so both runtimes can load it.
 */
import { CARD_RADIUS_PX, CARD_WIDTH_PX } from "./card.ts"

/** Instagram's native 4:5 feed size. */
export const IG_CANVAS_WIDTH_PX = 1080
export const IG_CANVAS_HEIGHT_PX = 1350

/**
 * Breathing room around the card. Proportional to the old client composition,
 * which used 16px of padding on a 576px-wide canvas.
 */
export const IG_CANVAS_PADDING_PX = Math.round((16 / 576) * IG_CANVAS_WIDTH_PX)

/** Behind the photo, and visible only if the photo ever fails to decode. */
const CANVAS_BACKDROP = "#000000"

export type InstagramCanvasInput = {
  /** `data:image/svg+xml;base64,...` of the rendered card. */
  cardSrc: string
  /** The card's natural size, as laid out at {@link CARD_WIDTH_PX}. */
  cardWidth: number
  cardHeight: number
  /** `data:image/jpeg;base64,...` of the untreated canvas background. */
  backgroundSrc: string
}

export type InstagramCanvasFit = {
  width: number
  height: number
  left: number
  top: number
  radius: number
  scale: number
}

/**
 * Largest centred placement of the card inside the padded canvas.
 *
 * The corner radius scales with the card so the rounding stays visually
 * identical to the card's own frame rather than growing or shrinking with it.
 */
export function fitCardToInstagramCanvas(
  cardWidth: number,
  cardHeight: number,
): InstagramCanvasFit {
  const availableWidth = IG_CANVAS_WIDTH_PX - IG_CANVAS_PADDING_PX * 2
  const availableHeight = IG_CANVAS_HEIGHT_PX - IG_CANVAS_PADDING_PX * 2
  const scale = Math.min(availableWidth / cardWidth, availableHeight / cardHeight)

  const width = Math.round(cardWidth * scale)
  const height = Math.round(cardHeight * scale)

  return {
    width,
    height,
    left: Math.round((IG_CANVAS_WIDTH_PX - width) / 2),
    top: Math.round((IG_CANVAS_HEIGHT_PX - height) / 2),
    radius: Math.round(CARD_RADIUS_PX * (width / CARD_WIDTH_PX)),
    scale,
  }
}

/** Satori tree for the 4:5 canvas with the card centred on it. */
export function buildInstagramCanvas(input: InstagramCanvasInput) {
  const fit = fitCardToInstagramCanvas(input.cardWidth, input.cardHeight)

  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        position: "relative",
        width: IG_CANVAS_WIDTH_PX,
        height: IG_CANVAS_HEIGHT_PX,
        background: CANVAS_BACKDROP,
      },
      children: [
        {
          type: "img",
          props: {
            src: input.backgroundSrc,
            style: {
              position: "absolute",
              top: 0,
              left: 0,
              width: IG_CANVAS_WIDTH_PX,
              height: IG_CANVAS_HEIGHT_PX,
              objectFit: "cover",
            },
          },
        },
        {
          // Rounds the card's corners against the photo behind it.
          type: "div",
          props: {
            style: {
              display: "flex",
              position: "absolute",
              left: fit.left,
              top: fit.top,
              width: fit.width,
              height: fit.height,
              borderRadius: fit.radius,
              overflow: "hidden",
            },
            children: {
              type: "img",
              props: {
                src: input.cardSrc,
                style: { width: fit.width, height: fit.height },
              },
            },
          },
        },
      ],
    },
  }
}
