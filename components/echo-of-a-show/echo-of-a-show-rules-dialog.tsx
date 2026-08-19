"use client"

import { useEffect, useId } from "react"
import Link from "next/link"

import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"

const SCORING_LINES = [
  {
    pts: "+2",
    copy: (
      <>
        for correctly picking a <strong>song</strong>.
      </>
    ),
    detail: "Pick Arcadia, and it was played at any point during the show, +2.",
  },
  {
    pts: "+2",
    copy: (
      <>
        for that <strong>song</strong> in the correct <strong>set</strong>.
      </>
    ),
    detail:
      "Arcadia in Set 1 and it was played in Set 1, +2. Set 2 or the encore, no points.",
  },
  {
    pts: "+3",
    copy: (
      <>
        for the correct <strong>spot</strong> in the correct set.
      </>
    ),
    detail:
      "Arcadia as the third song of Set 1, played in that exact spot, +3.",
  },
  {
    pts: "+2",
    copy: (
      <>
        for a <strong>set opener</strong> or <strong>set closer</strong>.
      </>
    ),
    detail:
      "Arcadia as Set 1 opener, and it opened any non-encore set, +2.",
  },
  {
    pts: "+3",
    copy: (
      <>
        for that opener or closer in the correct set.
      </>
    ),
    detail: "Arcadia as Set 1 opener, and it opened Set 1, +3.",
  },
  {
    pts: "+3",
    copy: (
      <>
        for the <strong>final song</strong> of the show.
      </>
    ),
    detail: "Pick Arcadia to close the show and it does, +3.",
  },
  {
    pts: "−3",
    neg: true,
    copy: (
      <>
        for every <strong>extra song</strong> you pick.
      </>
    ),
    detail: "Pick 14 songs and the band plays 12, six points come off.",
  },
] as const

const GUIDELINES = [
  "Up to five regular sets and three encores, with unlimited songs per set.",
  "Each song once per show — except New Original Song and New Cover Song.",
  "Submissions close one hour before the show’s local start time.",
  "Shows are scored once a recording lands on Bandcamp, nugs.net, YouTube, or tape.",
  "Every performance is tracked, whether or not the band lists it in Coach’s Notes.",
  "Submissions are timestamped; anything after the cutoff is removed.",
]

function EchoOfAShowRulesBody({ onPlayNext }: { onPlayNext?: () => void }) {
  return (
    <div className="echo-of-a-show-rules__grid">
      <section className="echo-of-a-show__panel">
        <div className="echo-of-a-show-rules__section-head">Scoring system</div>
        {SCORING_LINES.map((line) => (
          <div key={line.pts + line.detail} className="echo-of-a-show-rules__line">
            <div className="echo-of-a-show-rules__line-main">
              <span
                className={
                  "neg" in line && line.neg
                    ? "echo-of-a-show-rules__pts echo-of-a-show-rules__pts--neg"
                    : "echo-of-a-show-rules__pts"
                }
              >
                {line.pts}
              </span>
              <span className="echo-of-a-show-rules__line-copy">{line.copy}</span>
            </div>
            <div className="echo-of-a-show-rules__detail">{line.detail}</div>
          </div>
        ))}
      </section>

      <div className="echo-of-a-show-rules__side">
        <div className="echo-of-a-show-rules__lede">
          Guess the setlist before the band plays it.
        </div>
        <section className="echo-of-a-show__panel">
          <div className="echo-of-a-show-rules__section-head">Guidelines</div>
          <div className="echo-of-a-show-rules__guide">
            {GUIDELINES.map((item) => (
              <div key={item} className="echo-of-a-show-rules__guide-row">
                <span className="echo-of-a-show-rules__guide-dash">—</span>
                <span className="echo-of-a-show-rules__guide-copy">{item}</span>
              </div>
            ))}
          </div>
        </section>
        <div className="echo-of-a-show-rules__bug">
          Hit an unforeseen error?{" "}
          <Link href="/archive/submit">Submit a bug report</Link>.
        </div>
        {onPlayNext ?
          <button
            type="button"
            className="echo-of-a-show-rules__cta"
            onClick={onPlayNext}
          >
            Play the next show
          </button>
        : null}
      </div>
    </div>
  )
}

export function EchoOfAShowRulesDialog({
  open,
  onOpenChange,
  onPlayNext,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPlayNext?: () => void
}) {
  const headingId = useId()
  useWlHomeV2ScrollLock(open)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  if (!open) return null

  const onClose = () => onOpenChange(false)

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className="modal-backdrop open"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          className="modal modal--wted-request echo-of-a-show-rules"
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-request-head">
            <div className="modal-request-head-text">
              <h3 id={headingId}>Rules</h3>
            </div>
            <button
              type="button"
              className="modal-request-close"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="modal-request-body">
            <EchoOfAShowRulesBody
              onPlayNext={
                onPlayNext
                  ? () => {
                      onClose()
                      onPlayNext()
                    }
                  : undefined
              }
            />
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}
