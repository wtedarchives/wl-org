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
/**
 * Word gap as a fraction of the font size.
 *
 * Geist's own space is about 0.26em, which reads a shade loose on the card, so
 * words are laid out as separate flex items with this gap instead. Kept
 * fractional deliberately: rounding to whole pixels quantised 0.26 and 0.22 to
 * the same value at 13px, which made the setting look like it did nothing.
 */
export const WORD_GAP_EM = 0.21

/** Width of the gap between words at a given font size. */
export function spaceWidthPx(fontSize: number): number {
  return Math.max(1.5, fontSize * WORD_GAP_EM)
}

/**
 * Splits text into one span per word, for layout with {@link spaceWidthPx}.
 *
 * Satori ignores `wordSpacing`, so the only way to control the space between
 * words is to make each word its own flex item and space them with `columnGap`.
 */
export function spacedWords(text: string): unknown[] {
  return wordSpans(text)
}

function wordSpans(text: string): unknown[] {
  // Whitespace is dropped rather than emitted: Satori trims it at flex-item
  // edges no matter how the span is styled, so inter-word spacing is restored
  // with `columnGap` on the wrapping container instead.
  const words = text.match(/\S+/g)
  if (!words) return []
  /*
   * `flexShrink: 0` is essential. Flex items shrink by default, and a word span
   * cannot actually get narrower than its glyphs — so in a nowrap container a
   * long title had every word squeezed on top of its neighbour into unreadable
   * overlap. Words keep their width and overflow instead, to be clipped or
   * faded by the container.
   */
  return words.map((word) => ({
    type: "span",
    props: { style: { flexShrink: 0 }, children: word },
  }))
}

type StyledNode = { type: string; props: { style: Record<string, unknown> } }

/**
 * Cancels the container's word gap so a run hugs the one before it.
 *
 * Slightly more than the gap: a period carries visible left side bearing in
 * Geist, so cancelling exactly `gapPx` still left a hairline before it while a
 * comma already sat flush. Measured across both, `gapPx + 2` seats them the
 * same without over-tightening the comma.
 */
function closeUpGap(node: unknown, gapPx: number): void {
  const styled = node as { props?: { style?: Record<string, unknown> } } | undefined
  if (styled?.props?.style) styled.props.style.marginLeft = -(gapPx + 2)
}

/**
 * Punctuation that hugs the word before it, so no word gap should precede it.
 *
 * Inferred from the text rather than read from the markup, because
 * `satori-html` TRIMS text nodes: `"First time "` arrives as `"First time"`
 * and `" has been played since "` loses both spaces. The original spacing is
 * destroyed before this code sees it, so a run beginning with closing
 * punctuation is taken to have butted against its neighbour — which turns
 * `<a>11.06.20</a>,` back from "11.06.20 ," into "11.06.20,".
 */
const HUGGING_PUNCTUATION = /^[,.;:!?%)\]}\u2026\u3001\u3002]/

/**
 * Flattens a child list, closing up the gap before hugging punctuation.
 *
 * Word spacing comes from `columnGap`, which applies uniformly between flex
 * items. That is right everywhere except before punctuation, which gets a
 * negative margin to cancel it.
 */
function normaliseChildren(
  children: unknown,
  inWrap: boolean,
  gapPx: number,
): unknown[] {
  const list = Array.isArray(children) ? children : [children]
  const out: unknown[] = []

  for (const child of list) {
    if (typeof child === "string") {
      if (!inWrap) {
        out.push(child)
        continue
      }
      const tokens = wordSpans(child)
      if (tokens.length === 0) continue
      if (out.length > 0 && HUGGING_PUNCTUATION.test(child.trimStart())) {
        closeUpGap(tokens[0], gapPx)
      }
      out.push(...tokens)
      continue
    }

    const node = normaliseRich(child, inWrap, gapPx)
    if (node !== null && node !== undefined) out.push(node)
  }

  return out
}

function normaliseRich(node: unknown, inWrap = false, gapPx = 3): unknown {
  if (node === null || node === undefined) return node
  if (typeof node === "string") return inWrap ? wordSpans(node) : node
  if (Array.isArray(node)) return normaliseChildren(node, inWrap, gapPx)

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

  if (!isBlock) {
    /*
     * Inline runs must be flex containers too. A <span> holding several word
     * spans with no `display` is laid out by Satori as a full-width block, so
     * every link and bold phrase claimed its own line instead of flowing with
     * the sentence around it.
     */
    style.display = "flex"
    style.flexWrap = "wrap"
    style.alignItems = "baseline"
    style.columnGap = gapPx
  }

  if (type === "strong" || type === "b") style.fontWeight = 700
  if (type === "em" || type === "i") style.fontStyle = "italic"
  if (type === "a") {
    style.color = "rgb(255, 163, 148)"
    style.fontWeight = 600
  }
  if (type === "li" && style.paddingLeft === undefined) style.paddingLeft = 8

  return {
    type: isBlock ? "div" : "span",
    props: {
      style,
      children: normaliseChildren(props?.children, childrenWrap, gapPx),
    },
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
    const gapPx = spaceWidthPx(Number(style.fontSize ?? 11))
    return {
      type: "div",
      props: {
        /*
         * A wrapping ROW, not a column. CMS values are frequently bare inline
         * content — "First time <a>…</a> has been played since <a>…</a>" has no
         * block element at all — and a column put every text run and every link
         * on its own line. As a wrap row the sentence flows, while genuine
         * block children still stack: they carry `width: 100%`, so each one
         * fills its line and pushes the next to the following row.
         */
        style: {
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "baseline",
          columnGap: gapPx,
          width: "100%",
          ...style,
        },
        children:
          normaliseChildren(parsed?.props?.children, true, gapPx),
      },
    }
  }
}
