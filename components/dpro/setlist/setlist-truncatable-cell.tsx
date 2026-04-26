"use client"

import {
  cloneElement,
  isValidElement,
  useCallback,
  useLayoutEffect,
  useMemo,
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
 * One-line collapsed coach preview (no HTML). Rich markup stacks/wraps unpredictably; plain text
 * matches personnel’s single-line strip + fade + plus.
 */
function stripCoachNotesToPlainText(html: string): string {
  let s = html
  s = s.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
  s = s.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
  s = s.replace(/<br\s*\/?>/gi, " ")
  s = s.replace(/<\/(p|div|h[1-6]|li|tr|blockquote)>/gi, " ")
  s = s.replace(/<[^>]+>/g, "")
  s = s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
  return s.replace(/\s+/g, " ").trim()
}

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
  /**
   * When `variant="block"`, plain text for collapsed row + measure (HTML stripped). Expanded still uses `children`.
   */
  plainCollapsedText?: string
  /**
   * Fires when the collapsed truncated state is active (`needsMore && !expanded`).
   * Parent table cells can switch `vertical-align` so the strip is centered in tall rows.
   */
  onTruncatedCollapsedChange?: (isTruncatedCollapsed: boolean) => void
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
  onTruncatedCollapsedChange,
}: SetlistTruncatableCellProps) {
  const blockPlain = cn(COACH_COLLAPSED_PLAIN_TYPO, blockPlainClassName)
  const measureRef = useRef<HTMLDivElement>(null)
  const [needsMore, setNeedsMore] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const measure = useCallback(() => {
    const el = measureRef.current
    if (!el) return
    if (variant === "pills") {
      setNeedsMore(el.scrollWidth > el.clientWidth + 0.5)
      return
    }
    const inner = el.firstElementChild as HTMLElement | null
    const box = inner ?? el
    setNeedsMore(box.scrollWidth > box.clientWidth + 0.5)
  }, [variant])

  useLayoutEffect(() => {
    measure()
  }, [measureKey, measure, children, plainCollapsedText])

  useLayoutEffect(() => {
    const el = measureRef.current
    if (!el || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(() => measure())
    ro.observe(el)
    return () => ro.disconnect()
  }, [measure])

  const isTruncatedCollapsed = needsMore && !expanded
  useLayoutEffect(() => {
    onTruncatedCollapsedChange?.(isTruncatedCollapsed)
  }, [isTruncatedCollapsed, onTruncatedCollapsedChange])

  const expand = useCallback(() => {
    setExpanded(true)
  }, [])

  const collapsedOuterStyle = {
    height: SETLIST_TRUNC_COLLAPSED_ROW_PX,
    maxHeight: SETLIST_TRUNC_COLLAPSED_ROW_PX,
  } as const

  return (
    <div
      className={cn(
        "min-w-0",
        maxWidthClass,
        needsMore ? "w-full" : "w-max",
        className,
      )}
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
        : <div className={blockPlain}>{plainCollapsedText}</div>}
      </div>

      {needsMore && !expanded ?
        <div
          className={cn(
            "flex min-w-0 items-center gap-1 overflow-hidden transition-[max-height] duration-200 ease-out",
            variant === "block" && "min-h-[24.5px]",
          )}
          style={variant === "pills" ? collapsedOuterStyle : undefined}
        >
          <div className="flex min-h-0 min-w-0 flex-1 items-center overflow-hidden">
            {variant === "pills" ?
              <div
                className="max-h-full min-w-0 overflow-x-hidden overflow-y-hidden"
                style={COLLAPSED_RIGHT_FADE_MASK_STYLE}
              >
                {withPersonnelNowrap(children, true)}
              </div>
            : <div
                className="max-h-[1lh] min-h-0 min-w-0 max-w-full overflow-x-hidden overflow-y-hidden"
                style={COLLAPSED_RIGHT_FADE_MASK_STYLE}
              >
                <div className={blockPlain}>{plainCollapsedText}</div>
              </div>}
          </div>
          <button
            type="button"
            className={EXPAND_BUTTON_CLASS}
            onClick={expand}
            aria-expanded={false}
            aria-label={expandLabel}
          >
            <Plus className="size-3.5 text-black" weight="bold" aria-hidden />
          </button>
        </div>
      : <div
          className={cn(
            "transition-[max-height] duration-200 ease-out",
            needsMore && expanded && "min-h-0 py-0.75",
          )}
        >
          {variant === "pills" ?
            withPersonnelNowrap(children, false)
          : <div className="w-full min-w-0">{children}</div>}
        </div>
      }
    </div>
  )
}

/** Coach notes / HTML blocks: same truncation with `dangerouslySetInnerHTML` inside children. */
export function SetlistTruncatableHtmlCell({
  maxWidthClass,
  measureWidthClass,
  measureKey,
  html,
  expandLabel,
  className,
  htmlContentClassName,
  blockPlainClassName,
  onTruncatedCollapsedChange,
}: Omit<SetlistTruncatableCellProps, "children" | "variant" | "plainCollapsedText"> & {
  html: string
  /** Merged with the coach HTML block (e.g. `!text-sm` to match 14px body). */
  htmlContentClassName?: string
}) {
  const plainCollapsedText = useMemo(
    () => stripCoachNotesToPlainText(html),
    [html],
  )

  const content = (
    <div
      className={cn(COACH_BLOCK_TYPO, htmlContentClassName)}
      dangerouslySetInnerHTML={{ __html: html }}
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
      plainCollapsedText={plainCollapsedText}
      onTruncatedCollapsedChange={onTruncatedCollapsedChange}
    >
      {content}
    </SetlistTruncatableCell>
  )
}
