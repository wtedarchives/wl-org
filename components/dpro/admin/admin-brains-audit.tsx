"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { CaretDown } from "@phosphor-icons/react"
import { toast } from "sonner"

import { useAuth } from "@/components/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import { cn } from "@/lib/utils"
import type { BrainsAuditResponse, BrainsAuditRow } from "@/types/brains"

const OUTCOME_PILL: Record<BrainsAuditRow["outcome"], string> = {
  success: "bg-emerald-500/20 text-emerald-200",
  denied: "bg-rose-500/20 text-rose-200",
  error: "bg-amber-500/20 text-amber-200",
}

function formatWhen(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return "—"
  return d.toLocaleString(undefined, {
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  })
}

/**
 * Only the fields that differ between before and after, so a one-column edit reads
 * as one line instead of a wall of unchanged JSON.
 */
function diffLines(row: BrainsAuditRow): { key: string; from: string; to: string }[] {
  const before = (row.before ?? {}) as Record<string, unknown>
  const after = (row.after ?? {}) as Record<string, unknown>
  if (typeof before !== "object" || typeof after !== "object") return []
  const keys = new Set([...Object.keys(after)])
  const out: { key: string; from: string; to: string }[] = []
  for (const key of keys) {
    const a = JSON.stringify(before[key] ?? null)
    const b = JSON.stringify(after[key] ?? null)
    if (a !== b) out.push({ key, from: a, to: b })
  }
  return out
}

/**
 * Who changed what through wted-brains.
 *
 * Reads `brains_audit_log`, which the Edge Function writes server-side after
 * verifying the actor — including refused attempts, which are the most telling
 * rows. `surface` separates a setlister's work from an admin's; admin rows carry no
 * before-image by design, so their diffs show the submitted values only.
 */
export function AdminBrainsAudit() {
  const { session } = useAuth()
  const token = session?.token ?? null

  // null until a reply lands, so `loading` is derived rather than set
  // synchronously inside the effect.
  const [entries, setEntries] = useState<BrainsAuditRow[] | null>(null)
  const [usernameFilter, setUsernameFilter] = useState("")
  const [surface, setSurface] = useState<"all" | "brains" | "admin">("brains")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const load = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    if (!token) return
    let cancelled = false

    async function run() {
      const { data, error } = await invokeDproAdmin<BrainsAuditResponse>(token, {
        action: "brains_audit_list",
        ...(surface === "all" ? {} : { surface }),
      })
      if (cancelled) return
      if (error) {
        toast.error(error)
        setEntries([])
        return
      }
      setEntries(data?.entries ?? [])
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [token, surface, reloadKey])

  const loading = entries === null

  // Username filtering is client-side: the server already caps the result at 300
  // rows, so there is nothing to gain from a round trip per keystroke.
  const filtered = useMemo(() => {
    const rows = entries ?? []
    const q = usernameFilter.trim().toLowerCase()
    if (q === "") return rows
    return rows.filter((e) => e.actor_username.toLowerCase().includes(q))
  }, [entries, usernameFilter])

  return (
    <div className="wl-home-v2-archive-admin-song-form wl-home-v2-archive-admin-show-form flex min-w-0 flex-col gap-3">
      <div className="flex min-w-0 flex-wrap items-end gap-3">
        <div className="min-w-0 w-48">
          <label htmlFor="brains-audit-person">Person</label>
          <Input
            id="brains-audit-person"
            value={usernameFilter}
            onChange={(e) => setUsernameFilter(e.target.value)}
            placeholder="Filter by username"
          />
        </div>
        <div className="min-w-0">
          <p className="wl-home-v2-archive-admin-song-form__section-label mb-0.5">
            Surface
          </p>
          <div className="flex items-center gap-1">
            {(["brains", "admin", "all"] as const).map((s) => (
              <Button
                key={s}
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "wl-home-v2-tours-header-pill",
                  surface === s && "bg-white/15",
                )}
                onClick={() => setSurface(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="wl-home-v2-tours-header-pill"
          onClick={load}
        >
          Refresh
        </Button>
      </div>

      {loading ?
        <p className="m-0 text-xs text-white/65">Loading activity…</p>
      : filtered.length === 0 ?
        <p className="m-0 text-xs text-white/65">Nothing logged yet</p>
      : <ul className="m-0 flex min-w-0 list-none flex-col gap-1 p-0">
          {filtered.map((row) => {
            const isOpen = expanded === row.uuid
            const diff = diffLines(row)
            return (
              <li
                key={row.uuid}
                className="min-w-0 overflow-hidden rounded-md border border-[rgb(49,51,49)] bg-black/25"
              >
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : row.uuid)}
                  className="flex w-full min-w-0 items-center gap-2 px-2.5 py-2 text-left transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(255,122,103,0.45)]"
                >
                  <span className="shrink-0 font-mono text-[10px] tabular-nums text-white/50">
                    {formatWhen(row.created_at)}
                  </span>
                  <span className="shrink-0 text-xs font-medium text-white/90">
                    {row.actor_username}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs text-white/60">
                    {row.action}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.06em]",
                      OUTCOME_PILL[row.outcome],
                    )}
                  >
                    {row.outcome}
                  </span>
                  <CaretDown
                    className={cn(
                      "size-3 shrink-0 opacity-60 transition-transform duration-200",
                      isOpen && "rotate-180",
                    )}
                    aria-hidden
                  />
                </button>

                {isOpen ?
                  <div className="flex min-w-0 flex-col gap-1.5 border-t border-[rgb(49,51,49)] px-2.5 py-2">
                    <div className="flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/70">
                      <span className="min-w-0 break-words">
                        <span className="text-white/45">Show </span>
                        {row.show_label ?? "—"}
                      </span>
                      <span>
                        <span className="text-white/45">Surface </span>
                        {row.surface}
                      </span>
                      <span className="min-w-0 break-all">
                        <span className="text-white/45">Target </span>
                        {row.target_table ?? "—"}
                        {row.target_id ? ` · ${row.target_id.slice(0, 8)}` : ""}
                      </span>
                    </div>

                    {diff.length > 0 ?
                      <ul className="m-0 flex min-w-0 list-none flex-col gap-0.5 p-0">
                        {diff.map((d) => (
                          <li
                            key={d.key}
                            className="min-w-0 break-words font-mono text-[10px] text-white/70"
                          >
                            <span className="text-white/50">{d.key}: </span>
                            <span className="text-rose-200/80">{d.from}</span>
                            <span className="text-white/40"> → </span>
                            <span className="text-emerald-200/80">{d.to}</span>
                          </li>
                        ))}
                      </ul>
                    : <p className="m-0 text-[11px] text-white/50">
                        No field changes recorded
                      </p>
                    }
                  </div>
                : null}
              </li>
            )
          })}
        </ul>
      }
    </div>
  )
}
