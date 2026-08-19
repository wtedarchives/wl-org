"use client"

import Link from "next/link"

import type { UserPick } from "@/hooks/use-user-picks"
import {
  formatEchoLockTimeEt,
} from "@/lib/echo-of-a-show"
import { echoPicksSummary } from "@/lib/echo-of-a-show-picks"
import { getEchoOfAShowShowUrl } from "@/lib/echo-of-a-show-url"

export function EchoOfAShowJoined({
  showId,
  showTime,
  picks,
  entryOf,
}: {
  showId: string
  showTime: string
  picks: UserPick[]
  entryOf: number
}) {
  const lockEt = formatEchoLockTimeEt(showTime)
  const summary = echoPicksSummary(picks)

  return (
    <div className="echo-joined">
      <span className="echo-of-a-show__status echo-of-a-show__status--open">
        Submitted
      </span>
      <h1 className="echo-joined__headline">
        You&apos;re in. Entry {entryOf} of {entryOf}.
      </h1>
      {summary ?
        <p className="echo-joined__summary">{summary}</p>
      : null}

      <section className="echo-joined__next">
        <div className="echo-joined__next-head">What happens next</div>
        <ul>
          <li className="echo-joined__item echo-joined__item--now">
            <span>Edit until {lockEt ? `${lockEt} ET` : "the cutoff"}</span>
            <span>One hour before doors. Change anything.</span>
          </li>
          <li className="echo-joined__item">
            <span>Songs land, your score moves</span>
            <span>Each song entered recalculates your total.</span>
          </li>
          <li className="echo-joined__item">
            <span>Final once the show is scored</span>
            <span>Closer bonus and over-picks applied.</span>
          </li>
        </ul>
      </section>

      <Link
        href={getEchoOfAShowShowUrl(showId)}
        className="echo-of-a-show__ghost-btn echo-of-a-show__ghost-btn--block"
      >
        See what others picked
      </Link>
    </div>
  )
}
