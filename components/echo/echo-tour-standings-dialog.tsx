"use client"

import { useEffect, useId, useState } from "react"
import { CaretDown, CaretUp } from "@phosphor-icons/react"

import { useAuth } from "@/components/auth-context"
import { echoFontClassName } from "@/components/echo/echo-fonts"
import type {
  PlayerStats,
  SortDirection,
  SortField,
} from "@/components/dpro/setlistgame/standings-types"
import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import { useStandingsData } from "@/hooks/use-standings-data"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import { cn } from "@/lib/utils"

import { ECHO_ACTIVE_LEAGUE } from "./echo-tour-data"

const SORT_COLUMNS: {
  field: SortField
  label: string
  align: "left" | "center"
  metric?: boolean
}[] = [
  { field: "username", label: "User", align: "left" },
  { field: "totalPoints", label: "Total points", align: "center", metric: true },
  { field: "showsPlayed", label: "Shows played", align: "center", metric: true },
  {
    field: "avgPointsPerShow",
    label: "Points per show",
    align: "center",
    metric: true,
  },
  { field: "songsPicked", label: "Songs picked", align: "center", metric: true },
  { field: "setsPicked", label: "Sets picked", align: "center", metric: true },
  {
    field: "showOpenersPicked",
    label: "Openers picked",
    align: "center",
    metric: true,
  },
  {
    field: "showClosersPicked",
    label: "Closers picked",
    align: "center",
    metric: true,
  },
]

function formatCell(field: SortField, player: PlayerStats): string {
  if (field === "avgPointsPerShow") return player.avgPointsPerShow.toFixed(2)
  if (field === "username") return player.username
  return String(player[field])
}

export function EchoTourStandingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const headingId = useId()
  const { session } = useAuth()
  const [sortField, setSortField] = useState<SortField>("totalPoints")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const { standings, loading } = useStandingsData(
    ECHO_ACTIVE_LEAGUE,
    sortField,
    sortDirection,
  )

  useWlHomeV2ScrollLock(open)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"))
      return
    }
    setSortField(field)
    setSortDirection("desc")
  }

  if (!open) return null

  const onClose = () => onOpenChange(false)

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className="modal-backdrop open"
        id="echo-standings-modal"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          className={`modal modal--wted-request modal--echo-standings echo-modal ${echoFontClassName}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-request-head">
            <div className="modal-request-head-text">
              <h3 id={headingId}>Tour standings</h3>
              <p className="echo-tour-standings-dialog-league">
                {ECHO_ACTIVE_LEAGUE}
              </p>
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
            {loading ?
              <p className="echo-tour-standings-dialog-empty">
                Loading standings…
              </p>
            : standings.length === 0 ?
              <p className="echo-tour-standings-dialog-empty">
                No standings available yet for this tour.
              </p>
            : <div
                className="echo-tour-standings-dialog-scroll"
                role="region"
                aria-labelledby={headingId}
              >
                <table className="echo-tour-standings-dialog-table">
                  <colgroup>
                    <col className="echo-tour-standings-dialog-col-rank" />
                    <col className="echo-tour-standings-dialog-col-user" />
                    <col className="echo-tour-standings-dialog-col-metric" span={7} />
                  </colgroup>
                  <thead className="echo-tour-standings-dialog-head">
                    <tr>
                      <th scope="col" className="is-center">
                        Rank
                      </th>
                      {SORT_COLUMNS.map((column) => (
                        <th
                          key={column.field}
                          scope="col"
                          className={cn(
                            column.align === "center" && "is-center",
                            column.align === "left" && "is-left",
                            column.metric && "is-metric",
                          )}
                        >
                          <button
                            type="button"
                            className={cn(
                              "echo-tour-standings-dialog-sort",
                              column.align === "left" && "is-left",
                            )}
                            onClick={() => handleSort(column.field)}
                          >
                            <span>{column.label}</span>
                            {sortField === column.field ?
                              sortDirection === "asc" ?
                                <CaretUp size={12} weight="bold" aria-hidden />
                              : <CaretDown size={12} weight="bold" aria-hidden />
                            : null}
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((player, index) => {
                      const isMe = Boolean(
                        session?.profileId &&
                          player.userId === session.profileId,
                      )
                      return (
                        <tr
                          key={player.userId}
                          className={cn(
                            "echo-tour-standings-dialog-row",
                            isMe && "is-me",
                          )}
                        >
                          <td className="is-center is-strong">{index + 1}</td>
                          <td
                            className={cn(
                              "echo-tour-standings-dialog-user",
                              isMe && "is-me",
                            )}
                          >
                            {player.username}
                          </td>
                          {SORT_COLUMNS.filter(
                            (column) => column.field !== "username",
                          ).map((column) => (
                            <td
                              key={column.field}
                              className={cn(
                                "is-center",
                                column.field === "totalPoints" ?
                                  "is-strong"
                                : "is-muted",
                              )}
                            >
                              {formatCell(column.field, player)}
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>}
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}
