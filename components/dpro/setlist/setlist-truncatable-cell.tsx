"use client"

import {
  cloneElement,
  isValidElement,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react"

import { Plus } from "@phosphor-icons/react"

import { cn } from "@/lib/utils"

/** `SetlistEntryGuestsCell` must use `nowrap` so measure / clip see real horizontal overflow. */
function withPersonnelNowrap(children: ReactNode, nowrap: boolean): ReactNode {
  if (!isValidElement(children)) return children
  return cloneElement(children as ReactElement<{ nowrap?: boolean }>, {
    nowrap,
  })
}

/**
 * One-line collapsed coach preview when `collapseHtml` is not used (plain text fallback).
 */
const COACH_COLLAPSED_PLAIN_TYPO =
  "block min-w-0 max-w-full text-[10px] leading-2.5 text-muted-foreground whitespace-nowrap break-normal text-clip"

/** Collapsed strip height (row band; pills / control align inside). */
export const SETLIST_TRUNC_COLLAPSED_ROW_PX = 24.5

/**
 * Coach notes (expanded + measure of full HTML). No `w-full` on this root — it breaks shrink-to-fit
 * inside the off-screen `w-max max-w-[…]` measure box.
 */
const COACH_BLOCK_TYPO =
  "block min-w-0 max-w-full whitespace-normal break-words text-[10px] leading-2.5 text-muted-foreground [&_a]:font-semibold [&_a]:text-wl-orange [&_a]:hover:underline [&_p]:my-0"

/** Expand control: yellow circle + black plus (Phosphor). */
const EXPAND_BUTTON_CLASS =
  "inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-yellow-500 px-1 text-black shadow-sm transition-colors hover:bg-yellow-500/90 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"

/** Soft fade at the right edge of clipped collapsed content (personnel pills / coach notes). */
const COLLAPSED_RIGHT_FADE_MASK_STYLE = {
  maskImage:
    "linear-gradient(to right, #000 0%, #000 calc(100% - 1.25rem), transparent 100%)",
  WebkitMaskImage:
    "linear-gradient(to right, #000 0%, #000 calc(100% - 1.25rem), transparent 100%)",
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
  maskSize: "100% 100%",
  WebkitMaskSize: "100% 100%",
} as const

type SetlistTruncatableCellProps = {
  /** e.g. `max-w-[300px]` — visible cell cap */
  maxWidthClass: string
  /** Off-screen measure box: use `w-max max-w-[…]` (same cap as column) so narrow content stays narrow. */
  measureWidthClass: string
  /** Changes when content changes (e.g. entry id) */
  measureKey: string
  children: React.ReactNode
  /** aria-label for the expand control */
  expandLabel: string
  /** `pills` = guest chips (one horizontal row when collapsed); `block` = coach notes HTML */
  variant?: "pills" | "block"
  className?: string
  /**
   * Merged with `COACH_COLLAPSED_PLAIN_TYPO` when `variant="block"` (collapsed strip + measure).
   */
  blockPlainClassName?: string
  /** Classes for collapsed HTML strip (`collapseHtml`); defaults to coach block + `blockPlainClassName`. */
  collapseHtmlClassName?: string
  /** Classes for full-width inline collapsed HTML (external expand, no clip). */
  collapseHtmlInlineClassName?: string
  /**
   * When `variant="block"`, plain text for collapsed row + measure (HTML stripped). Ignored when
   * `collapseHtml` is set — then collapsed strip renders HTML (preserves pills, links, markup).
   */
  plainCollapsedText?: string
  /** When `variant="block"`, render this HTML in the collapsed strip (one-line clip) and for measure. */
  collapseHtml?: string
  /**
   * Fires when the collapsed truncated state is active (`needsMore && !expanded`).
   * Parent table cells can switch `vertical-align` so the strip is centered in tall rows.
   */
  onTruncatedCollapsedChange?: (isTruncatedCollapsed: boolean) => void
  /**
   * When true, keep the collapsed preview (plain / `collapseHtml`) until the user expands,
   * even if the content fits without horizontal truncation.
   */
  forceCollapsedPreview?: boolean
  /**
   * When set, the expand control calls this instead of revealing inline content
   * (e.g. pair rows: split into individual song rows).
   */
  onExpandClick?: () => void
  /** When true, render expanded content on first mount (e.g. after pair split from coach notes). */
  defaultExpanded?: boolean
}

/**
 * Collapsed: one line — pills use `flex-nowrap` + horizontal clip; coach uses plain text + same clip/fade.
 * Expanded: full content. Yellow plus expands only. Column uses `w-max` + `max-w-*` until truncation.
 */
export function SetlistTruncatableCell({
  maxWidthClass,
  measureWidthClass,
  measureKey,
  children,
  expandLabel,
  variant = "pills",
  className,
  blockPlainClassName,
  plainCollapsedText = "",
  collapseHtml,
  collapseHtmlClassName,
  collapseHtmlInlineClassName,
  onTruncatedCollapsedChange,
  forceCollapsedPreview = false,
  onExpandClick,
  defaultExpanded = false,
}: SetlistTruncatableCellProps) {
  const useExternalExpand = !!onExpandClick
  const blockPlain = cn(COACH_COLLAPSED_PLAIN_TYPO, blockPlainClassName)
  const blockCollapseHtmlClass =
    collapseHtmlClassName ??
    cn(COACH_BLOCK_TYPO, blockPlainClassName, "whitespace-nowrap")
  const blockCollapseInlineClass =
    collapseHtmlInlineClassName ??
    cn(COACH_BLOCK_TYPO, blockPlainClassName)
  const useCollapseHtml = variant === "block" && !!collapseHtml?.trim()
  const measureRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const [needsMore, setNeedsMore] = useState(false)
  const [expanded, setExpanded] = useState(defaultExpanded)

  const measure = useCallback(() => {
    const measureEl = measureRef.current
    if (!measureEl) return
    if (variant === "pills") {
      setNeedsMore(measureEl.scrollWidth > measureEl.clientWidth + 0.5)
      return
    }
    const inner = measureEl.firstElementChild as HTMLElement | null
    const box = inner ?? measureEl
    const intrinsicWidth = box.scrollWidth
    const visibleWidth = rootRef.current?.clientWidth ?? intrinsicWidth
    setNeedsMore(intrinsicWidth > visibleWidth + 0.5)
  }, [variant])

  useLayoutEffect(() => {
    measure()
  }, [measureKey, measure, children, plainCollapsedText, collapseHtml, useCollapseHtml])

  useLayoutEffect(() => {
    if (typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(() => measure())
    const measureEl = measureRef.current
    const rootEl = rootRef.current
    if (measureEl) ro.observe(measureEl)
    if (rootEl) ro.observe(rootEl)
    return () => ro.disconnect()
  }, [measure])

  const isTruncatedCollapsed =
    useExternalExpand ? needsMore : (needsMore || forceCollapsedPreview) && !expanded
  useLayoutEffect(() => {
    onTruncatedCollapsedChange?.(isTruncatedCollapsed)
  }, [isTruncatedCollapsed, onTruncatedCollapsedChange])

  const showCollapsedPreview =
    useExternalExpand ? needsMore : !expanded && (needsMore || forceCollapsedPreview)
  const showExpandControl = showCollapsedPreview && needsMore
  const showFullInline = useExternalExpand ? !needsMore : !showCollapsedPreview

  const expand = useCallback(() => {
    if (onExpandClick) {
      onExpandClick()
      return
    }
    setExpanded(true)
  }, [onExpandClick])

  const collapsedOuterStyle = {
    height: SETLIST_TRUNC_COLLAPSED_ROW_PX,
    maxHeight: SETLIST_TRUNC_COLLAPSED_ROW_PX,
  } as const

  const fillColumnWidth =
    variant === "block" ||
    needsMore ||
    (!useExternalExpand && expanded)

  const isInlineExpanded = !useExternalExpand && expanded

  return (
    <div
      ref={rootRef}
      className={cn(
        "min-w-0",
        maxWidthClass,
        fillColumnWidth ? "w-full" : "w-max",
        className,
      )}
      {...(isInlineExpanded ?
        { "data-setlist-trunc-expanded": "true" as const }
      : {})}
    >
      <div
        ref={measureRef}
        className={cn(
          "pointer-events-none invisible absolute -left-[9999px] top-0 -z-10 box-border",
          measureWidthClass,
        )}
        aria-hidden
      >
        {variant === "pills" ?
          withPersonnelNowrap(children, true)
        : useCollapseHtml ?
          <div
            className={blockCollapseHtmlClass}
            dangerouslySetInnerHTML={{ __html: collapseHtml!.trim() }}
          />
        : <div className={blockPlain}>{plainCollapsedText}</div>}
      </div>

      {showCollapsedPreview ?
        <div
          className={cn(
            "flex min-w-0 items-center gap-1 overflow-hidden transition-[max-height] duration-200 ease-out",
          )}
          style={
            variant === "pills" ? collapsedOuterStyle : undefined
          }
        >
          <div className="flex min-h-0 min-w-0 flex-1 items-center overflow-hidden">
            {variant === "pills" ?
              <div
                className="max-h-full min-w-0 overflow-x-hidden overflow-y-hidden"
                style={COLLAPSED_RIGHT_FADE_MASK_STYLE}
              >
                {withPersonnelNowrap(children, true)}
              </div>
            : useCollapseHtml ?
              <div
                className="max-h-[1lh] min-h-0 min-w-0 max-w-full overflow-x-hidden overflow-y-hidden"
                style={COLLAPSED_RIGHT_FADE_MASK_STYLE}
              >
                <div
                  className={blockCollapseHtmlClass}
                  dangerouslySetInnerHTML={{ __html: collapseHtml!.trim() }}
                />
              </div>
            : <div
                className="max-h-[1lh] min-h-0 min-w-0 max-w-full overflow-x-hidden overflow-y-hidden"
                style={COLLAPSED_RIGHT_FADE_MASK_STYLE}
              >
                <div className={blockPlain}>{plainCollapsedText}</div>
              </div>}
          </div>
          {showExpandControl ?
            <button
              type="button"
              className={EXPAND_BUTTON_CLASS}
              onClick={expand}
              aria-expanded={false}
              aria-label={expandLabel}
            >
              <Plus className="size-3.5 text-black" weight="bold" aria-hidden />
            </button>
          : null}
        </div>
      : showFullInline ?
        useExternalExpand && useCollapseHtml ?
          <div
            className={cn(
              blockCollapseInlineClass,
              "overflow-hidden whitespace-nowrap text-clip [&_*]:!whitespace-nowrap",
            )}
            dangerouslySetInnerHTML={{ __html: collapseHtml!.trim() }}
          />
        : <div
            className={cn(
              "transition-[max-height] duration-200 ease-out",
              (needsMore || forceCollapsedPreview) && expanded && "min-h-0 py-0.75",
              expanded && variant === "block" && "w-full min-w-0",
            )}
          >
            {variant === "pills" ?
              withPersonnelNowrap(children, false)
            : <div
                className={cn(
                  "w-full min-w-0",
                  expanded ?
                    "whitespace-normal break-words"
                  : "overflow-hidden whitespace-nowrap text-clip [&_*]:!whitespace-nowrap",
                )}
              >
                {children}
              </div>}
          </div>
      : null}
    </div>
  )
}

/** Coach notes / HTML blocks: same truncation with `dangerouslySetInnerHTML` inside children. */
export function SetlistTruncatableHtmlCell({
  maxWidthClass,
  measureWidthClass,
  measureKey,
  html,
  collapsedHtml,
  expandLabel,
  className,
  htmlContentClassName,
  collapsedHtmlContentClassName,
  blockPlainClassName,
  plainCollapsedText,
  forceCollapsedPreview,
  onExpandClick,
  defaultExpanded,
  onTruncatedCollapsedChange,
}: Omit<SetlistTruncatableCellProps, "children" | "variant"> & {
  html: string
  /** Collapsed one-line preview; defaults to `html` when omitted. */
  collapsedHtml?: string
  /** Merged with the coach HTML block (e.g. `!text-sm` to match 14px body). */
  htmlContentClassName?: string
  collapsedHtmlContentClassName?: string
}) {
  const trimmedHtml = html.trim()
  const trimmedCollapsedHtml = (collapsedHtml ?? html).trim()
  const collapsedPlain = plainCollapsedText?.trim() ?? ""
  const usePlainCollapsed = collapsedPlain.length > 0
  const collapsedNotesClass =
    collapsedHtmlContentClassName ?? htmlContentClassName

  const content = (
    <div
      className={cn(COACH_BLOCK_TYPO, htmlContentClassName)}
      dangerouslySetInnerHTML={{ __html: trimmedHtml }}
    />
  )

  return (
    <SetlistTruncatableCell
      maxWidthClass={maxWidthClass}
      measureWidthClass={measureWidthClass}
      measureKey={measureKey}
      expandLabel={expandLabel}
      variant="block"
      className={className}
      blockPlainClassName={blockPlainClassName}
      plainCollapsedText={collapsedPlain}
      collapseHtml={usePlainCollapsed ? undefined : trimmedCollapsedHtml}
      collapseHtmlClassName={cn(
        COACH_BLOCK_TYPO,
        collapsedNotesClass,
        "whitespace-nowrap",
      )}
      collapseHtmlInlineClassName={cn(COACH_BLOCK_TYPO, collapsedNotesClass)}
      onTruncatedCollapsedChange={onTruncatedCollapsedChange}
      forceCollapsedPreview={forceCollapsedPreview}
      onExpandClick={onExpandClick}
      defaultExpanded={defaultExpanded}
    >
      {content}
    </SetlistTruncatableCell>
  )
}
