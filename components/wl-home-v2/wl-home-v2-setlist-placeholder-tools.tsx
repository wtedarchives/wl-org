import { Check, UserPlus, Users } from "@phosphor-icons/react"

import { SetlistRatingStarsRow } from "@/components/dpro/setlist/setlist-rating-card"

export type WlHomeV2SetlistPlaceholderToolsProps = {
  hasAverageRating: boolean
  ratingValueDisplay: string
  reviewSummary: string
  averageRating: number
  attendeeCount: number
  attended: boolean
  attendanceToggling: boolean
  onAttendanceToggle: () => void
  onRatingClick: () => void
}

export function WlHomeV2SetlistPlaceholderRatingAttendees({
  hasAverageRating,
  ratingValueDisplay,
  reviewSummary,
  averageRating,
  attendeeCount,
  attended,
  attendanceToggling,
  onAttendanceToggle,
  onRatingClick,
}: WlHomeV2SetlistPlaceholderToolsProps) {
  return (
    <>
      <button
        type="button"
        className="wl-home-v2-setlist-tools-panel__rating side-card"
        onClick={onRatingClick}
        aria-label={
          hasAverageRating ?
            `Rating: ${ratingValueDisplay} out of 5. Click to rate or review.`
          : "Click to rate this show"
        }
      >
        <div className="sc-label">Rating</div>
        <div className="sc-stars-row">
          <SetlistRatingStarsRow
            rating={averageRating}
            sizeClassName="size-[14px]"
            fillClassName="text-[#ffd86b]"
            emptyClassName="text-white/25"
          />
        </div>
        <div className="sc-value">{ratingValueDisplay}</div>
        <div className="sc-sub">{reviewSummary}</div>
      </button>
      <div className="wl-home-v2-setlist-tools-panel__attendees side-card">
        <div className="sc-label normal-case tracking-normal">attendees</div>
        <div className="sc-value flex items-center gap-2">
          {attendeeCount.toLocaleString("en-US")}
          <Users
            className="size-[1.15em] shrink-0 text-white/85"
            aria-hidden
          />
        </div>
        <button
          type="button"
          className={
            "attend normal-case tracking-normal inline-flex items-center justify-center gap-1.5 " +
            (attended ? "attended" : "")
          }
          id="attend-btn"
          disabled={attendanceToggling}
          onClick={onAttendanceToggle}
        >
          {attendanceToggling ?
            "…"
          : attended ?
            <>
              <Check className="size-4 shrink-0" weight="bold" aria-hidden />
              attended
            </>
          : <>
              <UserPlus className="size-4 shrink-0" aria-hidden />
              i was there
            </>
          }
        </button>
      </div>
    </>
  )
}
