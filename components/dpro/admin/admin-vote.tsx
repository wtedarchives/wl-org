"use client"

import { useEffect, useState } from "react"

import { useAuth } from "@/components/auth-context"
import { AdminTabShell } from "@/components/dpro/admin/admin-tab-shell"
import { AdminTabToolbar } from "@/components/dpro/admin/admin-tab-toolbar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import {
  getVoteSong,
  getVoteSongIdByName,
} from "@/components/vote/colorado-run-setlists"

type VoteResultRow = {
  selection: string
  points: number
  ballotPercent: number
  averageRank: number
}

type VoteResults = {
  ballotCount: number
  rows: VoteResultRow[]
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

function formatRank(value: number) {
  return value.toFixed(1)
}

function showLabel(selection: string) {
  const id = getVoteSongIdByName(selection)
  const entry = id ? getVoteSong(id) : null
  if (!entry) return "—"
  return `${entry.show.dateLabel} [${entry.show.location}]`
}

export function AdminVote() {
  const { session } = useAuth()
  const token = session?.token ?? null
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<VoteResults | null>(null)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      setError("You must be signed in.")
      return
    }
    let cancelled = false
    setLoading(true)
    void invokeDproAdmin<VoteResults>(token, {
      action: "colorado_run_vote_results",
    }).then(({ data, error: loadError }) => {
      if (cancelled) return
      if (loadError || !data) {
        setError(loadError ?? "Could not load vote results.")
        setResults(null)
      } else {
        setError(null)
        setResults(data)
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [token])

  const ballotLabel =
    results == null
      ? ""
      : `${results.ballotCount.toLocaleString()} ${results.ballotCount === 1 ? "ballot" : "ballots"}`

  return (
    <AdminTabShell>
      <AdminTabToolbar title="Colorado run vote">
        {ballotLabel ? (
          <span className="text-xs text-white/70">{ballotLabel}</span>
        ) : null}
      </AdminTabToolbar>
      {loading ? (
        <p className="text-sm text-white/70">Loading vote results…</p>
      ) : error ? (
        <p className="text-sm text-[#ffb999]" role="alert">
          {error}
        </p>
      ) : results && results.rows.length === 0 ? (
        <p className="text-sm text-white/70">No ballots yet.</p>
      ) : (
        <div className="min-w-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-white/70">Track</TableHead>
                <TableHead className="text-white/70">Show</TableHead>
                <TableHead className="text-right text-white/70">Points</TableHead>
                <TableHead className="text-right text-white/70">Ballots</TableHead>
                <TableHead className="text-right text-white/70">Avg rank</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results?.rows.map((row) => (
                <TableRow key={row.selection}>
                  <TableCell className="min-w-[12rem] whitespace-normal text-sm text-white">
                    {row.selection}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-white">
                    {showLabel(row.selection)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm text-white">
                    {row.points}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm text-white">
                    {formatPercent(row.ballotPercent)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm text-white">
                    {formatRank(row.averageRank)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminTabShell>
  )
}
