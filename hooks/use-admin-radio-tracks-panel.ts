"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSession } from "@/lib/jwt"
import { invokeDproAdmin, WYSTERIA_AUTH_HEADER } from "@/lib/dpro-admin-edge"
import { getSupabaseFunctionsUrl } from "@/lib/supabase-functions"
import type {
  ReconcileWtedRadioIdsResult,
  StudioCrawlChunkResult,
  WtedRadioIdRow,
} from "@/lib/wted-radio-ids-sync"

/** Studio pages per crawl invocation; halved on HTTP 546 (edge resource limit). */
const SYNC_CRAWL_PAGES = 60
const MIN_CRAWL_PAGES = 10
/** ~177 pages ÷ MIN_CRAWL_PAGES, with generous headroom for 546 retries. */
const MAX_CRAWL_INVOCATIONS = 60
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
    setUpdatingUuid(uuid)
    setError(null)
    try {
      const session = getSession()
      if (!session?.token) {
        setError("Sign in again to perform this action.")
        return false
      }
      const { error: invokeError } = await invokeDproAdmin(session.token, {
        action: "wted_radio_ids_disposition_new",
        uuid,
        status,
      })
      if (invokeError) throw new Error(invokeError)
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
    setUpdatingUuid(uuid)
    setError(null)
    try {
      const session = getSession()
      if (!session?.token) {
        setError("Sign in again to perform this action.")
        return false
      }
      const { error: invokeError } = await invokeDproAdmin(session.token, {
        action: "wted_radio_ids_skip_removed",
        uuid,
      })
      if (invokeError) throw new Error(invokeError)
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

  const handleBackfillArtwork = async (revalidateExisting = false) => {
    if (!supabase) return
    setBackfilling(true)
    setBackfillBanner(null)
    setError(null)
    try {
      const base = getSupabaseFunctionsUrl()
      if (!base) throw new Error("Supabase URL is not configured.")
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
      const session = getSession()
      if (!session?.token) {
        throw new Error("Sign in again to run this action.")
      }
      if (!anon) {
        throw new Error("Missing Supabase anon key.")
      }

      type BackfillResponse = {
        error?: string
        examined?: number
        updated?: number
        error_count?: number
        done?: boolean
        db_exhausted?: boolean
        next_cursor?: string | null
      }

      const callBackfill = async (
        payload: Record<string, unknown>,
      ): Promise<{ ok: boolean; status: number; data: BackfillResponse }> => {
        const res = await fetch(`${base}/wted-radio-backfill-artwork`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${anon}`,
            [WYSTERIA_AUTH_HEADER]: `Bearer ${session.token}`,
            apikey: anon,
          },
          body: JSON.stringify(payload),
        })
        const data = (await res
          .json()
          .catch(() => ({}))) as BackfillResponse
        return { ok: res.ok, status: res.status, data }
      }

      if (!revalidateExisting) {
        // Cheap pass: empty rows + Radio.co corrections, one request.
        const { ok, status, data } = await callBackfill({})
        if (!ok) {
          const hint =
            status === 546
              ? " Supabase 546 = worker limit on a single run; click Artwork again to continue."
              : ""
          throw new Error((data.error ?? `Backfill failed (${status})`) + hint)
        }
        setBackfillBanner({
          kind: "success",
          message: `Artwork backfill: updated ${data.updated ?? 0} row(s), examined ${data.examined ?? 0} (empty rows filled; existing URLs updated when Radio.co large_url differs).`,
        })
        await loadNewAndRemoved()
        return
      }

      // Full re-verify: sweep the whole table in bounded, resumable chunks so
      // no single request hits the worker limit. Shrink the chunk on 546 and
      // retry the same cursor so the sweep always makes forward progress.
      let cursor: string | null = null
      let chunk = 300
      const MIN_CHUNK = 25
      const MAX_CALLS = 500
      let totalExamined = 0
      let totalUpdated = 0
      let calls = 0

      for (;;) {
        if (calls >= MAX_CALLS) {
          throw new Error(
            `Re-verify stopped after ${calls} chunks (examined ${totalExamined}, updated ${totalUpdated}). Run it again to continue.`,
          )
        }
        calls++

        const payload: Record<string, unknown> = {
          revalidate_existing: true,
          max_rows: chunk,
        }
        if (cursor !== null) payload.start_after_uuid = cursor

        const { ok, status, data } = await callBackfill(payload)

        if (!ok) {
          if (status === 546 && chunk > MIN_CHUNK) {
            chunk = Math.max(MIN_CHUNK, Math.floor(chunk / 2))
            calls-- // retry same cursor with a smaller chunk; don't count it
            continue
          }
          throw new Error(
            (data.error ?? `Re-verify failed (${status})`) +
              (status === 546
                ? " Worker limit hit even at the smallest chunk — run Re-verify all again to resume where it stopped."
                : ""),
          )
        }

        totalExamined += data.examined ?? 0
        totalUpdated += data.updated ?? 0

        setBackfillBanner({
          kind: "success",
          message: `Re-verifying artwork… examined ${totalExamined}, corrected ${totalUpdated} so far.`,
        })

        const done = data.done ?? data.db_exhausted ?? false
        const nextCursor = data.next_cursor ?? null
        if (done || nextCursor === null) break
        cursor = nextCursor
      }

      setBackfillBanner({
        kind: "success",
        message: `Full artwork re-verify complete: corrected ${totalUpdated} row(s), examined ${totalExamined} across ${calls} chunk(s). Every row re-derived; stale release-artwork URLs fixed.`,
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

  /**
   * Two passes: crawl the Radio.co Studio catalog in bounded page chunks
   * (resumable, so no single invocation risks the edge-function wall clock),
   * then one cheap reconcile that decides what's requestable.
   *
   * The crawl only ever inserts non-requestable PENDING rows, so an interrupted
   * run leaves the request modal untouched rather than half-populated.
   */
  const handleSync = async () => {
    if (!supabase) return
    setSyncing(true)
    setSyncBanner(null)
    setError(null)
    try {
      const session = getSession()
      if (!session?.token) {
        throw new Error("Sign in again to run sync.")
      }

      let startPage = 1
      let pageCount = SYNC_CRAWL_PAGES
      let insertedTotal = 0
      let artworkSetTotal = 0
      let artworkClearedTotal = 0
      let pagesDone = 0
      let totalPages: number | null = null
      let guardPasses = 0

      for (;;) {
        // Runaway guard: at the minimum chunk size a full crawl is ~177/10
        // invocations, so this ceiling can only be hit by a server-side bug.
        if (guardPasses++ > MAX_CRAWL_INVOCATIONS) {
          throw new Error(
            "Crawl did not finish after too many attempts — check the Radio.co Studio credentials.",
          )
        }

        const {
          data,
          error: crawlError,
          status,
        } = await invokeDproAdmin<StudioCrawlChunkResult>(session.token, {
          action: "wted_radio_ids_studio_crawl",
          start_page: startPage,
          page_count: pageCount,
        })

        if (crawlError) {
          // 546 = edge function resource limit. Halve the chunk and retry the
          // SAME page range; inserts are idempotent so nothing is duplicated.
          // Branch on status, not the message — 546 bodies are often not JSON.
          if (status === 546 && pageCount > MIN_CRAWL_PAGES) {
            pageCount = Math.max(MIN_CRAWL_PAGES, Math.floor(pageCount / 2))
            continue
          }
          throw new Error(crawlError)
        }
        if (!data) throw new Error("Studio crawl returned no data.")

        insertedTotal += data.inserted
        artworkSetTotal += data.artwork_updated
        artworkClearedTotal += data.artwork_cleared
        totalPages = data.total_pages
        pagesDone = data.next_page === null ? data.total_pages : data.next_page - 1
        setSyncBanner({
          kind: "success",
          message: `Scanning Radio.co catalog… ${pagesDone}/${data.total_pages} pages, ${insertedTotal} new tracks found.`,
        })

        if (data.done || data.next_page === null) break
        startPage = data.next_page
      }

      const { data: rec, error: recError } =
        await invokeDproAdmin<ReconcileWtedRadioIdsResult>(session.token, {
          action: "wted_radio_ids_sync",
        })
      if (recError) throw new Error(recError)
      if (!rec) throw new Error("Sync returned no data.")

      if (rec.abortedReason) {
        setSyncBanner({ kind: "error", message: rec.abortedReason })
        setError(rec.abortedReason)
        return
      }

      const changed =
        insertedTotal +
        artworkSetTotal +
        artworkClearedTotal +
        rec.madeRequestable +
        rec.madeUnrequestable +
        rec.updatedToRemoved.length +
        rec.updatedTitles.length

      if (changed === 0) {
        setSyncBanner({
          kind: "no-change",
          message: `No changes — the database already matches Radio.co${
            totalPages ? ` (${totalPages} pages scanned)` : ""
          }.`,
        })
      } else {
        setSyncBanner({
          kind: "success",
          message:
            `Sync complete: ${insertedTotal} tracks added ` +
            `(${rec.resolvedToNew} requestable → NEW, ${rec.resolvedToSkipped} non-requestable → skipped), ` +
            `${rec.madeRequestable} became requestable, ${rec.madeUnrequestable} hidden, ` +
            `${rec.updatedToRemoved.length} marked REMOVED, ` +
            `${artworkSetTotal} custom artwork set, ${artworkClearedTotal} artwork cleared to release fallback, ` +
            `${rec.updatedTitles.length} titles updated.`,
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
