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
export function spacedWords(text: string, style: Style = {}): unknown[] {
  return wordSpans(text, style)
}

/**
 * One span per word, carrying any inherited inline styling.
 *
 * `flexShrink: 0` is essential. Flex items shrink by default and a word span
 * cannot be narrower than its glyphs, so in a nowrap row every word was
 * squeezed onto its neighbour into unreadable overlap. Words keep their width
 * and overflow instead, to be clipped or faded by their container.
 */
function wordSpans(text: string, style: Style = {}): unknown[] {
  const words = text.match(/\S+/g)
  if (!words) return []
  return words.map((word) => ({
    type: "span",
    props: { style: { ...style, flexShrink: 0 }, children: word },
  }))
}

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
 * punctuation is taken to have butted against its neighbour.
 */
const HUGGING_PUNCTUATION = /^[,.;:!?%)\]}\u2026\u3001\u3002]/

/** Inline emphasis, merged into each word rather than wrapped around them. */
function inlineStyle(type: string): Style {
  if (type === "strong" || type === "b") return { fontWeight: 700 }
  if (type === "em" || type === "i") return { fontStyle: "italic" }
  if (type === "a") return { color: "rgb(255, 163, 148)", fontWeight: 600 }
  return {}
}

/**
 * Flattens a child list into spans the parent can wrap.
 *
 * Inline elements are NOT kept as nested containers. A `<a>` wrapping its own
 * word spans became a flex item in the parent's wrap row, and flex items shrink
 * by default — so the link squeezed and broke its text mid-phrase ("Atlas /
 * Dogs") while leaving a gap beside it. Emitting the link's words directly into
 * the parent, each carrying the link's colour, lets them wrap with the sentence
 * exactly as the surrounding words do.
 */
function normaliseChildren(
  children: unknown,
  inWrap: boolean,
  gapPx: number,
  inherited: Style = {},
): unknown[] {
  const list = Array.isArray(children) ? children : [children]
  const out: unknown[] = []

  for (const child of list) {
    if (child === null || child === undefined) continue

    if (typeof child === "string") {
      if (!inWrap) {
        out.push(child)
        continue
      }
      const tokens = wordSpans(child, inherited)
      if (tokens.length === 0) continue
      if (out.length > 0 && HUGGING_PUNCTUATION.test(child.trimStart())) {
        closeUpGap(tokens[0], gapPx)
      }
      out.push(...tokens)
      continue
    }

    const { type, props } = (child ?? {}) as RichNode
    if (!type) continue

    const className = String(props?.class ?? props?.className ?? "")
    // A `<br>` stand-in: a full-width empty box forces the next wrap line.
    if (className.includes(BR_GAP_CLASS)) {
      out.push({
        type: "div",
        props: { style: { display: "flex", width: "100%", height: 3 } },
      })
      continue
    }

    if (!BLOCK_TAGS.has(type)) {
      // Inline: merge its styling and hoist its words into this list.
      out.push(
        ...normaliseChildren(props?.children, inWrap, gapPx, {
          ...inherited,
          ...inlineStyle(type),
        }),
      )
      continue
    }

    out.push(blockNode(type, props, gapPx, inherited))
  }

  return out
}

/** A block element: a flex container its children lay out inside. */
function blockNode(
  type: string,
  props: RichNode["props"],
  gapPx: number,
  inherited: Style,
): unknown {
  const style: Style = { ...((props?.style ?? {}) as Style) }
  const stacks = COLUMN_TAGS.has(type)

  style.display = "flex"
  if (stacks) {
    style.flexDirection = "column"
  } else {
    style.flexDirection = "row"
    style.flexWrap = "wrap"
    style.alignItems = "baseline"
    style.columnGap = gapPx
  }
  if (style.width === undefined) style.width = "100%"
  style.margin = 0
  if (type === "li" && style.paddingLeft === undefined) style.paddingLeft = 8

  return {
    type: "div",
    props: {
      style,
      children: normaliseChildren(props?.children, !stacks, gapPx, inherited),
    },
  }
}

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
