"use client"

import { useEffect, useId, useMemo, useState } from "react"

import { echoFontClassName } from "@/components/echo/echo-fonts"
import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import type { UserPick } from "@/hooks/use-user-picks"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import { cn } from "@/lib/utils"

import {
  buildEchoLivePickScore,
  buildEchoLivePickSets,
  buildEchoLiveSetlistSets,
  ECHO_OVERPICK_PENALTY,
  type EchoLiveEntry,
  type EchoLivePickRow,
} from "./echo-live-data"
import { EchoLiveSetlist } from "./echo-live-setlist"

function toEchoLivePickRows(picks: UserPick[]): EchoLivePickRow[] {
  return picks.map((pick) => ({
    song: pick.song,
    set: String(pick.set),
    setnum: pick.setnum,
    placement: pick.placement ?? null,
    score: pick.score ?? null,
    result: pick.result ?? null,
    showopener_correct: Boolean(pick.showopener_correct),
    showcloser_correct: Boolean(pick.showcloser_correct),
  }))
}

type SubmissionTab = "picks" | "setlist"

const SUBMISSION_TABS: { id: SubmissionTab; label: string }[] = [
  { id: "picks", label: "Picks" },
  { id: "setlist", label: "Setlist" },
]

export function EchoLiveSubmissionDialog({
  open,
  onOpenChange,
  username,
  entries,
  picks,
  complete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  username: string
  entries: EchoLiveEntry[]
  picks: UserPick[]
  complete: boolean
}) {
  const headingId = useId()
  const [activeTab, setActiveTab] = useState<SubmissionTab>("picks")
  useWlHomeV2ScrollLock(open)

  useEffect(() => {
    if (open) setActiveTab("picks")
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  const pickRows = useMemo(() => toEchoLivePickRows(picks), [picks])
  const setlistSets = useMemo(
    () => buildEchoLiveSetlistSets(entries, pickRows, complete),
    [complete, entries, pickRows],
  )
  const pickSets = useMemo(
    () => buildEchoLivePickSets(pickRows, entries, complete),
    [complete, entries, pickRows],
  )
  const pickScore = useMemo(
    () => buildEchoLivePickScore(pickRows, entries, complete),
    [complete, entries, pickRows],
  )
  const extraSongs = pickScore.extraSongs
  const extraPoints = extraSongs * ECHO_OVERPICK_PENALTY
  const totalLabel = `${pickScore.total} points`

  if (!open) return null

  const onClose = () => onOpenChange(false)

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className="modal-backdrop open"
        id="echo-submission-modal"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          className={`modal modal--wted-request modal--echo-submission echo-modal ${echoFontClassName}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-request-head">
            <div className="modal-request-head-text">
              <h3 id={headingId}>{username}&apos;s picks</h3>
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
            <div className="echo-live-submission-modal">
              <div
                className="echo-live-submission-tabs"
                role="tablist"
                aria-label="Submission views"
              >
                {SUBMISSION_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    id={`${headingId}-tab-${tab.id}`}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    aria-controls={`${headingId}-panel-${tab.id}`}
                    className={cn(
                      "echo-live-submission-tab",
                      activeTab === tab.id && "is-active",
                    )}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="echo-live-submission-scroll">
                <div className="echo-live-submission-panels">
                <div
                  id={`${headingId}-panel-picks`}
                  role="tabpanel"
                  aria-labelledby={`${headingId}-tab-picks`}
                  className={cn(
                    "echo-live-submission-panel",
                    activeTab === "picks" && "is-active",
                  )}
                >
                  <div className="echo-live-picks-head echo-live-submission-picks-head">
                    {pickSets.length > 0 ?
                      <span className="echo-live-total-pill">{totalLabel}</span>
                    : null}
                  </div>
                  {pickSets.length > 0 ?
                    <>
                      <EchoLiveSetlist sets={pickSets} showScores />
                      {extraSongs > 0 ?
                        <p className="echo-live-overpick">
                          {extraSongs} extra song
                          {extraSongs === 1 ? "" : "s"} picked:{" "}
                          <span className="echo-live-overpick-em">
                            -{extraPoints} points
                          </span>
                        </p>
                      : null}
                    </>
                  : <p className="echo-live-empty">No picks for this show.</p>}
                </div>

                <div
                  id={`${headingId}-panel-setlist`}
                  role="tabpanel"
                  aria-labelledby={`${headingId}-tab-setlist`}
                  className={cn(
                    "echo-live-submission-panel",
                    activeTab === "setlist" && "is-active",
                  )}
                >
                  {setlistSets.length > 0 ?
                    <EchoLiveSetlist sets={setlistSets} />
                  : <p className="echo-live-empty">
                      Setlist hasn&apos;t been entered yet.
                    </p>}
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}
