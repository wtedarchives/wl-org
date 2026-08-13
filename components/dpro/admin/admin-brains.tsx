"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { useAuth } from "@/components/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import { supabase } from "@/lib/supabase"
import {
  deriveBrainsWindow,
  formatBrainsShowLabel,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/brains-window"
import { cn } from "@/lib/utils"
import type { UserSearchResult } from "@/lib/user-search"
import type { ShowData } from "@/types/admin"
import type {
  BrainsAdminAssignmentsResponse,
  BrainsAssignableShow,
} from "@/types/brains"

import { AdminBrainsAudit } from "./admin-brains-audit"
import { AdminTabShell } from "./admin-tab-shell"
import { AdminTabToolbar } from "./admin-tab-toolbar"
import { AdminBrainsAssignmentsTable } from "./admin-brains-assignments-table"
import { AdminBrainsUserPicker } from "./admin-brains-user-picker"
import { ShowDropdown } from "./setlist/show-dropdown"

/**
 * How far back the assignable-show list reaches. Assignment is a show-day
 * activity, so the full 1,568-show archive is not worth loading here — a
 * fortnight of history covers setlisting a show late.
 */
const ASSIGNABLE_HISTORY_DAYS = 14

/** Admin-only: grant and revoke wted-brains access to a show. */
export function AdminBrains() {
  const { session } = useAuth()
  const token = session?.token ?? null

  const [shows, setShows] = useState<BrainsAssignableShow[]>([])
  const [showsLoading, setShowsLoading] = useState(true)

  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null)
  const [selectedShowId, setSelectedShowId] = useState<string | null>(null)
  const [startLocal, setStartLocal] = useState("")
  const [endLocal, setEndLocal] = useState("")
  const [saving, setSaving] = useState(false)

  const [assignments, setAssignments] = useState<
    BrainsAdminAssignmentsResponse["assignments"]
  >([])
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [revokingUuid, setRevokingUuid] = useState<string | null>(null)
  const [view, setView] = useState<"assign" | "activity">("assign")
  const showsFetchedRef = useRef(false)

  // ─── Assignable shows ─────────────────────────────────────────────────────
  useEffect(() => {
    if (showsFetchedRef.current || !supabase) return
    showsFetchedRef.current = true
    const since = new Date(
      Date.now() - ASSIGNABLE_HISTORY_DAYS * 24 * 60 * 60 * 1000,
    )
      .toISOString()
      .slice(0, 10)
    void supabase
      .from("shows")
      .select(
        "show_id, show_date, show_group, show_subvenue, show_venue_location, show_canonid, show_time",
      )
      .gte("show_date", since)
      .order("show_date", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setShows(data as BrainsAssignableShow[])
        setShowsLoading(false)
      })
  }, [])

  const showsById = useMemo(() => {
    const m = new Map<string, BrainsAssignableShow>()
    for (const s of shows) m.set(s.show_id, s)
    return m
  }, [shows])

  const selectedShow = selectedShowId ? showsById.get(selectedShowId) : undefined

  // ─── Assignment list ──────────────────────────────────────────────────────
  const loadAssignments = useCallback(async () => {
    if (!token) return
    const { data, error } = await invokeDproAdmin<BrainsAdminAssignmentsResponse>(
      token,
      { action: "brains_assignments_list" },
    )
    if (error) {
      toast.error(error)
      return
    }
    if (data) {
      setAssignments(data.assignments)
      const serverNow = new Date(data.now).getTime()
      if (Number.isFinite(serverNow)) setNowMs(serverNow)
    }
  }, [token])

  useEffect(() => {
    void loadAssignments()
  }, [loadAssignments])

  // Keep the live / upcoming / closed labels honest while the tab sits open,
  // ticking from the last server reading rather than re-fetching every second.
  useEffect(() => {
    const id = window.setInterval(() => setNowMs((ms) => ms + 30_000), 30_000)
    return () => window.clearInterval(id)
  }, [])

  // ─── Window pre-fill ──────────────────────────────────────────────────────
  const applyShowSelection = (show: ShowData) => {
    setSelectedShowId(show.show_id)
    const full = showsById.get(show.show_id)
    const derived = deriveBrainsWindow(full?.show_time)
    // Shows without a show_time (most of the archive) get empty fields rather
    // than a guessed window — the admin types one.
    setStartLocal(derived ? toDatetimeLocalValue(derived.accessStart) : "")
    setEndLocal(derived ? toDatetimeLocalValue(derived.accessEnd) : "")
  }

  const canSave =
    !!selectedUser && !!selectedShowId && startLocal !== "" && endLocal !== ""

  const handleAssign = async () => {
    if (!token || !selectedUser || !selectedShowId) return
    const access_start = fromDatetimeLocalValue(startLocal)
    const access_end = fromDatetimeLocalValue(endLocal)
    if (!access_start || !access_end) {
      toast.error("Enter a valid window.")
      return
    }
    if (new Date(access_end) <= new Date(access_start)) {
      toast.error("The window has to end after it starts.")
      return
    }
    setSaving(true)
    try {
      const { error } = await invokeDproAdmin(token, {
        action: "brains_assignments_insert",
        show_id: selectedShowId,
        profile_id: selectedUser.id,
        access_start,
        access_end,
      })
      if (error) throw new Error(error)
      toast.success(`${selectedUser.username} can now edit this show.`)
      setSelectedUser(null)
      setSelectedShowId(null)
      setStartLocal("")
      setEndLocal("")
      await loadAssignments()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not assign.")
    } finally {
      setSaving(false)
    }
  }

  const handleRevoke = async (uuid: string) => {
    if (!token) return
    setRevokingUuid(uuid)
    try {
      const { error } = await invokeDproAdmin(token, {
        action: "brains_assignments_revoke",
        uuid,
      })
      if (error) throw new Error(error)
      toast.success("Access ended.")
      await loadAssignments()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not revoke.")
    } finally {
      setRevokingUuid(null)
    }
  }

  const showDataForDropdown: ShowData[] = useMemo(
    () =>
      shows.map((s) => ({
        show_id: s.show_id,
        show_date: s.show_date,
        show_group: s.show_group,
        show_subvenue: s.show_subvenue,
        show_venue_location: s.show_venue_location,
        show_canonid: s.show_canonid,
      })),
    [shows],
  )

  const selectedShowForDropdown =
    showDataForDropdown.find((s) => s.show_id === selectedShowId) ?? null

  return (
    <AdminTabShell>
      <AdminTabToolbar title="wted-brains access">
        {(["assign", "activity"] as const).map((v) => (
          <Button
            key={v}
            type="button"
            variant="ghost"
            size="sm"
            className={
              "wl-home-v2-tours-header-pill" + (view === v ? " bg-white/15" : "")
            }
            onClick={() => setView(v)}
          >
            {v === "assign" ? "Assign" : "Activity"}
          </Button>
        ))}
      </AdminTabToolbar>

      {view === "activity" ?
        <div className="widget-panel wl-home-v2-years-shows-panel wl-home-v2-years-shows-panel--natural flex min-h-0 min-w-0 flex-1 flex-col">
          <div
            className={cn(
              "wp-head wl-home-v2-years-shows-wp-head wl-home-v2-tours-shows-wp-head",
              "flex w-full min-w-0 shrink-0 flex-row flex-wrap items-center gap-x-3 gap-y-2 border-b border-[rgb(29,32,30)] pb-3",
            )}
          >
            <span className="wp-head-date min-w-0 truncate">Activity</span>
          </div>
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-3 sm:p-4">
            <AdminBrainsAudit />
          </div>
        </div>
      : <>
          <div className="wl-home-v2-archive-admin-song-form wl-home-v2-archive-admin-form--two-col wl-home-v2-archive-admin-show-form w-full min-w-0">
            <div className="wl-home-v2-archive-admin-song-form__grid">
              <div className="min-w-0">
                <label htmlFor="brains-admin-person">Person</label>
                <AdminBrainsUserPicker
                  selected={selectedUser}
                  onSelect={setSelectedUser}
                  inputId="brains-admin-person"
                />
              </div>

              <div className="min-w-0">
                <label>Show</label>
                <div className="flex min-w-0 flex-col gap-1">
                  <ShowDropdown
                    shows={showDataForDropdown}
                    loading={showsLoading}
                    loadingProgress={showsLoading ? 40 : 100}
                    onShowSelect={applyShowSelection}
                    selectedShow={selectedShowForDropdown}
                    triggerClassName="wl-home-v2-archive-admin-form-combobox-trigger w-full justify-between !normal-case !tracking-normal"
                  />
                  {selectedShow ?
                    <p className="min-w-0 break-words text-[11px] leading-relaxed text-white/65">
                      {formatBrainsShowLabel(selectedShow)}
                    </p>
                  : null}
                  {selectedShow && !selectedShow.show_time ?
                    <p className="text-[11px] leading-relaxed text-amber-200/80">
                      No show time on record — enter the window by hand
                    </p>
                  : null}
                </div>
              </div>

              <div className="min-w-0">
                <label htmlFor="brains-admin-opens">Access opens (your time)</label>
                <Input
                  id="brains-admin-opens"
                  type="datetime-local"
                  value={startLocal}
                  onChange={(e) => setStartLocal(e.target.value)}
                />
              </div>

              <div className="min-w-0">
                <label htmlFor="brains-admin-closes">
                  Access closes (your time)
                </label>
                <Input
                  id="brains-admin-closes"
                  type="datetime-local"
                  value={endLocal}
                  onChange={(e) => setEndLocal(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="wl-home-v2-tours-header-pill"
                disabled={!canSave || saving}
                onClick={() => void handleAssign()}
              >
                {saving ? "Assigning…" : "Assign"}
              </Button>
              <span className="text-[11px] leading-relaxed text-white/45">
                Defaults to 2h before through 6h after show time
              </span>
            </div>
          </div>

          <div className="widget-panel wl-home-v2-years-shows-panel wl-home-v2-years-shows-panel--natural flex min-h-0 min-w-0 flex-1 flex-col">
            <div
              className={cn(
                "wp-head wl-home-v2-years-shows-wp-head wl-home-v2-tours-shows-wp-head",
                "flex w-full min-w-0 shrink-0 flex-row flex-wrap items-center gap-x-3 gap-y-2 border-b border-[rgb(29,32,30)] pb-3",
              )}
            >
              <span className="wp-head-date min-w-0 truncate">
                Current &amp; recent
              </span>
            </div>
            <div className="wl-home-v2-years-table-scroll min-h-0 min-w-0 flex-1">
              <AdminBrainsAssignmentsTable
                assignments={assignments}
                nowMs={nowMs}
                revokingUuid={revokingUuid}
                onRevoke={(uuid) => void handleRevoke(uuid)}
              />
            </div>
          </div>
        </>
      }
    </AdminTabShell>
  )
}
