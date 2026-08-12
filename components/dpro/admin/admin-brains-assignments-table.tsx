"use client"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { formatBrainsShowLabel } from "@/lib/brains-window"
import type { BrainsAdminAssignment } from "@/types/brains"

type WindowState = "live" | "upcoming" | "closed" | "revoked"

function windowState(
  row: BrainsAdminAssignment,
  nowMs: number,
): WindowState {
  if (row.revoked_at) return "revoked"
  const start = new Date(row.access_start).getTime()
  const end = new Date(row.access_end).getTime()
  if (nowMs < start) return "upcoming"
  if (nowMs > end) return "closed"
  return "live"
}

const STATE_LABEL: Record<WindowState, string> = {
  live: "Live",
  upcoming: "Upcoming",
  closed: "Closed",
  revoked: "Revoked",
}

/** State is carried by form as well as text, so it reads at a glance. */
const STATE_PILL: Record<WindowState, string> = {
  live: "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/30",
  upcoming: "bg-sky-500/15 text-sky-200 ring-1 ring-sky-400/25",
  closed: "bg-white/10 text-white/50",
  revoked: "bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/25",
}

/** Windows are always shown in the viewer's own timezone. */
function formatLocal(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return "—"
  return d.toLocaleString(undefined, {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  })
}

interface AdminBrainsAssignmentsTableProps {
  assignments: BrainsAdminAssignment[]
  /** Server-anchored clock, so a wrong device clock cannot mislabel a window. */
  nowMs: number
  revokingUuid: string | null
  onRevoke: (uuid: string) => void
}

export function AdminBrainsAssignmentsTable({
  assignments,
  nowMs,
  revokingUuid,
  onRevoke,
}: AdminBrainsAssignmentsTableProps) {
  if (assignments.length === 0) {
    return (
      <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-white/50">
        No assignments in the last week
      </p>
    )
  }

  return (
    <div className="min-w-0 overflow-x-auto">
      <Table className="text-xs">
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">Person</TableHead>
            <TableHead>Show</TableHead>
            <TableHead className="whitespace-nowrap">Opens</TableHead>
            <TableHead className="whitespace-nowrap">Closes</TableHead>
            <TableHead className="whitespace-nowrap">State</TableHead>
            <TableHead className="sr-only">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map((row) => {
            const state = windowState(row, nowMs)
            const canRevoke = state === "live" || state === "upcoming"
            return (
              <TableRow key={row.uuid}>
                <TableCell className="whitespace-nowrap font-mono">
                  {row.profiles?.username ?? "—"}
                </TableCell>
                <TableCell className="min-w-0">
                  {formatBrainsShowLabel(row.shows)}
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {formatLocal(row.access_start)}
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {formatLocal(row.access_end)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span
                    className={cn(
                      "inline-block rounded px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.06em]",
                      STATE_PILL[state],
                    )}
                  >
                    {STATE_LABEL[state]}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap text-right">
                  {canRevoke && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="wl-home-v2-tours-header-pill"
                      disabled={revokingUuid === row.uuid}
                      onClick={() => onRevoke(row.uuid)}
                      title="End this window now"
                    >
                      {revokingUuid === row.uuid ? "Revoking…" : "Revoke"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
