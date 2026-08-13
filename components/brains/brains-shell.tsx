"use client"

import Image from "next/image"
import { useCallback, useMemo, useState } from "react"

import { AdminTabShell } from "@/components/dpro/admin/admin-tab-shell"
import { AdminTabToolbar } from "@/components/dpro/admin/admin-tab-toolbar"
import { ShowDropdown } from "@/components/dpro/admin/setlist/show-dropdown"
import { Button } from "@/components/ui/button"
import { useBrainsAccess } from "@/hooks/use-brains-access"
import { useBrainsShows } from "@/hooks/use-brains-shows"
import { formatBrainsShowLabel } from "@/lib/brains-window"
import type { ShowData } from "@/types/admin"
import type { BrainsMyAssignment, BrainsShowRef } from "@/types/brains"

import { BrainsCountdown } from "./brains-countdown"
import { BrainsWorkProvider, type BrainsWorkValue } from "./brains-work-context"

import "./brains-page.css"

function showRefFromShowData(show: ShowData | undefined): BrainsShowRef | null {
  if (!show) return null
  return {
    show_date: show.show_date,
    show_group: show.show_group,
    show_subvenue: show.show_subvenue,
    show_venue_location: show.show_venue_location,
  }
}

/**
 * Chrome for `/archive/brains`: which show is being worked, how long is left, and
 * the read-only lockout when the window closes.
 *
 * Show selection is settled by access rather than by a picker, which is why this
 * page can be show-centric at all — one live assignment opens straight into that
 * show with nothing to choose. A picker appears only when there is a genuine
 * choice: several live assignments, or an admin who may reach any show.
 */
export function BrainsShell({ children }: { children?: React.ReactNode }) {
  const { isAdmin, active, all, offsetMs, refresh, devMockBlocked } =
    useBrainsAccess()
  const { shows: adminShows, loading: adminShowsLoading } =
    useBrainsShows(isAdmin)

  const [adminShowId, setAdminShowId] = useState<string | null>(null)
  /** Set only when there was a real choice to make; see `chosen` below. */
  const [chosenUuid, setChosenUuid] = useState<string | null>(null)

  /**
   * The assignment being worked, derived rather than stored so there is no effect
   * copying `active` into state.
   *
   * An explicit pick is resolved against `all`, not `active`, so the header keeps
   * naming the show after the window closes — the page goes read-only, it does not
   * forget what you were working on. A single live assignment needs no pick at all.
   */
  const chosen: BrainsMyAssignment | null = useMemo(() => {
    if (isAdmin) return null
    if (chosenUuid) return all.find((a) => a.uuid === chosenUuid) ?? null
    if (active.length === 1) return active[0]
    return null
  }, [isAdmin, chosenUuid, active, all])

  // A window that closes underneath us drops out of `active`, which the boundary
  // timer in useBrainsAccess re-evaluates at the exact moment it happens. So
  // expiry needs no state of its own either.
  const chosenStillLive = useMemo(
    () => (chosen ? active.some((a) => a.uuid === chosen.uuid) : false),
    [chosen, active],
  )
  const windowClosed = !isAdmin && !!chosen && !chosenStillLive

  const handleExpire = useCallback(() => {
    // The local countdown reaching zero is a prompt to confirm with the server,
    // not the source of truth.
    refresh()
  }, [refresh])

  const adminShowsById = useMemo(() => {
    const m = new Map<string, ShowData>()
    for (const s of adminShows) m.set(s.show_id, s)
    return m
  }, [adminShows])

  const showId = isAdmin ? adminShowId : chosen?.show_id ?? null
  const show = isAdmin
    ? showRefFromShowData(adminShowId ? adminShowsById.get(adminShowId) : undefined)
    : chosen?.shows ?? null

  const readOnly = !showId || windowClosed

  const work: BrainsWorkValue = useMemo(
    () => ({
      showId,
      show,
      readOnly,
      assignmentId: isAdmin ? null : chosen?.uuid ?? null,
      refreshAccess: refresh,
    }),
    [showId, show, readOnly, isAdmin, chosen, refresh],
  )

  const needsAssignmentChoice = !isAdmin && !chosen && active.length > 1

  return (
    <AdminTabShell className="wl-home-v2-brains-shell">
      <AdminTabToolbar title="wted-brains">
        <span className="flex min-w-0 items-center gap-2">
          <Image
            src="/Brain.jpg"
            alt=""
            width={16}
            height={16}
            className="size-4 shrink-0 rounded-full object-cover"
            aria-hidden
          />
          {!isAdmin && chosen ?
            <BrainsCountdown
              endsAt={chosen.access_end}
              offsetMs={offsetMs}
              onExpire={handleExpire}
            />
          : null}
          {isAdmin ?
            <ShowDropdown
              shows={adminShows}
              loading={adminShowsLoading}
              loadingProgress={adminShowsLoading ? 40 : 100}
              onShowSelect={(s) => setAdminShowId(s.show_id)}
              selectedShow={
                adminShowId ? adminShowsById.get(adminShowId) ?? null : null
              }
            />
          : null}
        </span>
      </AdminTabToolbar>

      {show ?
        <p className="wl-home-v2-brains-show-heading">
          {formatBrainsShowLabel(show)}
        </p>
      : null}

      {/* Dev only: explains why the page is empty under a mock session. */}
      {devMockBlocked ?
        <div
          role="status"
          className="flex min-w-0 flex-col gap-1 rounded-md border border-amber-400/30 bg-amber-500/10 px-3 py-2"
        >
          <p className="m-0 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-amber-200">
            Dev mock session
          </p>
          <p className="m-0 text-xs text-white/70">
            Layout renders, but assignments cannot load: the dev bar mints an
            unsigned token and the Edge Function rejects it. To exercise the real
            checks you need a genuinely signed session — sign in as this account
            for real, or run{" "}
            <code className="font-mono">scripts/dev-mint-session.mjs</code> if you
            have WYSTERIA_JWT_SECRET locally.
          </p>
        </div>
      : null}

      {windowClosed ?
        <div
          role="status"
          className="flex min-w-0 flex-col gap-1 rounded-md border border-rose-400/30 bg-rose-500/10 px-3 py-2"
        >
          <p className="m-0 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-rose-200">
            Editing window closed
          </p>
          <p className="m-0 text-xs text-white/70">
            Everything you saved is safe. Ask an admin to extend your access if the
            show ran long.
          </p>
        </div>
      : null}

      {needsAssignmentChoice ?
        <div className="widget-panel wl-home-v2-years-shows-panel wl-home-v2-years-shows-panel--natural flex min-w-0 flex-col gap-2 p-3 sm:p-4">
          <p className="m-0 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-white/60">
            Which show are you working?
          </p>
          <ul className="m-0 flex min-w-0 list-none flex-col gap-1.5 p-0">
            {active.map((a) => (
              <li key={a.uuid} className="min-w-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="wl-home-v2-tours-header-pill w-full justify-start text-left"
                  onClick={() => setChosenUuid(a.uuid)}
                >
                  <span className="min-w-0 truncate">
                    {formatBrainsShowLabel(a.shows)}
                  </span>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      : null}

      {!needsAssignmentChoice && !showId ?
        <div className="widget-panel wl-home-v2-admin-setlist-empty flex flex-col gap-3">
          <div className="wp-head">
            <span>Setlist</span>
          </div>
          <p className="m-0 text-[13px] leading-relaxed text-white/65">
            {isAdmin ?
              "Use the show picker above to load a setlist for editing."
            : "No show assigned right now."}
          </p>
        </div>
      : null}

      <BrainsWorkProvider value={work}>{children}</BrainsWorkProvider>
    </AdminTabShell>
  )
}
