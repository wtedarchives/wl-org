"use client"

import { useCallback, useEffect, useState } from "react"
import { RefreshCwIcon } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth-context"
import {
  syncWtedEpisodesRadio,
  WTED_EPISODE_RADIO_SYNC_DEFAULT_SHOW,
  WTED_EPISODE_RADIO_SYNC_SELECT,
  type WtedEpisodeRadioSyncRow,
} from "@/lib/wted-episodes-radio-sync"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  NewPlaylistEditDialog,
  type SaveNewPlaylistEpisodePayload,
} from "@/components/dpro/admin/admin-radio-playlist-new-dialog"
import {
  ClickableRadioPlaylistsTable,
  RemovedPlaylistDispositionDialog,
} from "@/components/dpro/admin/admin-radio-playlist-tables"

export function AdminRadioPlaylistsPanel() {
  const { session } = useAuth()
  const accessToken = session?.token ?? null

  const [newRows, setNewRows] = useState<WtedEpisodeRadioSyncRow[]>([])
  const [removedRows, setRemovedRows] = useState<WtedEpisodeRadioSyncRow[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncBanner, setSyncBanner] = useState<{
    kind: "no-change" | "success" | "error"
    message: string
  } | null>(null)
  const [updatingUuid, setUpdatingUuid] = useState<string | null>(null)
  const [newDispositionRow, setNewDispositionRow] =
    useState<WtedEpisodeRadioSyncRow | null>(null)
  const [removedDispositionRow, setRemovedDispositionRow] =
    useState<WtedEpisodeRadioSyncRow | null>(null)

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
          .from("wted_episodes")
          .select(WTED_EPISODE_RADIO_SYNC_SELECT)
          .eq("status", "NEW")
          .order("radio_id", { ascending: true }),
        supabase
          .from("wted_episodes")
          .select(WTED_EPISODE_RADIO_SYNC_SELECT)
          .eq("status", "REMOVED")
          .order("radio_id", { ascending: true }),
      ])
      if (newRes.error) throw newRes.error
      if (removedRes.error) throw removedRes.error
      setNewRows((newRes.data ?? []) as WtedEpisodeRadioSyncRow[])
      setRemovedRows((removedRes.data ?? []) as WtedEpisodeRadioSyncRow[])
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load radio playlist episodes.",
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNewAndRemoved()
  }, [loadNewAndRemoved])

  const saveNewEpisode = async (
    uuid: string,
    payload: SaveNewPlaylistEpisodePayload,
  ): Promise<boolean> => {
    if (!supabase) return false
    setUpdatingUuid(uuid)
    setError(null)
    try {
      const { error: upErr } = await supabase
        .from("wted_episodes")
        .update({
          episode: payload.episode,
          display_name: payload.display_name,
          show: payload.show,
          order: payload.order,
          artwork: payload.artwork,
          host: payload.host,
          status: payload.status,
        })
        .eq("uuid", uuid)
        .eq("status", "NEW")
      if (upErr) throw upErr
      await loadNewAndRemoved()
      return true
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save episode.",
      )
      return false
    } finally {
      setUpdatingUuid(null)
    }
  }

  const handleRemovedMarkSkipped = async (uuid: string): Promise<boolean> => {
    if (!supabase) return false
    setUpdatingUuid(uuid)
    setError(null)
    try {
      const { error: upErr } = await supabase
        .from("wted_episodes")
        .update({ status: "skipped" })
        .eq("uuid", uuid)
        .eq("status", "REMOVED")
      if (upErr) throw upErr
      await loadNewAndRemoved()
      return true
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to mark episode as skipped.",
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
    if (!supabase || !accessToken) return
    setSyncing(true)
    setSyncBanner(null)
    setError(null)
    try {
      const { inserted, updatedToRemoved } = await syncWtedEpisodesRadio(
        supabase,
        accessToken,
      )
      if (inserted.length === 0 && updatedToRemoved.length === 0) {
        setSyncBanner({
          kind: "no-change",
          message:
            "No changes — episodes with Radio playlist IDs already match the Studio list.",
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

  const authReady = Boolean(accessToken)

  return (
    <>
      <NewPlaylistEditDialog
        row={newDispositionRow}
        open={newDispositionRow !== null}
        onOpenChange={(nextOpen) => {
          if (nextOpen) return
          if (savingNewDisposition) return
          setNewDispositionRow(null)
        }}
        onSave={saveNewEpisode}
        updating={savingNewDisposition}
      />

      <RemovedPlaylistDispositionDialog
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

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-md font-semibold">Radio.co playlists</h2>
          <p className="text-sm text-muted-foreground">
            Compare Radio.co Studio playlists with{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              wted_episodes
            </code>{" "}
            (rows with a{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              radio_id
            </code>
            ). New rows get <span className="font-medium">show</span>{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              {WTED_EPISODE_RADIO_SYNC_DEFAULT_SHOW}
            </code>{" "}
            until you assign a real show in the database.
          </p>
        </div>
        <Button
          type="button"
          size="default"
          className="min-h-11 w-full shrink-0 touch-manipulation sm:w-auto sm:min-h-10"
          onClick={handleSync}
          disabled={syncing || loading || !authReady}
        >
          {syncing ? (
            <>
              <RefreshCwIcon className="mr-2 size-4 animate-spin" />
              Syncing…
            </>
          ) : (
            <>
              <RefreshCwIcon className="mr-2 size-4" />
              Sync
            </>
          )}
        </Button>
      </div>

      {(!authReady || syncBanner || (error && !syncBanner)) && (
        <div className="mt-5 flex flex-col gap-2">
          {!authReady && (
            <p className="text-sm text-muted-foreground">
              Sign in to sync playlists (Studio API runs through a secure edge
              function).
            </p>
          )}

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
        </div>
      )}

      <div className="mt-4 flex flex-col gap-4 pb-2">
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
              <ClickableRadioPlaylistsTable
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
              <ClickableRadioPlaylistsTable
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
    </>
  )
}
