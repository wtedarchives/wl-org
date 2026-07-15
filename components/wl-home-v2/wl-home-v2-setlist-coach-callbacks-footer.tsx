"use client"

import { useInternalLinkInterceptor } from "@/hooks/use-internal-link-interceptor"
import { cn } from "@/lib/utils"

/** Show-level coach notes + callbacks under the setlist table (hidden when both empty). */
export function WlHomeV2SetlistCoachCallbacksFooter({
  coachNotesHtml,
  callbacksHtml,
  /** Orange rule above notes; omit when nothing (e.g. no song rows) sits above this block. */
  showDividerAfterTable = true,
}: {
  coachNotesHtml: string
  callbacksHtml: string
  showDividerAfterTable?: boolean
}) {
  const onLinkClick = useInternalLinkInterceptor()
  const hasCoach = coachNotesHtml.length > 0
  const hasCallbacks = callbacksHtml.length > 0
  if (!hasCoach && !hasCallbacks) return null

  const split = hasCoach && hasCallbacks

  const col = (label: string, html: string) => (
    <div className="setlist-card-notes-col">
      <div className="show-notes setlist-card-notes-col-inner">
        <div className="show-notes-inner">
          <div className="notes-label">{label}</div>
          <div
            onClick={onLinkClick}
            className="show-notes-body"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  )

  return (
    <>
      {showDividerAfterTable ?
        <div className="setlist-card-after-table-divider" aria-hidden />
      : null}
      <div
        className={cn(
          "setlist-card-notes-row",
          split && "setlist-card-notes-row--split",
        )}
      >
        {hasCoach ? col("Coach's Notes", coachNotesHtml) : null}
        {split ?
          <div className="setlist-card-notes-col-sep" aria-hidden />
        : null}
        {hasCallbacks ? col("Callbacks", callbacksHtml) : null}
      </div>
    </>
  )
}
