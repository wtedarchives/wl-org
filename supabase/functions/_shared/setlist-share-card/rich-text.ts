/**
 * Rich-HTML normalisation for the share card, shared by both renderers.
 *
 * Satori lays out only flex boxes — it has no inline formatting context, so an
 * element left at its default display paints on top of its siblings instead of
 * flowing beside them.
 *
 * The HTML parser itself differs per runtime (`npm:satori-html` under Deno, a
 * bare `satori-html` import under Node), so it is injected rather than imported
 * here. That keeps this module free of package specifiers and usable by both.
 */

/** Style bag passed through to Satori. */
type Style = Record<string, unknown>

export type RichParser = (html: string, style: Style) => unknown

/*
 * Satori lays out only flex boxes — it has no inline formatting context, so an
 * element left at its default display paints on top of its siblings instead of
 * flowing beside them. Rich CMS HTML is therefore normalised: block tags become
 * flex containers, inline tags become spans carrying just their emphasis, and
 * every tag is rewritten to div/span so no unknown element names reach Satori.
 */
const BLOCK_TAGS = new Set([
  "p", "div", "ul", "ol", "li", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6",
])
/** Block tags whose children stack rather than flow. */
const COLUMN_TAGS = new Set(["ul", "ol", "blockquote", "div"])

/** `prepareWlHomeV2ShareExportRichHtml` rewrites `<br>` to this marker. */
const BR_GAP_CLASS = "wl-home-v2-share-export__rich-br-gap"

type RichNode = {
  type?: string
  props?: Record<string, unknown> & { children?: unknown; style?: Record<string, unknown> }
}

/**
 * Splits a text run into per-word spans.
 *
 * Inside a wrapping flex row every child is an atom, so an untouched sentence
 * would break only where one inline run ends — mid-paragraph, after a bold
 * phrase. Emitting one span per word restores word-level wrapping, which is
 * what the browser card does.
 */
function wordSpans(text: string): unknown[] {
  // Whitespace is dropped rather than emitted: Satori trims it at flex-item
  // edges no matter how the span is styled, so inter-word spacing is restored
  // with `columnGap` on the wrapping container instead.
  const words = text.match(/\S+/g)
  if (!words) return []
  return words.map((word) => ({ type: "span", props: { style: {}, children: word } }))
}

/** Approximate width of a space in Geist, for the wrap gap. */
function spaceWidthPx(fontSize: number): number {
  return Math.max(2, Math.round(fontSize * 0.26))
}

function normaliseRich(node: unknown, inWrap = false, gapPx = 3): unknown {
  if (node === null || node === undefined) return node
  if (typeof node === "string") return inWrap ? wordSpans(node) : node
  if (Array.isArray(node)) return node.flatMap((n) => {
    const out = normaliseRich(n, inWrap, gapPx)
    return Array.isArray(out) ? out : [out]
  })

  const { type, props } = node as RichNode
  if (!type) return node

  const incoming = (props?.style ?? {}) as Record<string, unknown>
  const style: Record<string, unknown> = { ...incoming }
  const className = String(props?.class ?? props?.className ?? "")

  // A `<br>` stand-in: full-width zero-content box forces the next wrap line.
  if (className.includes(BR_GAP_CLASS)) {
    return { type: "div", props: { style: { display: "flex", width: "100%", height: 3 } } }
  }

  const isBlock = BLOCK_TAGS.has(type)
  let childrenWrap = inWrap
  if (isBlock) {
    style.display = "flex"
    if (COLUMN_TAGS.has(type)) {
      style.flexDirection = "column"
      childrenWrap = false
    } else {
      style.flexDirection = "row"
      style.flexWrap = "wrap"
      style.alignItems = "baseline"
      style.columnGap = gapPx
      childrenWrap = true
    }
    if (style.width === undefined) style.width = "100%"
    style.margin = 0
  }

  if (type === "strong" || type === "b") style.fontWeight = 700
  if (type === "em" || type === "i") style.fontStyle = "italic"
  if (type === "a") {
    style.color = "rgb(255, 163, 148)"
    style.fontWeight = 600
  }
  if (type === "li" && style.paddingLeft === undefined) style.paddingLeft = 8

  const kids = normaliseRich(props?.children, childrenWrap, gapPx)
  return {
    type: isBlock ? "div" : "span",
    props: { style, children: kids },
  }
}

/**
 * Builds a rich-HTML parser around a runtime-supplied `satori-html`.
 *
 * `satori-html` returns its own root div carrying `height: 100%`, which makes
 * every rich block expand to fill the card instead of hugging its text — that
 * stretched the coach panel and pushed the callbacks block outside the frame's
 * `overflow: hidden`. Only the parsed children are kept; the styling is ours.
 */
export function makeRichParser(
  parseHtml: (markup: string) => unknown,
): RichParser {
  return (markup, style) => {
    const parsed = parseHtml(markup) as RichNode
    return {
      type: "div",
      props: {
        style: { display: "flex", flexDirection: "column", width: "100%", ...style },
        children:
          normaliseRich(
            parsed?.props?.children,
            false,
            spaceWidthPx(Number(style.fontSize ?? 11)),
          ) ?? null,
      },
    }
  }
}
