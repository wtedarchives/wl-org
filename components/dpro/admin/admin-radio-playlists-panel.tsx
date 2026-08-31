"use client"

import { useCallback, useEffect, useState } from "react"
import { RefreshCwIcon } from "lucide-react"
import { WYSTERIA_AUTH_HEADER } from "@/lib/dpro-admin-edge"
import { getSession } from "@/lib/jwt"
import { getSupabaseFunctionsUrl } from "@/lib/supabase-functions"
import {
  WTED_EPISODE_RADIO_SYNC_DEFAULT_SHOW,
  type WtedEpisodeRadioSyncResult,
  type WtedEpisodeRadioSyncRow,
} from "@/lib/wted-episodes-radio-sync"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  NewPlaylistEditDialog,
  type SaveNewPlaylistEpisodePayload,
} from "@/components/dpro/admin/admin-radio-playlist-new-dialog"
import { AdminRadioOrphanDeleteDialog } from "@/components/dpro/admin/admin-radio-orphan-delete-dialog"
import {
  AdminRadioPlaylistQueues,
  PlaylistDetailCard,
  RemovedPlaylistDispositionDialog,
} from "@/components/dpro/admin/admin-radio-playlist-tables"

async function callAdminEpisodes(
  action: string,
  body: Record<string, unknown> = {},
): Promise<unknown> {
  const session = getSession()
  if (!session?.token) throw new Error("Sign in again to perform this action.")

  const base = getSupabaseFunctionsUrl()
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  if (!anon) throw new Error("Missing Supabase anon key.")

  const res = await fetch(`${base}/wted-episodes-admin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anon}`,
      apikey: anon,
      [WYSTERIA_AUTH_HEADER]: `Bearer ${session.token}`,
    },
    body: JSON.stringify({ action, ...body }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const payload = data as { error?: string; message?: string; detail?: string }
    const detail = payload.message ?? payload.detail
    const base = payload.error ?? `Edge function returned ${res.status}`
    throw new Error(detail ? `${base}: ${detail}` : base)
  }
  return data
}

export function AdminRadioPlaylistsPanel() {
  const authReady = Boolean(getSession()?.token)

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
  const [orphanRows, setOrphanRows] = useState<WtedEpisodeRadioSyncRow[]>([])
  const [orphanDispositionRow, setOrphanDispositionRow] =
    useState<WtedEpisodeRadioSyncRow | null>(null)

  const savingNewDisposition =
    updatingUuid !== null && newDispositionRow !== null
  const savingRemovedDisposition =
    updatingUuid !== null && removedDispositionRow !== null
  const savingOrphanDisposition =
    updatingUuid !== null && orphanDispositionRow !== null

  const loadNewAndRemoved = useCallback(async () => {
    setError(null)
    try {
      setLoading(true)
      const data = await callAdminEpisodes("load") as {
        newRows: WtedEpisodeRadioSyncRow[]
        removedRows: WtedEpisodeRadioSyncRow[]
      }
      setNewRows(data.newRows)
      setRemovedRows(data.removedRows)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load radio playlist episodes.")
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
    setUpdatingUuid(uuid)
    setError(null)
    try {
      await callAdminEpisodes("update", { uuid, payload })
      await loadNewAndRemoved()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save episode.")
      return false
    } finally {
      setUpdatingUuid(null)
    }
  }

  const handleRemovedMarkSkipped = async (uuid: string): Promise<boolean> => {
    setUpdatingUuid(uuid)
    setError(null)
    try {
      await callAdminEpisodes("skip", { uuid })
      await loadNewAndRemoved()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark episode as skipped.")
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
      await callAdminEpisodes("delete", { uuid })
      setOrphanRows((rows) => rows.filter((r) => r.uuid !== uuid))
      await loadNewAndRemoved()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete episode.")
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

  const handleSync = async () => {
    setSyncing(true)
    setSyncBanner(null)
    setError(null)
    setOrphanRows([])
    try {
      const data = await callAdminEpisodes("sync") as WtedEpisodeRadioSyncResult
      setOrphanRows(data.orphans ?? [])
      if (
        data.inserted.length === 0 &&
        data.updatedToRemoved.length === 0 &&
        (data.orphans?.length ?? 0) === 0
      ) {
        setSyncBanner({
          kind: "no-change",
          message: "No changes — episodes with Radio playlist IDs already match the Studio list.",
        })
      } else {
        setSyncBanner({
          kind: "success",
          message: `Sync complete: ${data.inserted.length} added as NEW, ${data.updatedToRemoved.length} marked REMOVED, ${data.orphans?.length ?? 0} not in Radio.co.`,
        })
      }
      await loadNewAndRemoved()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sync failed. Try again later."
      setSyncBanner({ kind: "error", message: msg })
      setError(msg)
    } finally {
      setSyncing(false)
    }
  }

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

      <AdminRadioOrphanDeleteDialog
        open={orphanDispositionRow !== null}
        onOpenChange={(nextOpen) => {
          if (nextOpen) return
          if (savingOrphanDisposition) return
          setOrphanDispositionRow(null)
        }}
        updating={savingOrphanDisposition}
        onConfirm={confirmOrphanDelete}
        title="Remove episode"
        description="This playlist ID is in the database but not in Radio.co Studio. Removing it deletes the episode row. Episode setlist entries that pointed at it will be unlinked."
      >
        {orphanDispositionRow ?
          <PlaylistDetailCard row={orphanDispositionRow} />
        : null}
      </AdminRadioOrphanDeleteDialog>

      <div className="wl-home-v2-admin-radio-tab-stack">
        <div
          className={
            "widget-panel wl-home-v2-years-shows-panel wl-home-v2-years-shows-panel--natural wl-home-v2-admin-radio-tab-panel"
          }
        >
          <div
            className={cn(
              "wp-head wl-home-v2-years-shows-wp-head wl-home-v2-tours-shows-wp-head",
              "wl-home-v2-admin-radio-tab-intro-head",
            )}
          >
            <span className="wp-head-date min-w-0 flex-1 truncate pr-2">
              Radio.co playlists
            </span>
            <div className="wl-home-v2-admin-radio-tab-actions">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="wl-home-v2-tours-header-pill wl-home-v2-admin-radio-action-pill"
                onClick={handleSync}
                disabled={syncing || loading || !authReady}
              >
                {syncing ? (
                  <>
                    <RefreshCwIcon className="size-3.5 shrink-0 animate-spin opacity-80" />
                    Syncing…
                  </>
                ) : (
                  <>
                    <RefreshCwIcon className="size-3.5 shrink-0 opacity-80" />
                    Sync
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="wl-home-v2-admin-radio-tab-description-wrap">
            <p className="wl-home-v2-admin-radio-tab-description">
              Compare Radio.co Studio playlists with{" "}
              <code className="wl-home-v2-admin-radio-tab-code">
                wted_episodes
              </code>{" "}
              (rows with a{" "}
              <code className="wl-home-v2-admin-radio-tab-code">radio_id</code>
              ). New rows get{" "}
              <span className="wl-home-v2-admin-radio-tab-code-strong">show</span>{" "}
              <code className="wl-home-v2-admin-radio-tab-code">
                {WTED_EPISODE_RADIO_SYNC_DEFAULT_SHOW}
              </code>{" "}
              until you assign a real show in the database. Sync also lists
              episodes whose radio ID is not in Studio — click one and Remove
              deletes that row.
            </p>
          </div>
        </div>

        <div className="wl-home-v2-admin-radio-tab-alerts">
          {!authReady && (
            <p className="wl-home-v2-admin-radio-tab-muted-hint">
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

        <AdminRadioPlaylistQueues
          loading={loading}
          syncing={syncing}
          newRows={newRows}
          removedRows={removedRows}
          orphanRows={orphanRows}
          updatingUuid={updatingUuid}
          onNewClick={(row) => {
            if (updatingUuid !== null) return
            setRemovedDispositionRow(null)
            setOrphanDispositionRow(null)
            setNewDispositionRow(row)
          }}
          onRemovedClick={(row) => {
            if (updatingUuid !== null) return
            setNewDispositionRow(null)
            setOrphanDispositionRow(null)
            setRemovedDispositionRow(row)
          }}
          onOrphanClick={(row) => {
            if (updatingUuid !== null) return
            setNewDispositionRow(null)
            setRemovedDispositionRow(null)
            setOrphanDispositionRow(row)
          }}
        />
      </div>
    </>
  )
}
