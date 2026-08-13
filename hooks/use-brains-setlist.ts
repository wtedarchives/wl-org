"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { useAuth } from "@/components/auth-context"
import { useBrainsStatsRebuild } from "@/hooks/use-brains-stats-rebuild"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import { supabase } from "@/lib/supabase"
import {
  applyBrainsDrag,
  sortBrainsEntries,
  type BrainsReorderRow,
} from "@/lib/brains-setlist-reorder"
import type { BrainsRebuildStatus } from "@/hooks/use-brains-stats-rebuild"
import type { AdminSetlistEntryData } from "@/types/admin"

/** Columns a brains caller may write; mirrors the Edge Function whitelist. */
export type BrainsEntryPatch = Partial<
  Pick<
    AdminSetlistEntryData,
    | "entry_set"
    | "entry_setnum"
    | "entry_song"
    | "entry_short"
    | "entry_segue"
    | "entry_placement"
    | "entry_coachnotes"
    | "entry_new"
  >
>

export interface UseBrainsSetlist {
  entries: AdminSetlistEntryData[]
  loading: boolean
  refresh: () => void
  insertEntry: (patch: BrainsEntryPatch) => Promise<string | null>
  updateEntry: (entryId: string, patch: BrainsEntryPatch) => Promise<boolean>
  deleteEntry: (entryId: string) => Promise<boolean>
  savePersonnel: (entryId: string, guestIds: string[]) => Promise<boolean>
  reorder: (activeId: string, overId: string) => Promise<void>
  /** Progress of the automatic stats rebuild, for the header indicator. */
  rebuildStatus: BrainsRebuildStatus
  /** Manual fallback behind the Update button. */
  rebuildNow: () => void
}

/**
 * The assigned show's setlist, plus the writes brains is allowed to make.
 *
 * Statistics rebuild automatically after every write, but are never awaited. The
 * Admin Panel's `useSetlistEntryActions` awaits `rpc_update_all_setlist_entries`
 * on each save, which means a 30–45 second pause per song — unusable during a live
 * show. `useBrainsStatsRebuild` fires it alongside the save instead and retries if
 * the lock or cooldown refuses, so stats converge without anyone waiting.
 *
 * The entry itself is correct the instant it saves regardless: every public path
 * orders by `entry_set, entry_setnum`, both written directly here. Only
 * `entry_setorder` and the derived stats (gap, rarity) trail the rebuild.
 */
export function useBrainsSetlist(showId: string | null): UseBrainsSetlist {
  const { session } = useAuth()
  const token = session?.token ?? null

  const { status: rebuildStatus, trigger: rebuildNow } = useBrainsStatsRebuild()
  const [rows, setRows] = useState<AdminSetlistEntryData[] | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const refresh = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    if (!showId || !supabase) return
    const client = supabase
    let cancelled = false

    async function run() {
      // Kept as one inline literal: a concatenated string widens to `string` and
      // the Supabase client then infers GenericStringError instead of a row type.
      const { data, error } = await client
        .from("setlist_entries")
        .select(
          "entry_id, entry_set, entry_setnum, entry_setorder, entry_song, entry_short, entry_segue, entry_length, entry_placement, entry_coachnotes, entry_new, entry_show",
        )
        .eq("entry_show", showId)
        .order("entry_set", { ascending: true })
        .order("entry_setnum", { ascending: true })
      if (cancelled) return
      setRows(error ? [] : ((data ?? []) as AdminSetlistEntryData[]))
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [showId, reloadKey])

  // Re-sorted client-side as well as in the query so an optimistic reorder shows
  // in the right order before the server confirms.
  const entries = useMemo(
    () => (rows ? sortBrainsEntries(rows as (AdminSetlistEntryData & BrainsReorderRow)[]) : []),
    [rows],
  )

  const insertEntry = useCallback(
    async (patch: BrainsEntryPatch): Promise<string | null> => {
      if (!token || !showId) return null
      const { data, error } = await invokeDproAdmin<{
        rows: { entry_id: string }[]
      }>(token, {
        action: "setlist_entries_insert",
        row: { ...patch, entry_show: showId },
      })
      if (error) {
        toast.error(error)
        return null
      }
      refresh()
      rebuildNow()
      return data?.rows?.[0]?.entry_id ?? null
    },
    [token, showId, refresh, rebuildNow],
  )

  const updateEntry = useCallback(
    async (entryId: string, patch: BrainsEntryPatch): Promise<boolean> => {
      if (!token) return false
      const { error } = await invokeDproAdmin(token, {
        action: "setlist_entries_update",
        entry_id: entryId,
        patch,
      })
      if (error) {
        toast.error(error)
        return false
      }
      refresh()
      rebuildNow()
      return true
    },
    [token, refresh, rebuildNow],
  )

  const deleteEntry = useCallback(
    async (entryId: string): Promise<boolean> => {
      if (!token) return false
      const { error } = await invokeDproAdmin(token, {
        action: "setlist_entries_delete",
        entry_id: entryId,
      })
      if (error) {
        toast.error(error)
        return false
      }
      refresh()
      rebuildNow()
      return true
    },
    [token, refresh, rebuildNow],
  )

  const savePersonnel = useCallback(
    async (entryId: string, guestIds: string[]): Promise<boolean> => {
      if (!token) return false
      const { error } = await invokeDproAdmin(token, {
        action: "setlist_entry_guests_replace",
        setlist_entry_id: entryId,
        guest_ids: guestIds,
      })
      if (error) {
        toast.error(error)
        return false
      }
      return true
    },
    [token],
  )

  /**
   * Apply a drag: renumber locally first so the row lands under the finger
   * immediately, then persist in one atomic RPC. A failure restores the previous
   * order rather than leaving the screen disagreeing with the database.
   */
  const reorder = useCallback(
    async (activeId: string, overId: string) => {
      if (!token || !rows) return
      const ordered = sortBrainsEntries(
        rows as (AdminSetlistEntryData & BrainsReorderRow)[],
      )
      const { next, changed } = applyBrainsDrag(ordered, activeId, overId)
      if (changed.length === 0) return

      const previous = rows
      setRows(next as AdminSetlistEntryData[])

      const { error } = await invokeDproAdmin(token, {
        action: "setlist_entries_reorder",
        entries: changed,
      })
      if (error) {
        setRows(previous)
        toast.error(error)
        return
      }
      rebuildNow()
    },
    [token, rows, rebuildNow],
  )

  return {
    entries,
    loading: !!showId && rows === null,
    refresh,
    insertEntry,
    updateEntry,
    deleteEntry,
    savePersonnel,
    reorder,
    rebuildStatus,
    rebuildNow,
  }
}
