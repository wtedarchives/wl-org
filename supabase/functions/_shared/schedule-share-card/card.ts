/**
 * The WTED Radio schedule share card, expressed as a Satori element tree.
 *
 * This replaces the browser export it grew out of — a DOM card rasterised with
 * `html-to-image`, which went through an SVG `foreignObject` and so produced a
 * blank image on every mobile WebKit. Satori supports only flexbox and inline
 * styles — no stylesheets, no grid, no floats, no pseudo-elements, no
 * `filter` — so the layout was rebuilt rather than ported.
 *
 * A row reads the way the homepage's Upcoming Schedule panel does: artwork, one
 * resolved title line (`resolveRadioScheduleSlotTitle`, which already folds the
 * show name into the title), and the time range beneath it. The browser export
 * used to split the show onto its own coloured eyebrow and list host pills; both
 * are gone, so the two surfaces say the same thing about the same slot.
 *
 * Notable translations from the stylesheet it came from
 * (`wl-home-v2-radio-schedule-share-export.css`, deleted with the DOM card):
 *
 *   - `filter: grayscale(35%) brightness(0.8)` on the background  ->  baked
 *     into the asset by `scripts/build-schedule-share-card-embeds.ts`.
 *   - the absolutely positioned background + wash layers  ->  two background
 *     layers on the frame itself (see the note on the frame below).
 *   - `margin: -12px -16px` on the brand bar  ->  the bar is lifted out of the
 *     padded body and made a direct child of the frame.
 *
 * The frame is a fixed 9∶16 with Instagram Story safe bands, so unlike the
 * setlist card it cannot grow to fit its content. `fitScale` below measures the
 * rows and shrinks type and spacing until they fit, rather than letting a busy
 * day silently clip.
 *
 * Keep this file import-free so it stays loadable in Deno, Node and the Next
 * bundler alike.
 */

/** Design width. Wider than the setlist card (432) for list readability. */
export const SCHEDULE_CARD_WIDTH_PX = 480

/** Portrait 9∶16 → height = width × (16/9). */
export const SCHEDULE_CARD_HEIGHT_PX = Math.round(
  SCHEDULE_CARD_WIDTH_PX * (16 / 9),
)

/**
 * Instagram Stories keeps its own UI in the top and bottom 100px of a 1920-tall
 * frame; nothing but background belongs there. Scaled to this frame.
 */
export const SCHEDULE_CARD_SAFE_INSET_PX = Math.round(
  SCHEDULE_CARD_HEIGHT_PX * (100 / 1920),
)

const CARD_RADIUS_PX = 16
const FRAME_BORDER_PX = 1
const BODY_PAD_PX = 12
/** The brand bar already carries 10px of the gap the CSS puts below it. */
const BODY_PAD_TOP_PX = 10

const BRAND_BAR_PAD_Y_PX = 8
const BRAND_BAR_PAD_X_PX = 16
const BRAND_MARK_PX = 48
const BRAND_BAR_HEIGHT_PX = BRAND_MARK_PX + BRAND_BAR_PAD_Y_PX * 2 + 2
const BRAND_TITLE_FONT_PX = 19
/** The date is the point of the card, so it is set only a step below the mark. */
const BRAND_DATE_FONT_PX = 16

const PANEL_RADIUS_PX = 10
const PANEL_BORDER_PX = 1
const PANEL_PAD_X_PX = 14
const PANEL_PAD_Y_PX = 12

/** Unscaled row geometry, before `fitScale`. */
const ROW_ART_PX = 66
const ROW_ART_GAP_PX = 14
const ROW_GAP_PX = 10
const ROW_PAD_BOTTOM_PX = 10

const TITLE_FONT_PX = 22
const TITLE_LINE_HEIGHT = 1.15
const TIME_FONT_PX = 16
const TIME_LINE_HEIGHT = 1.2
/** Matches the 2px the homepage panel puts between its title and time. */
const TITLE_TIME_GAP_PX = 4

const FRAME_INNER_WIDTH_PX = SCHEDULE_CARD_WIDTH_PX - FRAME_BORDER_PX * 2
const BODY_CONTENT_WIDTH_PX = FRAME_INNER_WIDTH_PX - BODY_PAD_PX * 2
const PANEL_INNER_WIDTH_PX = BODY_CONTENT_WIDTH_PX - PANEL_BORDER_PX * 2
const ROW_WIDTH_PX = PANEL_INNER_WIDTH_PX - PANEL_PAD_X_PX * 2

/** Vertical space the rows get, once every fixed band is subtracted. */
const ROWS_AVAILABLE_PX =
  SCHEDULE_CARD_HEIGHT_PX -
  FRAME_BORDER_PX * 2 -
  SCHEDULE_CARD_SAFE_INSET_PX * 2 -
  BRAND_BAR_HEIGHT_PX -
  BODY_PAD_TOP_PX -
  BODY_PAD_PX -
  PANEL_BORDER_PX * 2 -
  PANEL_PAD_Y_PX * 2

/**
 * The panel slot is sized explicitly rather than left to `flexGrow`.
 *
 * Every other band in the frame is fixed, so this is arithmetic, not layout —
 * and pinning it means a card that overshoots `fitScale` clips inside the panel
 * (which is `overflow: hidden`) rather than growing past the safe band at the
 * bottom of the frame.
 */
const PANEL_SLOT_HEIGHT_PX =
  ROWS_AVAILABLE_PX + PANEL_PAD_Y_PX * 2 + PANEL_BORDER_PX * 2

const C = {
  frameBg: "rgba(49, 58, 52, 0.97)",
  frameBorder: "rgb(63, 65, 64)",
  brandGreen: "#285b4e",
  brandBarBorder: "rgb(34, 37, 35)",
  markBg: "rgb(31, 31, 31)",
  markBorder: "rgb(24, 25, 24)",
  text: "rgba(255, 255, 255, 0.92)",
  tagline: "rgba(255, 255, 255, 0.88)",
  panelBg: "rgba(0, 0, 0, 0.72)",
  panelBorder: "rgb(63, 65, 64)",
  rowDivider: "rgba(255, 255, 255, 0.08)",
  status: "rgba(255, 255, 255, 0.65)",
  title: "rgba(255, 255, 255, 0.92)",
  time: "rgba(255, 255, 255, 0.52)",
  artBg: "rgba(255, 255, 255, 0.06)",
  artPlaceholder: "rgba(255, 255, 255, 0.05)",
} as const

const SANS = "Geist"
const MONO = "Geist Mono"

type Style = Record<string, unknown>
export type Node = { type: string; props: Record<string, unknown> }

/** Satori element helper. Children may be nodes, strings, or null. */
function h(type: string, style: Style, ...children: unknown[]): Node {
  const kids = children
    .flat()
    .filter((c) => c !== null && c !== undefined && c !== false)
  return {
    type,
    props: {
      style,
      ...(kids.length === 0 ? {}
      : kids.length === 1 ? { children: kids[0] }
      : { children: kids }),
    },
  }
}

function img(src: string, style: Style): Node {
  return { type: "img", props: { src, style } }
}

export type ScheduleCardRow = {
  /** Stable per slot; used only as a React-style key would be. */
  key: string
  /** Local time range, already formatted in the caller's timezone. */
  timeRange: string
  /** The one resolved line the homepage shows for this slot. */
  title: string
  /**
   * Row artwork. The caller passes a URL; the renderer replaces it with a
   * `data:` URI once fetched, and clears it when the fetch fails.
   */
  artSrc?: string | null
  /** Artwork width ÷ height, so a non-square image keeps its proportions. */
  artAspect?: number | null
  /** `requesTED w/ Randy` art is drawn with a tighter corner radius. */
  tightArtRadius?: boolean
}

export type ScheduleCardViewModel = {
  /** e.g. `Mon, Sep 1, 2026`, formatted in the caller's timezone. */
  dateLabel: string
  rows: ScheduleCardRow[]
  /** Shown in place of the rows when there are none. */
  emptyMessage?: string | null
}

export type ScheduleCardAssets = {
  /** data: URI of the treated, story-cropped background. */
  backgroundSrc: string
  /** data: URI of the WTED brand mark. */
  brandMarkSrc: string
}

/* ────────────────────────── fitting ──────────────────────────── */

/**
 * Approximate advance width of one character, as a fraction of the font size.
 *
 * Satori does the real shaping, and nothing here can ask it for a measurement
 * before laying out — but the frame is a fixed 9∶16, so *some* estimate is
 * needed to decide how far to shrink a busy day. Per-character classes beat a
 * flat average by enough to matter: schedule titles are full of capitals and
 * `@handles`, which a mixed-case average badly under-counts.
 */
function charFactor(ch: string): number {
  if ("iljI|!.,;:'`".includes(ch)) return 0.28
  if ("ftr()[]-/\\ ".includes(ch)) return 0.36
  if ("mwMW@".includes(ch)) return 0.85
  if (ch >= "A" && ch <= "Z") return 0.63
  if (ch >= "0" && ch <= "9") return 0.56
  return 0.53
}

function estimateTextWidth(text: string, fontSize: number): number {
  let w = 0
  for (const ch of text) w += charFactor(ch)
  return w * fontSize
}

function estimateLineCount(
  text: string,
  fontSize: number,
  maxWidth: number,
): number {
  if (maxWidth <= 0) return 1
  return Math.max(1, Math.ceil(estimateTextWidth(text, fontSize) / maxWidth))
}

/** Estimated height of every row plus the gaps between them, at scale `s`. */
function estimateRowsHeight(rows: ScheduleCardRow[], s: number): number {
  const mainW = ROW_WIDTH_PX - ROW_ART_PX * s - ROW_ART_GAP_PX * s

  let total = 0
  rows.forEach((row, i) => {
    const text =
      estimateLineCount(row.title, TITLE_FONT_PX * s, mainW) *
        TITLE_FONT_PX *
        s *
        TITLE_LINE_HEIGHT +
      TITLE_TIME_GAP_PX * s +
      TIME_FONT_PX * s * TIME_LINE_HEIGHT

    /*
     * The artwork tile is counted whether or not it resolved: `rowArt` draws a
     * placeholder of the same size when it did not, and with only two text
     * lines per row the tile is usually what sets the row's height anyway.
     */
    const artH = ROW_ART_PX * s * (1 / (row.artAspect || 1))
    total += Math.max(text, artH)
    if (i < rows.length - 1) total += ROW_PAD_BOTTOM_PX * s + 1 + ROW_GAP_PX * s
  })
  return total
}

/**
 * Headroom on the fit, because `estimateRowsHeight` is an approximation and
 * Satori is the one doing the real shaping. Undershooting by a few percent
 * costs nothing; overshooting clips the last row.
 */
const FIT_HEADROOM = 0.96

/**
 * Largest scale ≤ 1 at which the rows are estimated to fit the panel.
 *
 * Floors at 0.62: below that the card stops being readable at a glance, and a
 * day that busy is better off clipping one row than shrinking all of them into
 * illegibility.
 */
function fitScale(rows: ScheduleCardRow[]): number {
  if (rows.length === 0) return 1
  const budget = ROWS_AVAILABLE_PX * FIT_HEADROOM
  for (let s = 1; s >= 0.62; s -= 0.02) {
    if (estimateRowsHeight(rows, s) <= budget) return s
  }
  return 0.62
}

/* ────────────────────────── pieces ───────────────────────────── */

function brandBar(vm: ScheduleCardViewModel, assets: ScheduleCardAssets): Node {
  return h(
    "div",
    {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: BRAND_BAR_HEIGHT_PX,
      paddingTop: BRAND_BAR_PAD_Y_PX,
      paddingBottom: BRAND_BAR_PAD_Y_PX,
      paddingLeft: BRAND_BAR_PAD_X_PX,
      paddingRight: BRAND_BAR_PAD_X_PX,
      backgroundColor: C.brandGreen,
      borderTop: `1px solid ${C.brandBarBorder}`,
      borderBottom: `1px solid ${C.brandBarBorder}`,
      flexShrink: 0,
    },
    h(
      "div",
      { display: "flex", flexDirection: "row", alignItems: "center", gap: 14 },
      h(
        "div",
        {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: BRAND_MARK_PX,
          height: BRAND_MARK_PX,
          flexShrink: 0,
          borderRadius: 11,
          backgroundColor: C.markBg,
          border: `1px solid ${C.markBorder}`,
          overflow: "hidden",
        },
        img(assets.brandMarkSrc, {
          width: Math.round(BRAND_MARK_PX * 0.72),
          height: Math.round(BRAND_MARK_PX * 0.72),
          objectFit: "contain",
        }),
      ),
      h(
        "div",
        { display: "flex", flexDirection: "column", alignItems: "flex-start" },
        h(
          "div",
          {
            display: "flex",
            fontFamily: SANS,
            fontSize: BRAND_TITLE_FONT_PX,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            color: "#ffffff",
            lineHeight: 1,
          },
          "WTED Radio",
        ),
        h(
          "div",
          {
            display: "flex",
            marginTop: 5,
            fontFamily: MONO,
            fontSize: BRAND_DATE_FONT_PX,
            fontWeight: 700,
            letterSpacing: "0.02em",
            color: C.tagline,
            lineHeight: 1,
          },
          vm.dateLabel,
        ),
      ),
    ),
  )
}

function rowArt(row: ScheduleCardRow, s: number): Node {
  const width = ROW_ART_PX * s
  const height = width / (row.artAspect || 1)
  return h(
    "div",
    {
      display: "flex",
      width,
      height,
      flexShrink: 0,
      borderRadius: (row.tightArtRadius ? 5 : 11) * s,
      border: `1px solid ${C.panelBorder}`,
      backgroundColor: row.artSrc ? C.artBg : C.artPlaceholder,
      overflow: "hidden",
    },
    row.artSrc ? img(row.artSrc, { width, height, objectFit: "cover" }) : null,
  )
}

function scheduleRow(
  row: ScheduleCardRow,
  isLast: boolean,
  s: number,
): Node {
  const mainW = ROW_WIDTH_PX - ROW_ART_PX * s - ROW_ART_GAP_PX * s

  return h(
    "div",
    {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: ROW_ART_GAP_PX * s,
      width: ROW_WIDTH_PX,
      paddingBottom: isLast ? 0 : ROW_PAD_BOTTOM_PX * s,
      ...(isLast ? {} : { borderBottom: `1px solid ${C.rowDivider}` }),
    },
    rowArt(row, s),
    h(
      "div",
      {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        width: mainW,
        gap: TITLE_TIME_GAP_PX * s,
      },
      h(
        "div",
        {
          display: "flex",
          width: mainW,
          fontSize: TITLE_FONT_PX * s,
          fontWeight: 600,
          letterSpacing: "-0.01em",
          color: C.title,
          lineHeight: TITLE_LINE_HEIGHT,
        },
        row.title,
      ),
      h(
        "div",
        {
          display: "flex",
          fontFamily: MONO,
          fontSize: TIME_FONT_PX * s,
          fontWeight: 500,
          letterSpacing: "0.02em",
          color: C.time,
          lineHeight: TIME_LINE_HEIGHT,
        },
        row.timeRange,
      ),
    ),
  )
}

function panel(vm: ScheduleCardViewModel): Node {
  const s = fitScale(vm.rows)

  /*
   * `flexGrow: 0` so the panel hugs its rows rather than stretching: a quiet
   * five-show day should leave empty space between the panel and the store
   * badges, not a tall empty box below the last row. Matches `flex: 0 1 auto`
   * on `.__panel` in the stylesheet this came from.
   */
  return h(
    "div",
    {
      display: "flex",
      flexDirection: "column",
      width: BODY_CONTENT_WIDTH_PX,
      flexGrow: 0,
      flexShrink: 1,
      minHeight: 0,
      maxHeight: PANEL_SLOT_HEIGHT_PX,
      borderRadius: PANEL_RADIUS_PX,
      border: `1px solid ${C.panelBorder}`,
      backgroundColor: C.panelBg,
      overflow: "hidden",
    },
    h(
      "div",
      {
        display: "flex",
        flexDirection: "column",
        width: PANEL_INNER_WIDTH_PX,
        paddingTop: PANEL_PAD_Y_PX,
        paddingBottom: PANEL_PAD_Y_PX,
        paddingLeft: PANEL_PAD_X_PX,
        paddingRight: PANEL_PAD_X_PX,
        gap: ROW_GAP_PX * s,
      },
      vm.rows.length === 0 ?
        h(
          "div",
          {
            display: "flex",
            width: ROW_WIDTH_PX,
            fontSize: 16,
            lineHeight: 1.25,
            color: C.status,
          },
          vm.emptyMessage || "No shows scheduled for this calendar day.",
        )
      : vm.rows.map((row, i) =>
          scheduleRow(row, i === vm.rows.length - 1, s),
        ),
    ),
  )
}

export function buildScheduleShareCard(
  vm: ScheduleCardViewModel,
  assets: ScheduleCardAssets,
): Node {
  return h(
    "div",
    {
      display: "flex",
      flexDirection: "column",
      width: SCHEDULE_CARD_WIDTH_PX,
      height: SCHEDULE_CARD_HEIGHT_PX,
      borderRadius: CARD_RADIUS_PX,
      border: `${FRAME_BORDER_PX}px solid ${C.frameBorder}`,
      backgroundColor: C.frameBg,
      overflow: "hidden",
      fontFamily: SANS,
      color: C.text,
      paddingTop: SCHEDULE_CARD_SAFE_INSET_PX,
      paddingBottom: SCHEDULE_CARD_SAFE_INSET_PX,
      /*
       * The photo and its wash are background LAYERS on the frame, not
       * absolutely positioned children: `height: 100%` on an absolutely
       * positioned child resolved to nothing in Satori. Gradient first —
       * earlier layers paint on top.
       */
      backgroundImage: `linear-gradient(180deg, rgba(40, 91, 78, 0.43) 0%, rgba(40, 91, 78, 0.86) 88%), url(${assets.backgroundSrc})`,
      backgroundSize: "100% 100%, cover",
      backgroundPosition: "center, center",
      backgroundRepeat: "no-repeat, no-repeat",
    },
    brandBar(vm, assets),
    h(
      "div",
      {
        display: "flex",
        flexDirection: "column",
        width: FRAME_INNER_WIDTH_PX,
        flexGrow: 1,
        minHeight: 0,
        paddingTop: BODY_PAD_TOP_PX,
        paddingBottom: BODY_PAD_PX,
        paddingLeft: BODY_PAD_PX,
        paddingRight: BODY_PAD_PX,
      },
      /*
       * Fixed height, so a panel that overshoots `fitScale` cannot grow past
       * the bottom safe band; centred, so a quiet five-show day sits in the
       * middle of the frame instead of hanging off the header with a tall gap
       * beneath it. On a full day the panel fills the slot and this is a no-op.
       */
      h(
        "div",
        {
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: BODY_CONTENT_WIDTH_PX,
          height: PANEL_SLOT_HEIGHT_PX,
          flexShrink: 0,
        },
        panel(vm),
      ),
    ),
  )
}
