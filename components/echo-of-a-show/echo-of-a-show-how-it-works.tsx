"use client"

import { useEffect, useId } from "react"

import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"

const STEPS = [
  {
    n: "1",
    title: "Build a setlist",
    copy: "Add songs, sort them into sets and encores. The first and last song in each set become its opener and closer — you don't tag them, the order does.",
  },
  {
    n: "2",
    title: "Submit before the cutoff",
    copy: "One hour before the show's local start time. Edit as much as you like until then — after that it's sealed.",
  },
  {
    n: "3",
    title: "Watch it score",
    copy: "As each song gets entered, your total moves. The show-closer bonus and the over-pick penalty settle when the show is scored.",
  },
] as const

export function EchoOfAShowHowItWorks({
  open,
  onOpenChange,
  onMakePicks,
  onFullRules,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onMakePicks: () => void
  onFullRules: () => void
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

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className="modal-backdrop open"
        role="presentation"
        onClick={(event) => {
          if (event.target === event.currentTarget) onOpenChange(false)
        }}
      >
        <div
          className="modal modal--wted-request echo-of-a-show-how"
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="modal-request-head">
            <div className="modal-request-head-text">
              <h3 id={headingId}>How it works</h3>
            </div>
            <button
              type="button"
              className="modal-request-close"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="echo-how">
            {STEPS.map((step) => (
              <section key={step.n} className="echo-how__step">
                <div className="echo-how__step-head">
                  <span className="echo-how__num">{step.n}</span>
                  <span className="echo-how__title">{step.title}</span>
                </div>
                <p>{step.copy}</p>
                {step.n === "1" ?
                  <div className="echo-how__chips" aria-hidden>
                    <span className="echo-how__chip echo-how__chip--opener">
                      1 Arcadia
                    </span>
                    <span className="echo-how__chip">2 Hot Tea</span>
                    <span className="echo-how__chip echo-how__chip--closer">
                      3 Tumble
                    </span>
                  </div>
                : null}
                {step.n === "2" ?
                  <p className="echo-how__warn">
                    Don&apos;t over-pick: every song past the number played
                    costs 3.
                  </p>
                : null}
                {step.n === "3" ?
                  <div className="echo-how__score-ex">
                    <span className="echo-how__hit">+10</span>
                    song, set, spot and placement
                  </div>
                : null}
              </section>
            ))}
            <button
              type="button"
              className="echo-of-a-show__cta-btn echo-of-a-show__cta-btn--lg echo-of-a-show__ghost-btn--block"
              onClick={onMakePicks}
            >
              Make my first picks
            </button>
            <button
              type="button"
              className="echo-reveal__skip"
              onClick={onFullRules}
            >
              Read the full rules
            </button>
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}
