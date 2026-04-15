"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSupabaseFunctionsUrl } from "@/lib/supabase-functions"
import {
  syncWtedRadioIds,
  type WtedRadioIdRow,
} from "@/lib/wted-radio-ids-sync"
import type { NewDispositionStatus } from "@/components/dpro/admin/admin-radio-tables"

export type AdminRadioTracksSyncBanner = {
  kind: "no-change" | "success" | "error"
  message: string
} | null

export type AdminRadioTracksBackfillBanner = {
  kind: "success" | "error"
  message: string
} | null

export function useAdminRadioTracksPanel() {
  const [newRows, setNewRows] = useState<WtedRadioIdRow[]>([])
  const [removedRows, setRemovedRows] = useState<WtedRadioIdRow[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [backfilling, setBackfilling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncBanner, setSyncBanner] = useState<AdminRadioTracksSyncBanner>(null)
  const [backfillBanner, setBackfillBanner] =
    useState<AdminRadioTracksBackfillBanner>(null)
  const [updatingUuid, setUpdatingUuid] = useState<string | null>(null)
  const [newDispositionRow, setNewDispositionRow] =
    useState<WtedRadioIdRow | null>(null)
  const [removedDispositionRow, setRemovedDispositionRow] =
    useState<WtedRadioIdRow | null>(null)

  const savingNewDisposition =
    updatingUuid !== null && newDispositionRow !== null
  const savingRemovedDisposition =
    updatingUuid !== null && removedDispositionRow !== null

  const loadNewAndRemoved = useCallback(async () => {
    if (!supabase) return
    setError(null)
    try {
      setLoading(true)
      const [newRes, removedRes] = await Promise.all([
        supabase
          .from("wted_radio_ids")
          .select("uuid, radio_id, track_artist, track_title, status, artwork")
          .eq("status", "NEW")
          .order("radio_id", { ascending: true }),
        supabase
          .from("wted_radio_ids")
          .select("uuid, radio_id, track_artist, track_title, status, artwork")
          .eq("status", "REMOVED")
          .order("radio_id", { ascending: true }),
      ])
      if (newRes.error) throw newRes.error
      if (removedRes.error) throw removedRes.error
      setNewRows((newRes.data ?? []) as WtedRadioIdRow[])
      setRemovedRows((removedRes.data ?? []) as WtedRadioIdRow[])
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load radio track rows.",
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNewAndRemoved()
  }, [loadNewAndRemoved])

  const handleNewDisposition = async (
    uuid: string,
    status: NewDispositionStatus,
  ): Promise<boolean> => {
    if (!supabase) return false
    setUpdatingUuid(uuid)
    setError(null)
    try {
      const { error: upErr } = await supabase
        .from("wted_radio_ids")
        .update({ status })
        .eq("uuid", uuid)
        .eq("status", "NEW")
      if (upErr) throw upErr
      await loadNewAndRemoved()
      return true
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update track status.",
      )
      return false
    } finally {
      setUpdatingUuid(null)
    }
  }

  const confirmNewDisposition = async (status: NewDispositionStatus) => {
    if (!newDispositionRow) return
    const ok = await handleNewDisposition(newDispositionRow.uuid, status)
    if (ok) setNewDispositionRow(null)
  }

  const handleRemovedMarkSkipped = async (uuid: string): Promise<boolean> => {
    if (!supabase) return false
    setUpdatingUuid(uuid)
    setError(null)
    try {
      const { error: upErr } = await supabase
        .from("wted_radio_ids")
        .update({ status: "skipped" })
        .eq("uuid", uuid)
        .eq("status", "REMOVED")
      if (upErr) throw upErr
      await loadNewAndRemoved()
      return true
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to mark track as skipped.",
      )
      return false
    } finally {
      setUpdatingUuid(null)
    }
  }

  const confirmRemovedSkipped = async () => {
    if (!removedDispositionRow) return
    const ok = await handleRemovedMarkSkipped(removedDispositionRow.uuid)
    if (ok) setRemovedDispositionRow(null)
  }

  const handleBackfillArtwork = async () => {
    if (!supabase) return
    setBackfilling(true)
    setBackfillBanner(null)
    setError(null)
    try {
      const base = getSupabaseFunctionsUrl()
      if (!base) throw new Error("Supabase URL is not configured.")
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error("Sign in again to run this action.")
      }

      const res = await fetch(`${base}/wted-radio-backfill-artwork`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
          ...(anon ? { apikey: anon } : {}),
        },
        body: JSON.stringify({}),
      })
      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        examined?: number
        updated?: number
        error_count?: number
      }
      if (!res.ok) {
        const hint =
          res.status === 546 ?
            " Supabase 546 = worker limit on a single run; click Backfill again to continue, or call the function with max_rows in smaller chunks."
          : ""
        throw new Error(
          (data.error ?? `Backfill failed (${res.status})`) + hint,
        )
      }

      const examined = data.examined ?? 0
      const updated = data.updated ?? 0

      setBackfillBanner({
        kind: "success",
        message: `Artwork backfill: updated ${updated} row(s), examined ${examined} (empty rows filled; existing URLs updated when Radio.co large_url differs).`,
      })
      await loadNewAndRemoved()
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Artwork backfill failed."
      setBackfillBanner({ kind: "error", message: msg })
      setError(msg)
    } finally {
      setBackfilling(false)
    }
  }

  const handleSync = async () => {
    if (!supabase) return
    setSyncing(true)
    setSyncBanner(null)
    setError(null)
    try {
      const { inserted, updatedToRemoved, updatedArtwork } =
        await syncWtedRadioIds(supabase)
      if (
        inserted.length === 0 &&
        updatedToRemoved.length === 0 &&
        updatedArtwork.length === 0
      ) {
        setSyncBanner({
          kind: "no-change",
          message:
            "No changes — the database already matches the Radio.co request list.",
        })
      } else {
        setSyncBanner({
          kind: "success",
          message: `Sync complete: ${inserted.length} added as NEW, ${updatedToRemoved.length} marked REMOVED, ${updatedArtwork.length} artwork URLs updated.`,
        })
      }
      await loadNewAndRemoved()
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Sync failed. Try again later."
      setSyncBanner({ kind: "error", message: msg })
      setError(msg)
    } finally {
      setSyncing(false)
    }
  }

  return {
    newRows,
    removedRows,
    loading,
    syncing,
    backfilling,
    error,
    syncBanner,
    backfillBanner,
    updatingUuid,
    newDispositionRow,
    setNewDispositionRow,
    removedDispositionRow,
    setRemovedDispositionRow,
    savingNewDisposition,
    savingRemovedDisposition,
    handleBackfillArtwork,
    handleSync,
    confirmNewDisposition,
    confirmRemovedSkipped,
  }
}
