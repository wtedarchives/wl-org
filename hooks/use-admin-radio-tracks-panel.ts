"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSession } from "@/lib/jwt"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import type {
  ReconcileWtedRadioIdsResult,
  StudioCrawlChunkResult,
  WtedRadioIdRow,
} from "@/lib/wted-radio-ids-sync"
import type { NewDispositionStatus } from "@/components/dpro/admin/admin-radio-tables"

/** Studio pages per crawl invocation; halved on HTTP 546 (edge resource limit). */
const SYNC_CRAWL_PAGES = 60
const MIN_CRAWL_PAGES = 10
/** ~177 pages ÷ MIN_CRAWL_PAGES, with generous headroom for 546 retries. */
const MAX_CRAWL_INVOCATIONS = 60

export type AdminRadioTracksSyncBanner = {
  kind: "no-change" | "success" | "error"
  message: string
} | null

export function useAdminRadioTracksPanel() {
  const [newRows, setNewRows] = useState<WtedRadioIdRow[]>([])
  const [removedRows, setRemovedRows] = useState<WtedRadioIdRow[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncBanner, setSyncBanner] = useState<AdminRadioTracksSyncBanner>(null)
  const [updatingUuid, setUpdatingUuid] = useState<string | null>(null)
  const [newDispositionRow, setNewDispositionRow] =
    useState<WtedRadioIdRow | null>(null)
  const [removedDispositionRow, setRemovedDispositionRow] =
    useState<WtedRadioIdRow | null>(null)
  const [orphanRows, setOrphanRows] = useState<WtedRadioIdRow[]>([])
  const [orphanDispositionRow, setOrphanDispositionRow] =
    useState<WtedRadioIdRow | null>(null)
  const [assigningShowUuid, setAssigningShowUuid] = useState<string | null>(null)

  const savingNewDisposition =
    updatingUuid !== null && newDispositionRow !== null
  const savingRemovedDisposition =
    updatingUuid !== null && removedDispositionRow !== null
  const savingOrphanDisposition =
    updatingUuid !== null && orphanDispositionRow !== null

  const loadNewAndRemoved = useCallback(async () => {
    if (!supabase) return
    setError(null)
    try {
      setLoading(true)
      const [newRes, removedRes] = await Promise.all([
        supabase
          .from("wted_radio_ids")
          .select("uuid, radio_id, track_artist, track_title, status, artwork, show_id")
          .eq("status", "NEW")
          .order("radio_id", { ascending: true }),
        supabase
          .from("wted_radio_ids")
          .select("uuid, radio_id, track_artist, track_title, status, artwork, show_id")
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

  const handleOrphanDelete = async (uuid: string): Promise<boolean> => {
    setUpdatingUuid(uuid)
    setError(null)
    try {
      const session = getSession()
      if (!session?.token) {
        setError("Sign in again to perform this action.")
        return false
      }
      const { error: invokeError } = await invokeDproAdmin(session.token, {
        action: "wted_radio_ids_delete",
        uuid,
      })
      if (invokeError) throw new Error(invokeError)
      setOrphanRows((rows) => rows.filter((r) => r.uuid !== uuid))
      await loadNewAndRemoved()
      return true
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete catalog row.",
      )
      return false
    } finally {
      setUpdatingUuid(null)
    }
  }

  const confirmOrphanDelete = async () => {
    if (!orphanDispositionRow) return
    const ok = await handleOrphanDelete(orphanDispositionRow.uuid)
    if (ok) setOrphanDispositionRow(null)
  }

  /**
   * Assign the track's show, which is what gives it tier-2 artwork
   * (show -> lowest-release_order release -> release_artwork).
   *
   * Deliberately patches state in place instead of calling loadNewAndRemoved():
   * a refetch would swap the row identity underneath an open dialog, and the
   * point of doing this inline is that the admin keeps the modal open and still
   * picks linked/skipped afterwards.
   */
  const assignShow = useCallback(
    async (uuid: string, showId: string | null): Promise<boolean> => {
      setAssigningShowUuid(uuid)
      setError(null)
      try {
        const session = getSession()
        if (!session?.token) {
          setError("Sign in again to perform this action.")
          return false
        }
        const { data, error: invokeError } =
          await invokeDproAdmin<WtedRadioIdRow>(session.token, {
            action: "wted_radio_ids_set_show",
            uuid,
            show_id: showId,
          })
        if (invokeError) throw new Error(invokeError)

        const nextShowId = data?.show_id ?? showId
        const patch = (rows: WtedRadioIdRow[]) =>
          rows.map((r) => (r.uuid === uuid ? { ...r, show_id: nextShowId } : r))
        setNewRows(patch)
        setRemovedRows(patch)
        setNewDispositionRow((cur) =>
          cur && cur.uuid === uuid ? { ...cur, show_id: nextShowId } : cur,
        )
        return true
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to set the track's show.",
        )
        return false
      } finally {
        setAssigningShowUuid(null)
      }
    },
    [],
  )

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
    setOrphanRows([])
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
      let totalItems: number | null = null
      let guardPasses = 0
      const studioIds = new Set<string>()

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
        totalItems = data.total_items
        pagesDone = data.next_page === null ? data.total_pages : data.next_page - 1
        if (Array.isArray(data.radio_ids)) {
          for (const id of data.radio_ids) studioIds.add(String(id))
        }
        setSyncBanner({
          kind: "success",
          message: `Scanning Radio.co catalog… ${pagesDone}/${data.total_pages} pages, ${insertedTotal} new tracks found.`,
        })

        if (data.done || data.next_page === null) break
        startPage = data.next_page
      }

      const studioRadioIds = [...studioIds]
      const studioListComplete =
        totalItems != null &&
        studioRadioIds.length >= Math.floor(totalItems * 0.9)

      const { data: rec, error: recError } =
        await invokeDproAdmin<ReconcileWtedRadioIdsResult>(session.token, {
          action: "wted_radio_ids_sync",
          ...(studioListComplete ? { studio_radio_ids: studioRadioIds } : {}),
        })
      if (recError) throw new Error(recError)
      if (!rec) throw new Error("Sync returned no data.")

      setOrphanRows(rec.orphans ?? [])

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
        rec.requeuedToNew +
        rec.updatedToRemoved.length +
        rec.updatedTitles.length +
        (rec.orphans?.length ?? 0)

      const orphanNote = studioListComplete
        ? `${rec.orphans?.length ?? 0} not in Radio.co`
        : "orphan check skipped (incomplete Studio id list)"

      if (changed === 0 && studioListComplete && (rec.orphans?.length ?? 0) === 0) {
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
            `(${rec.resolvedToNew} → NEW), ` +
            `${rec.madeRequestable} became requestable, ${rec.madeUnrequestable} hidden, ` +
            `${rec.requeuedToNew} re-queued to NEW for show mapping, ` +
            `${rec.updatedToRemoved.length} marked REMOVED, ` +
            `${artworkSetTotal} custom artwork set, ${artworkClearedTotal} artwork cleared to release fallback, ` +
            `${rec.updatedTitles.length} titles updated, ` +
            `${orphanNote}.`,
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
    orphanRows,
    loading,
    syncing,
    error,
    syncBanner,
    updatingUuid,
    newDispositionRow,
    setNewDispositionRow,
    removedDispositionRow,
    setRemovedDispositionRow,
    orphanDispositionRow,
    setOrphanDispositionRow,
    savingNewDisposition,
    savingRemovedDisposition,
    savingOrphanDisposition,
    assigningShowUuid,
    assignShow,
    handleSync,
    confirmNewDisposition,
    confirmRemovedSkipped,
    confirmOrphanDelete,
  }
}
