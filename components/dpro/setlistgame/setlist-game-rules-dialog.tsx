"use client"

import { useEffect, useId } from "react"
import Link from "next/link"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"

import "./setlist-game-rules.css"

interface SetlistGameRulesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Match Request a Song / average-setlist centered modal chrome on WL Home v2. */
  wlHomeV2?: boolean
}

function SetlistGameRulesBody() {
  return (
    <div className="setlist-game-rules-prose">
      <div>
        <h4 className="setlist-game-rules-section-head">Scoring System</h4>
        <div className="setlist-game-rules-body-text">
          <div>
            <span className="setlist-game-rules-amount setlist-game-rules-amount--pos">
              +2 points
            </span>{" "}
            for correctly picking a{" "}
            <span className="setlist-game-rules-strong">song</span>.
            <span className="setlist-game-rules-detail">
              If you pick Arcadia, and it was played at any point during the
              show, +2 points.
            </span>
          </div>
          <div>
            <span className="setlist-game-rules-amount setlist-game-rules-amount--pos">
              +2 points
            </span>{" "}
            for correctly picking a{" "}
            <span className="setlist-game-rules-strong">song</span> in the
            correct <span className="setlist-game-rules-strong">set</span>.
            <span className="setlist-game-rules-detail">
              If you pick Arcadia to be played in Set 1, and it was played
              during Set 1, +2 points. If it was played in Set 2 or the Encore,
              no points.
            </span>
          </div>
          <div>
            <span className="setlist-game-rules-amount setlist-game-rules-amount--pos">
              +3 points
            </span>{" "}
            for correctly picking a{" "}
            <span className="setlist-game-rules-strong">song</span> in the
            correct <span className="setlist-game-rules-strong">spot</span> in
            the correct <span className="setlist-game-rules-strong">set</span>.
            <span className="setlist-game-rules-detail">
              If you pick Arcadia to be played as the third song in Set 1, and
              it was played in that exact spot, +3 points.
            </span>
          </div>
          <div>
            <span className="setlist-game-rules-amount setlist-game-rules-amount--pos">
              +2 points
            </span>{" "}
            for correctly picking a{" "}
            <span className="setlist-game-rules-strong">song</span> as a{" "}
            <span className="setlist-game-rules-strong">set opener</span> or{" "}
            <span className="setlist-game-rules-strong">set closer</span>.
            <span className="setlist-game-rules-detail">
              If you pick Arcadia to be played as Set 1 Opener, and it opened
              any non-encore set, +2 points.
            </span>
          </div>
          <div>
            <span className="setlist-game-rules-amount setlist-game-rules-amount--pos">
              +3 points
            </span>{" "}
            for correctly picking a{" "}
            <span className="setlist-game-rules-strong">song</span> as a{" "}
            <span className="setlist-game-rules-strong">set opener</span> or{" "}
            <span className="setlist-game-rules-strong">set closer</span> in
            the correct <span className="setlist-game-rules-strong">set</span>.
            <span className="setlist-game-rules-detail">
              If you pick Arcadia to be played as Set 1 Opener, and it opened
              Set 1, +3 points.
            </span>
          </div>
          <div>
            <span className="setlist-game-rules-amount setlist-game-rules-amount--pos">
              +3 points
            </span>{" "}
            for correctly picking the{" "}
            <span className="setlist-game-rules-strong">final song</span> of the
            show, known as a show closer.
            <span className="setlist-game-rules-detail">
              If you pick Arcadia to close the show, and it&apos;s played as
              such, +3 points.
            </span>
          </div>
        </div>
      </div>

      <hr className="setlist-game-rules-divider" />

      <div>
        <h4 className="setlist-game-rules-section-head">Penalties</h4>
        <div className="setlist-game-rules-body-text">
          <div>
            <span className="setlist-game-rules-amount setlist-game-rules-amount--neg">
              -3 points
            </span>{" "}
            for every{" "}
            <span className="setlist-game-rules-strong">extra song</span> you
            pick for a show.
            <span className="setlist-game-rules-detail">
              If you pick 14 songs, and the band only plays 12, six points will
              be deducted.
            </span>
          </div>
        </div>
      </div>

      <hr className="setlist-game-rules-divider" />

      <div>
        <h4 className="setlist-game-rules-section-head">Guidelines</h4>
        <ul className="setlist-game-rules-guidelines">
          <li>
            Users can select one setlist per show, including up to five regular
            sets and three encore sets, with an infinite amount of songs per
            set.
          </li>
          <li>
            Users can select the same song only once per show. The only exception
            is when picking New Original Song or New Cover Song.
          </li>
          <li>
            Submissions will close one hour prior to the show&apos;s local start
            time.
          </li>
          <li>
            Scoring for shows takes place once a show&apos;s recording is
            available on Bandcamp, nugs.net, YouTube, or tape.
          </li>
          <li>
            We track all performances of every song, regardless if the band
            lists them in Coach&apos;s Notes.
          </li>
          <li>
            Submissions are timestamped, so if a submission is received after
            the cutoff date, it will be removed.
          </li>
        </ul>
      </div>

      <div className="setlist-game-rules-callout">
        <p>
          If you experience unforeseen errors,{" "}
          <Link
            href="/old/archive/submit"
            className="setlist-game-rules-callout-link"
          >
            submit a bug report here
          </Link>
          .
        </p>
      </div>
    </div>
  )
}

export function SetlistGameRulesDialog({
  open,
  onOpenChange,
  wlHomeV2 = false,
}: SetlistGameRulesDialogProps) {
  const headingId = useId()
  useWlHomeV2ScrollLock(open && wlHomeV2)

  useEffect(() => {
    if (!open || !wlHomeV2) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, wlHomeV2, onOpenChange])

  const onClose = () => onOpenChange(false)

  if (wlHomeV2) {
    if (!open) return null

    return (
      <WlHomeV2ModalPortal open={open}>
        <div
          className="modal-backdrop open"
          id="setlist-game-rules-modal"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
        >
          <div
            className="modal modal--wted-request modal--setlist-game-rules"
            role="dialog"
            aria-modal="true"
            aria-labelledby={headingId}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-request-head">
              <div className="modal-request-head-text">
                <h3 id={headingId}>Setlist Game Rules</h3>
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
              <div className="modal-setlist-game-rules-scroll">
                <SetlistGameRulesBody />
              </div>
            </div>
          </div>
        </div>
      </WlHomeV2ModalPortal>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="setlist-game-rules-dialog-content"
        showCloseButton={true}
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>Setlist Game Rules</DialogTitle>
        </DialogHeader>

        <div className="setlist-game-rules-dialog-scroll">
          <SetlistGameRulesBody />
        </div>
      </DialogContent>
    </Dialog>
  )
}
