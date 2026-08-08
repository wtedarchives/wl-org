"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CaretDown, CaretUp, CircleNotch } from "@phosphor-icons/react"

import type { SetlistAttendeeEntry } from "@/hooks/use-setlist-attendees"
import { formatOrdinal } from "@/lib/setlist-utils"
import { getUserProfileUrl } from "@/lib/user-profile-url"
import { cn } from "@/lib/utils"

import "./wl-home-v2-setlist-attendees-panel.css"

const P = "wl-home-v2-setlist-attendees-panel"

type SortKey = "attendee" | "show"
type SortDir = "asc" | "desc"

type WlHomeV2SetlistAttendeesPanelProps = {
  active: boolean
  attendees: SetlistAttendeeEntry[]
  isLoadingAttendees: boolean
  attendeesError: string | null
  onFetchAttendees: () => void
  /** When true, show numbers are Goose-canon eligible for this setlist. */
  showCanonPositions: boolean
  currentUserId?: string | null
  className?: string
}

function compareAttendees(
  a: SetlistAttendeeEntry,
  b: SetlistAttendeeEntry,
  sortKey: SortKey,
  sortDir: SortDir,
): number {
  const dir = sortDir === "asc" ? 1 : -1
  if (sortKey === "show") {
    const aPos = a.position
    const bPos = b.position
    if (aPos == null && bPos == null) {
      return a.username.localeCompare(b.username, undefined, {
        sensitivity: "base",
      })
    }
    if (aPos == null) return 1
    if (bPos == null) return -1
    if (aPos !== bPos) return (aPos - bPos) * dir
    return (
      a.username.localeCompare(b.username, undefined, {
        sensitivity: "base",
      }) * dir
    )
  }
  const byName = a.username.localeCompare(b.username, undefined, {
    sensitivity: "base",
  })
  if (byName !== 0) return byName * dir
  return a.userId.localeCompare(b.userId) * dir
}

export function WlHomeV2SetlistAttendeesPanel({
  active,
  attendees,
  isLoadingAttendees,
  attendeesError,
  onFetchAttendees,
  showCanonPositions,
  currentUserId = null,
  className,
}: WlHomeV2SetlistAttendeesPanelProps) {
  const [sortKey, setSortKey] = useState<SortKey>(
    showCanonPositions ? "show" : "attendee",
  )
  const [sortDir, setSortDir] = useState<SortDir>(
    showCanonPositions ? "desc" : "asc",
  )

  useEffect(() => {
    if (active) onFetchAttendees()
  }, [active, onFetchAttendees])

  useEffect(() => {
    if (!active) return
    setSortKey(showCanonPositions ? "show" : "attendee")
    setSortDir(showCanonPositions ? "desc" : "asc")
  }, [active, showCanonPositions])

  const sorted = useMemo(() => {
    const key = showCanonPositions ? sortKey : "attendee"
    return [...attendees].sort((a, b) => compareAttendees(a, b, key, sortDir))
  }, [attendees, showCanonPositions, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (!showCanonPositions && key === "show") return
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
      return
    }
    setSortKey(key)
    setSortDir(key === "show" ? "desc" : "asc")
  }

  const sortIcon =
    sortDir === "asc" ?
      <CaretUp className={`${P}__sort-icon`} weight="bold" aria-hidden />
    : <CaretDown className={`${P}__sort-icon`} weight="bold" aria-hidden />

  return (
    <div className={cn(P, "flex min-h-0 flex-1 flex-col overflow-hidden", className)}>
      <div className={`${P}__section ${P}__section--summary`}>
        <button
          type="button"
          className={cn(
            `${P}__sort-btn`,
            sortKey === "attendee" && `${P}__sort-btn--active`,
          )}
          onClick={() => toggleSort("attendee")}
          aria-label={
            sortKey === "attendee" ?
              `Sort by attendee, currently ${sortDir === "asc" ? "A to Z" : "Z to A"}. Click to reverse.`
            : "Sort by attendee"
          }
        >
          <span>Attendees</span>
          {sortKey === "attendee" ? sortIcon : null}
        </button>
        {showCanonPositions ?
          <button
            type="button"
            className={cn(
              `${P}__sort-btn`,
              sortKey === "show" && `${P}__sort-btn--active`,
            )}
            onClick={() => toggleSort("show")}
            aria-label={
              sortKey === "show" ?
                `Sort by show number, currently ${sortDir === "asc" ? "ascending" : "descending"}. Click to reverse.`
              : "Sort by show number"
            }
          >
            <span>Show #</span>
            {sortKey === "show" ? sortIcon : null}
          </button>
        : null}
      </div>

      <div className={`${P}__scroll`}>
        <div className={`${P}__list`}>
          {attendeesError ?
            <div className={`${P}__error-banner`}>{attendeesError}</div>
          : null}
          {isLoadingAttendees ?
            <div className={`${P}__loading`}>
              <CircleNotch className={`${P}__loading-icon`} aria-hidden />
              <span className={`${P}__loading-text`}>Loading attendees…</span>
            </div>
          : null}
          {!isLoadingAttendees && !attendeesError && attendees.length === 0 ?
            <p className={`${P}__empty`}>No attendees yet for this show.</p>
          : null}
          {!isLoadingAttendees && !attendeesError && attendees.length > 0 ?
            sorted.map((entry) => {
              const isCurrentUser =
                currentUserId != null && entry.userId === currentUserId
              return (
                <div
                  key={entry.userId}
                  className={cn(
                    `${P}__row`,
                    isCurrentUser && `${P}__row--current`,
                  )}
                >
                  <Link
                    href={getUserProfileUrl(entry.userId)}
                    className={`${P}__user`}
                  >
                    {entry.username}
                  </Link>
                  {showCanonPositions ?
                    <span className={`${P}__position`}>
                      {entry.position != null ?
                        formatOrdinal(entry.position)
                      : "—"}
                    </span>
                  : null}
                </div>
              )
            })
          : null}
        </div>
      </div>
    </div>
  )
}
