"use client"

import { useCallback, useEffect, useState } from "react"
import { RefreshCwIcon } from "lucide-react"
import { supabase } from "@/lib/supabase"
import {
  syncWtedRadioIds,
  type WtedRadioIdRow,
} from "@/lib/wted-radio-ids-sync"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ClickableRadioTracksTable,
  NewDispositionDialog,
  type NewDispositionStatus,
  RemovedDispositionDialog,
} from "@/components/dpro/admin/admin-radio-tables"

export function AdminRadio() {
  const [newRows, setNewRows] = useState<WtedRadioIdRow[]>([])
  const [removedRows, setRemovedRows] = useState<WtedRadioIdRow[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncBanner, setSyncBanner] = useState<{
    kind: "no-change" | "success" | "error"
    message: string
  } | null>(null)
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
          .select("uuid, radio_id, track_artist, track_title, status")
          .eq("status", "NEW")
          .order("radio_id", { ascending: true }),
        supabase
          .from("wted_radio_ids")
          .select("uuid, radio_id, track_artist, track_title, status")
          .eq("status", "REMOVED")
          .order("radio_id", { ascending: true }),
      ])
      if (newRes.error) throw newRes.error
      if (removedRes.error) throw removedRes.error
      setNewRows((newRes.data ?? []) as WtedRadioIdRow[])
      setRemovedRows((removedRes.data ?? []) as WtedRadioIdRow[])
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load radio track rows."
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
    status: NewDispositionStatus
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
        err instanceof Error ? err.message : "Failed to update track status."
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

  const handleRemovedMarkSkipped = async (
    uuid: string
  ): Promise<boolean> => {
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
        err instanceof Error ? err.message : "Failed to mark track as skipped."
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

  const handleSync = async () => {
    if (!supabase) return
    setSyncing(true)
    setSyncBanner(null)
    setError(null)
    try {
      const { inserted, updatedToRemoved } = await syncWtedRadioIds(supabase)
      if (inserted.length === 0 && updatedToRemoved.length === 0) {
        setSyncBanner({
          kind: "no-change",
          message:
            "No changes — the database already matches the Radio.co request list.",
        })
      } else {
        setSyncBanner({
          kind: "success",
          message: `Sync complete: ${inserted.length} added as NEW, ${updatedToRemoved.length} marked REMOVED.`,
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

  return (
    <div className="w-full space-y-4 xl:mx-auto xl:max-w-[1024px]">
      <NewDispositionDialog
        row={newDispositionRow}
        open={newDispositionRow !== null}
        onOpenChange={(nextOpen) => {
          if (nextOpen) return
          if (savingNewDisposition) return
          setNewDispositionRow(null)
        }}
        onConfirm={confirmNewDisposition}
        updating={savingNewDisposition}
      />

      <RemovedDispositionDialog
        row={removedDispositionRow}
        open={removedDispositionRow !== null}
        onOpenChange={(nextOpen) => {
          if (nextOpen) return
          if (savingRemovedDisposition) return
          setRemovedDispositionRow(null)
        }}
        onConfirmSkipped={confirmRemovedSkipped}
        updating={savingRemovedDisposition}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-md font-semibold">Radio request tracks</h2>
          <p className="text-sm text-muted-foreground">
            Compare Radio.co request tracks with{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              wted_radio_ids
            </code>
            . Rows in both are left unchanged.
          </p>
        </div>
        <Button
          type="button"
          size="default"
          className="min-h-11 w-full shrink-0 touch-manipulation sm:w-auto sm:min-h-10"
          onClick={handleSync}
          disabled={syncing || loading}
        >
          {syncing ? (
            <>
              <RefreshCwIcon className="mr-2 size-4 animate-spin" />
              Syncing…
            </>
          ) : (
            <>
              <RefreshCwIcon className="mr-2 size-4" />
              Sync from Radio.co
            </>
          )}
        </Button>
      </div>

      {syncBanner && (
        <div
          role="status"
          className={`rounded-lg border px-3 py-2 text-sm transition-all duration-200 ease-out ${
            syncBanner.kind === "error"
              ? "border-destructive/50 bg-destructive/10 text-destructive"
              : syncBanner.kind === "no-change"
                ? "border-muted-foreground/25 bg-muted/40 text-muted-foreground"
                : "border-primary/30 bg-primary/5 text-foreground"
          }`}
        >
          {syncBanner.message}
        </div>
      )}

      {error && !syncBanner && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive transition-all duration-200">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              NEW{" "}
              <span className="font-normal text-muted-foreground">
                ({loading ? "…" : newRows.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <ClickableRadioTracksTable
                listKind="new"
                rows={newRows}
                updatingUuid={updatingUuid}
                onRowClick={(row) => {
                  if (updatingUuid !== null) return
                  setRemovedDispositionRow(null)
                  setNewDispositionRow(row)
                }}
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              REMOVED{" "}
              <span className="font-normal text-muted-foreground">
                ({loading ? "…" : removedRows.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <ClickableRadioTracksTable
                listKind="removed"
                rows={removedRows}
                updatingUuid={updatingUuid}
                onRowClick={(row) => {
                  if (updatingUuid !== null) return
                  setNewDispositionRow(null)
                  setRemovedDispositionRow(row)
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
