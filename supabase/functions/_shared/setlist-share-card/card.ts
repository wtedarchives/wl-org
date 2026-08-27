/**
 * The setlist share card, expressed as a Satori element tree.
 *
 * This is the server-side counterpart to
 * `components/wl-home-v2/wl-home-v2-setlist-share-export-card.tsx`. It renders
 * the same card, but Satori supports only flexbox and inline styles — no
 * stylesheets, no tables, no grid, no pseudo-elements, no `filter` — so the
 * layout is rebuilt rather than reused. Set grouping is NOT rebuilt: that comes
 * from `./set-grouping.ts`, which both runtimes share.
 *
 * Notable translations from `wl-home-v2-setlist-share-export.css`:
 *
 *   - `<table>` + `<td rowSpan>` rail  ->  a flex row per run: rail beside a
 *     column of songs (see `groupShareExportRuns`).
 *   - `writing-mode: vertical-rl` + `rotate(180deg)`  ->  `rotate(-90deg)`,
 *     which is the same end orientation and is what Satori supports.
 *   - `display: grid` on the top split  ->  flex with matching flex ratios.
 *   - `filter: grayscale(35%) brightness(0.8)` on the background  ->  baked
 *     into the `-card` asset by `scripts/build-share-card-assets.ts`.
 *   - `mask-image` fade on long song titles  ->  clipped, since Satori has no
 *     mask support.
 *   - `oklch()` colours  ->  their sRGB hex equivalents.
 *
 * Keep this file free of imports other than `./set-grouping.ts` so it stays
 * loadable in both Deno and the Next bundler.
 */
import {
  buildShareExportRows,
  groupShareExportRuns,
  type SetGroupingEntry,
  type ShareExportRow,
} from "./set-grouping.ts"
import { spacedWords, spaceWidthPx } from "./rich-text.ts"

/** Design width of the card, matching WL_HOME_V2_SETLIST_SHARE_EXPORT_WIDTH_PX. */
export const CARD_WIDTH_PX = 432

/*
 * `grid-template-columns: 1.75fr 1.25fr` with a 6px gap, resolved to pixels.
 * Satori has no grid, and fractional `flexGrow` proved unreliable here — it
 * stretched the aside past the frame and swallowed the callbacks block — so the
 * columns are sized explicitly instead.
 */
const SPLIT_GAP_PX = 6
const CONTENT_WIDTH_PX = CARD_WIDTH_PX - 2 - 16
const SPLIT_MAIN_PX = Math.floor(((CONTENT_WIDTH_PX - SPLIT_GAP_PX) * 1.75) / 3)
const SPLIT_ASIDE_PX = CONTENT_WIDTH_PX - SPLIT_GAP_PX - SPLIT_MAIN_PX

/*
 * Widths inside the setlist panel, resolved to pixels.
 *
 * `width: "100%"` on a rich-text block does not resolve against the song column
 * here — it picked up a wider ancestor and every coach note overflowed the panel
 * and was clipped on the right. The geometry is entirely fixed, so it is
 * computed rather than left to percentage resolution.
 */
const RAIL_WIDTH_PX = 14
const PANEL_BORDER_PX = 1
const SONG_INSET_LEFT_PX = 8
/** Tighter than the left: the short badge and segue arrow sit against it. */
const SONG_INSET_RIGHT_PX = 4
const COACH_INDENT_PX = 12
const SONG_COLUMN_WIDTH_PX =
  SPLIT_MAIN_PX - PANEL_BORDER_PX * 2 - RAIL_WIDTH_PX - PANEL_BORDER_PX
const SONG_CONTENT_WIDTH_PX =
  SONG_COLUMN_WIDTH_PX - SONG_INSET_LEFT_PX - SONG_INSET_RIGHT_PX
const COACH_WIDTH_PX = SONG_CONTENT_WIDTH_PX - COACH_INDENT_PX

/** Song title size, shared with its word-gap calculation. */
const SONG_FONT_SIZE_PX = 13

/** A panel's padding on both sides plus its 1px border on both sides. */
const PANEL_INSET_PX = 8 * 2 + PANEL_BORDER_PX * 2

/**
 * Where the long-title fade begins, as a percentage of the title slot.
 *
 * The browser card fades over the last 14px via `mask-image`. Satori does
 * support `maskImage`, but not the `calc(100% - 14px)` stop the stylesheet
 * uses — that silently failed to parse and faded the title from its start,
 * which is what made this look unsupported at first. A percentage stop works,
 * and short titles are untouched because the fade is positional.
 */
const TITLE_FADE_STOP = "90%"
/** Matches WL_HOME_V2_SETLIST_SHARE_EXPORT_FRAME_RADIUS_PX. */
export const CARD_RADIUS_PX = 16

const C = {
  frameBg: "rgba(49, 58, 52, 0.97)",
  frameBorder: "rgb(63, 65, 64)",
  panelBg: "rgba(0, 0, 0, 0.72)",
  brandGreen: "#285b4e",
  markBg: "rgb(31, 31, 31)",
  markBorder: "rgb(24, 25, 24)",
  text: "rgba(255, 255, 255, 0.92)",
  songText: "rgba(255, 255, 255, 0.9)",
  railText: "rgba(255, 255, 255, 0.58)",
  railBg: "rgba(0, 0, 0, 0.36)",
  railBorder: "rgb(59, 62, 60)",
  encoreRailBg: "rgba(255, 122, 103, 0.18)",
  encoreRailBorder: "rgb(95, 60, 53)",
  encoreRailText: "rgb(255, 186, 176)",
  dividerBg: "rgba(255, 122, 103, 0.16)",
  encoreDividerBg: "rgba(255, 122, 103, 0.29)",
  /* oklch(0.84 0.12 12) */
  shortText: "#ffa9b6",
  shortBg: "rgba(200, 88, 108, 0.19)",
  shortBorder: "rgb(100, 44, 58)",
  /* oklch(0.6 0.14 12) */
  segueText: "#c5586a",
  coachText: "rgba(255, 255, 255, 0.5)",
  blockTitle: "rgba(255, 255, 255, 0.55)",
  richText: "rgba(255, 255, 255, 0.88)",
  pillText: "rgba(255, 255, 255, 0.95)",
  pillMuted: "rgba(255, 255, 255, 0.78)",
  statsLabel: "rgba(255, 255, 255, 0.65)",
  statsPillText: "rgba(255, 255, 255, 0.8)",
} as const

const SANS = "Geist"
const MONO = "Geist Mono"

type Style = Record<string, unknown>
export type Node = { type: string; props: Record<string, unknown> }

/** Satori element helper. Children may be nodes, strings, or null. */
function h(type: string, style: Style, ...children: unknown[]): Node {
  const kids = children.flat().filter((c) => c !== null && c !== undefined && c !== false)
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

/** Entry fields the card reads, on top of what set grouping needs. */
export type CardEntry = SetGroupingEntry & {
  entry_id: string | number
  /** Display name, already resolved (songs.song_displayname ?? entry_song). */
  songName: string
  /** `entry_short`, when `shouldShowSetlistEntryShort` says to show it. */
  short?: string | null
  /** `entry_segue`, leading `>` already stripped. */
  segue?: string | null
  /** Per-entry coach notes as prepared rich HTML. */
  coachHtml?: string | null
}

export type CardDetailPillLine = { text: string; muted?: boolean }
export type CardDetailPill = {
  key: string
  lines: CardDetailPillLine[]
}

export type CardStatRow = {
  label: string
  value: string
  background: string
  borderColor: string
}

export type CardViewModel = {
  entries: CardEntry[]
  detailPills: CardDetailPill[]
  /**
   * Rarity and average-gap rows. Only the Instagram end-of-show image carries
   * them; the per-song Bluesky card shows the show poster in their place.
   */
  statRows: CardStatRow[]
  /** Data URI of the show poster, shown when there are no stat rows. */
  posterSrc?: string | null
  /** Prepared rich HTML for the aside coach-notes panel. */
  coachHtml?: string | null
  /** Prepared rich HTML for the callbacks block under the split. */
  callbacksHtml?: string | null
  showDiscographySetUi: boolean
  hasSinglePlacementType: boolean
  showEntryCoachNotes: boolean
}

export type CardAssets = {
  /** data: URI of the treated `-card` background. */
  backgroundSrc: string
  /** data: URI of the WL brand mark. */
  brandMarkSrc: string
}

/**
 * Converts prepared rich HTML into Satori nodes. Supplied by the caller so this
 * module stays dependency-free; `render.ts` wires in `satori-html`.
 */
export type RichParser = (html: string, style: Style) => unknown

/** Vertical padding for a song stack, by position within its run. */
function stackPadding(row: ShareExportRow<CardEntry>): Style {
  const first = row.isFirstOfRun
  const last = row.isLastOfRun
  return {
    paddingTop: first ? 4 : 2,
    paddingBottom: last ? 4 : 2,
  }
}

function songRow(
  row: ShareExportRow<CardEntry>,
  vm: CardViewModel,
  rich: RichParser,
): Node {
  const e = row.entry
  const showCoach = vm.showEntryCoachNotes && !!e.coachHtml

  return h(
    "div",
    {
      display: "flex",
      flexDirection: "column",
      marginLeft: SONG_INSET_LEFT_PX,
      marginRight: SONG_INSET_RIGHT_PX,
      width: SONG_CONTENT_WIDTH_PX,
      ...stackPadding(row),
    },
    h(
      "div",
      { display: "flex", flexDirection: "row", alignItems: "center", gap: 4, minWidth: 0 },
      /*
       * One span per word rather than a single string: Satori ignores
       * `wordSpacing`, so `columnGap` is the only way to tighten the space
       * between words.
       */
      h(
        "div",
        {
          display: "flex",
          flexGrow: 1,
          flexShrink: 1,
          minWidth: 0,
          overflow: "hidden",
          whiteSpace: "nowrap",
          maskImage: `linear-gradient(to right, #fff ${TITLE_FADE_STOP}, transparent 100%)`,
          columnGap: spaceWidthPx(SONG_FONT_SIZE_PX),
          fontSize: SONG_FONT_SIZE_PX,
          fontWeight: 500,
          color: C.songText,
          lineHeight: 1,
        },
        ...spacedWords(e.songName),
      ),
      e.short ?
        h(
          "div",
          {
            display: "flex",
            flexShrink: 0,
            alignItems: "center",
            fontFamily: MONO,
            fontSize: 9,
            fontWeight: 500,
            lineHeight: 1.35,
            letterSpacing: "-0.01em",
            paddingLeft: 4,
            paddingRight: 4,
            borderRadius: 4,
            background: C.shortBg,
            color: C.shortText,
            border: `1px solid ${C.shortBorder}`,
          },
          e.short,
        )
      : null,
      /*
       * `entry_segue` is normally the bare marker ">", meaning "segues into the
       * next song", and only sometimes carries a label. An empty string is
       * therefore meaningful — it still draws the arrow — so the check is
       * against null, not truthiness.
       */
      e.segue !== null && e.segue !== undefined ?
        h(
          "div",
          {
            display: "flex",
            flexShrink: 0,
            alignItems: "center",
            color: C.segueText,
            fontWeight: 700,
            fontSize: SONG_FONT_SIZE_PX,
            lineHeight: 1,
          },
          e.segue ? `→ ${e.segue}` : "→",
        )
      : null,
    ),
    /*
     * The indent is padding on a wrapper, not a margin on the rich block. The
     * rich parser sets `width: 100%`, and 100% plus a 12px margin overflows the
     * panel — which clipped the right-hand edge of every coach note.
     */
    showCoach ?
      h(
        "div",
        { display: "flex", width: COACH_WIDTH_PX, paddingLeft: COACH_INDENT_PX },
        rich(e.coachHtml!, {
          fontSize: 10,
          lineHeight: 1,
          color: C.coachText,
        }),
      )
    : null,
  )
}

function dividerBar(variant: "encore" | "set-break"): Node {
  const encore = variant === "encore"
  return h("div", {
    display: "flex",
    height: 9,
    background: encore ? C.encoreDividerBg : C.dividerBg,
    borderTop: `1px solid ${encore ? C.encoreRailBorder : C.railBorder}`,
  })
}

/** The rail: a fixed 14px column with its label rotated to read bottom-to-top. */
function rail(label: string, isEncore: boolean): Node {
  return h(
    "div",
    {
      display: "flex",
      width: RAIL_WIDTH_PX,
      minWidth: RAIL_WIDTH_PX,
      alignItems: "center",
      justifyContent: "center",
      background: isEncore ? C.encoreRailBg : C.railBg,
      borderRight: `1px solid ${isEncore ? C.encoreRailBorder : C.railBorder}`,
    },
    h(
      "div",
      {
        display: "flex",
        transform: "rotate(-90deg)",
        whiteSpace: "nowrap",
        fontFamily: MONO,
        fontSize: 8,
        fontWeight: 500,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: isEncore ? C.encoreRailText : C.railText,
        lineHeight: 1,
      },
      label,
    ),
  )
}

function setlistPanel(vm: CardViewModel, rich: RichParser): Node {
  const blocks = groupShareExportRuns(
    vm.entries,
    // Rows are derived here so the panel needs only the view model.
    buildShareExportRows(vm.entries, vm.showDiscographySetUi, vm.hasSinglePlacementType),
    vm.showDiscographySetUi,
    vm.hasSinglePlacementType,
  )

  return h(
    "div",
    {
      display: "flex",
      flexDirection: "column",
      borderRadius: 10,
      border: `1px solid ${C.frameBorder}`,
      background: C.panelBg,
      overflow: "hidden",
    },
    ...blocks.map((b) =>
      b.kind === "divider" ? dividerBar(b.variant)
      : h(
          "div",
          { display: "flex", flexDirection: "row", alignItems: "stretch" },
          rail(b.railLabel, b.isEncore),
          h(
            "div",
            { display: "flex", flexDirection: "column", width: SONG_COLUMN_WIDTH_PX },
            ...b.items.map((it) =>
              it.kind === "divider" ? dividerBar(it.variant)
              : songRow(it.row, vm, rich),
            ),
          ),
        ),
    ),
  )
}

function detailPill(pill: CardDetailPill): Node {
  return h(
    "div",
    {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 2,
      width: "100%",
      borderRadius: 10,
      border: `1px solid ${C.frameBorder}`,
      background: C.panelBg,
      paddingTop: 6,
      paddingBottom: 6,
      paddingLeft: 10,
      paddingRight: 10,
      fontSize: pill.key === "group-date" ? 13 : 11,
      fontWeight: 600,
      lineHeight: 1.25,
      color: C.pillText,
    },
    ...pill.lines.map((line) =>
      h(
        "div",
        {
          display: "flex",
          width: "100%",
          ...(line.muted ? { fontWeight: 500, color: C.pillMuted } : {}),
        },
        line.text,
      ),
    ),
  )
}

function statsPanel(rows: CardStatRow[]): Node {
  return h(
    "div",
    {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      padding: 8,
      borderRadius: 10,
      border: `1px solid ${C.frameBorder}`,
      background: C.panelBg,
      fontSize: 11,
      fontWeight: 500,
    },
    ...rows.map((r) =>
      h(
        "div",
        {
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
        },
        h(
          "div",
          { display: "flex", flexGrow: 1, minWidth: 0, color: C.statsLabel, lineHeight: 1.25 },
          r.label,
        ),
        h(
          "div",
          {
            display: "flex",
            flexShrink: 0,
            paddingTop: 1,
            paddingBottom: 1,
            paddingLeft: 4,
            paddingRight: 4,
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 500,
            lineHeight: 1.25,
            color: C.statsPillText,
            background: r.background,
            border: `1px solid ${r.borderColor}`,
          },
          r.value,
        ),
      ),
    ),
  )
}

/**
 * The show poster, clipped to the same rounded panel the stats use.
 *
 * Height is left to Satori so the poster keeps its own proportions — these are
 * gig posters and vary from square to tall portrait.
 */
function posterPanel(src: string): Node {
  const innerWidth = SPLIT_ASIDE_PX - 2 // less the 1px border on each side
  return h(
    "div",
    {
      display: "flex",
      width: SPLIT_ASIDE_PX,
      borderRadius: 10,
      border: `1px solid ${C.frameBorder}`,
      background: C.panelBg,
      overflow: "hidden",
    },
    img(src, { width: innerWidth, objectFit: "cover" }),
  )
}

/**
 * A rounded panel of a known width.
 *
 * The width is explicit because rich text inside resolves `width: "100%"`
 * against it: in an auto-width panel that collapses to min-content and every
 * word claims its own line.
 */
function panelBlock(children: unknown, width: number, marginTop = 8): Node {
  return h(
    "div",
    {
      display: "flex",
      flexDirection: "column",
      width,
      marginTop,
      borderRadius: 10,
      border: `1px solid ${C.frameBorder}`,
      background: C.panelBg,
      padding: 8,
    },
    children,
  )
}

function aside(vm: CardViewModel, rich: RichParser): Node {
  return h(
    "div",
    {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      width: SPLIT_ASIDE_PX,
      flexGrow: 0,
      flexShrink: 0,
      alignItems: "stretch",
    },
    vm.detailPills.length > 0 ?
      h(
        "div",
        { display: "flex", flexDirection: "column", gap: 6, width: "100%" },
        ...vm.detailPills.map(detailPill),
      )
    : null,
    vm.statRows.length > 0 ? statsPanel(vm.statRows) : null,
    vm.posterSrc ? posterPanel(vm.posterSrc) : null,
    vm.coachHtml ?
      panelBlock(
        rich(vm.coachHtml, {
          width: SPLIT_ASIDE_PX - PANEL_INSET_PX,
          fontSize: 10,
          lineHeight: 1.05,
          color: C.richText,
        }),
        SPLIT_ASIDE_PX,
        0,
      )
    : null,
  )
}

function brandBar(assets: CardAssets): Node {
  return h(
    "div",
    {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      marginLeft: -8,
      marginRight: -8,
      marginTop: -8,
      marginBottom: 8,
      paddingTop: 5,
      paddingBottom: 5,
      paddingLeft: 16,
      paddingRight: 16,
      background: C.brandGreen,
    },
    h(
      "div",
      { display: "flex", flexDirection: "row", alignItems: "center", gap: 12 },
      h(
        "div",
        {
          display: "flex",
          flexShrink: 0,
          width: 36,
          height: 36,
          borderRadius: 10,
          background: C.markBg,
          border: `1px solid ${C.markBorder}`,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        },
        img(assets.brandMarkSrc, { width: 26, height: 26, objectFit: "contain" }),
      ),
      h(
        "div",
        {
          display: "flex",
          fontWeight: 700,
          fontSize: 15,
          letterSpacing: "-0.01em",
          color: "#ffffff",
          lineHeight: 1,
        },
        "WTED Archives",
      ),
    ),
  )
}

/**
 * The card frame, at {@link CARD_WIDTH_PX} design width.
 *
 * `height` is intentionally unset — Satori measures the content, so a long
 * setlist grows the card. Callers that need a fixed canvas (Instagram) letterbox
 * the result rather than constraining it here.
 */
export function buildSetlistShareCard(
  vm: CardViewModel,
  assets: CardAssets,
  rich: RichParser,
): Node {
  return h(
    "div",
    {
      display: "flex",
      flexDirection: "column",
      width: CARD_WIDTH_PX,
      position: "relative",
      borderRadius: CARD_RADIUS_PX,
      border: `1px solid ${C.frameBorder}`,
      background: C.frameBg,
      overflow: "hidden",
      fontFamily: SANS,
      color: C.text,
      /*
       * The photo and its wash are background LAYERS on the frame, not absolutely
       * positioned children. The card's height follows its content, and
       * `height: 100%` on an absolutely positioned child of an auto-height box is
       * undefined — it rendered as nothing. Background layers track the frame.
       * Gradient first: earlier layers paint on top.
       */
      backgroundImage: `linear-gradient(180deg, rgba(40, 91, 78, 0.43) 0%, rgba(40, 91, 78, 0.86) 88%), url(${assets.backgroundSrc})`,
      backgroundSize: "100% 100%, cover",
      backgroundPosition: "center, center",
      backgroundRepeat: "no-repeat, no-repeat",
    },
    h(
      "div",
      {
        display: "flex",
        flexDirection: "column",
        padding: 8,
        width: "100%",
      },
      brandBar(assets),
      h(
        "div",
        {
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          gap: SPLIT_GAP_PX,
          width: "100%",
        },
        h(
          "div",
          {
            display: "flex",
            flexDirection: "column",
            width: SPLIT_MAIN_PX,
            flexGrow: 0,
            flexShrink: 0,
          },
          setlistPanel(vm, rich),
        ),
        aside(vm, rich),
      ),
      vm.callbacksHtml ?
        panelBlock(
          rich(vm.callbacksHtml, {
            width: CONTENT_WIDTH_PX - PANEL_INSET_PX,
            fontSize: 11,
            lineHeight: 1.05,
            color: C.richText,
          }),
          CONTENT_WIDTH_PX,
        )
      : null,
    ),
  )
}
