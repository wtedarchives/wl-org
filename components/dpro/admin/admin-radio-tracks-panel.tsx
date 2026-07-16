"use client"

import { ImageUpIcon, ListChecksIcon, RefreshCwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ClickableRadioTracksTable,
  NewDispositionDialog,
  RemovedDispositionDialog,
} from "@/components/dpro/admin/admin-radio-tables"
import { useAdminRadioTracksPanel } from "@/hooks/use-admin-radio-tracks-panel"

export function AdminRadioTracksPanel() {
  const {
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
  } = useAdminRadioTracksPanel()

  return (
    <>
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
              Radio request tracks
            </span>
            <div className="wl-home-v2-admin-radio-tab-actions">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="wl-home-v2-tours-header-pill wl-home-v2-admin-radio-action-pill"
                onClick={() => handleBackfillArtwork(false)}
                disabled={backfilling || syncing || loading}
              >
                {backfilling ? (
                  <>
                    <RefreshCwIcon className="size-3.5 shrink-0 animate-spin opacity-80" />
                    Backfilling…
                  </>
                ) : (
                  <>
                    <ImageUpIcon className="size-3.5 shrink-0 opacity-80" />
                    Artwork
                  </>
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="wl-home-v2-tours-header-pill wl-home-v2-admin-radio-action-pill"
                onClick={() => handleBackfillArtwork(true)}
                disabled={backfilling || syncing || loading}
                title="Re-derive artwork for every row (corrects rows whose release artwork changed). Slower — may need re-running on large catalogs."
              >
                {backfilling ? (
                  <>
                    <RefreshCwIcon className="size-3.5 shrink-0 animate-spin opacity-80" />
                    Working…
                  </>
                ) : (
                  <>
                    <ListChecksIcon className="size-3.5 shrink-0 opacity-80" />
                    Re-verify all
                  </>
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="wl-home-v2-tours-header-pill wl-home-v2-admin-radio-action-pill"
                onClick={handleSync}
                disabled={syncing || backfilling || loading}
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
              Compare Radio.co request tracks with{" "}
              <code className="wl-home-v2-admin-radio-tab-code">
                wted_radio_ids
              </code>
              . New and removed tracks update status; when Radio.co sends{" "}
              <code className="wl-home-v2-admin-radio-tab-code">
                artwork.large_url
              </code>
              , the{" "}
              <code className="wl-home-v2-admin-radio-tab-code">artwork</code>{" "}
              column is filled or corrected. Backfill artwork: rows with empty{" "}
              <code className="wl-home-v2-admin-radio-tab-code">artwork</code>{" "}
              use Radio.co{" "}
              <code className="wl-home-v2-admin-radio-tab-code">large_url</code>{" "}
              when present, otherwise release artwork like the request drawer.
              Rows that already have a URL are left alone unless Radio.co{" "}
              <code className="wl-home-v2-admin-radio-tab-code">large_url</code>{" "}
              differs from the stored value, then the DB is updated to match
              Radio.co. The Sync button calls the{" "}
              <code className="wl-home-v2-admin-radio-tab-code">dpro-admin</code>{" "}
              Edge Function (admin session + service role): it pulls the public
              Radio.co list server-side and updates{" "}
              <code className="wl-home-v2-admin-radio-tab-code">
                wted_radio_ids
              </code>
              . The Artwork button calls{" "}
              <code className="wl-home-v2-admin-radio-tab-code">
                wted-radio-backfill-artwork
              </code>{" "}
              in one request; very large catalogs may hit HTTP 546—run again or
              use a capped{" "}
              <code className="wl-home-v2-admin-radio-tab-code">max_rows</code>{" "}
              on that function. Re-verify all sends{" "}
              <code className="wl-home-v2-admin-radio-tab-code">
                revalidate_existing
              </code>{" "}
              so every row is re-derived—use it after{" "}
              <code className="wl-home-v2-admin-radio-tab-code">
                releases.release_artwork
              </code>{" "}
              changes so already-filled rows are corrected. It sweeps the whole
              table in resumable chunks (using{" "}
              <code className="wl-home-v2-admin-radio-tab-code">max_rows</code> +{" "}
              <code className="wl-home-v2-admin-radio-tab-code">
                start_after_uuid
              </code>
              ), shrinking the chunk automatically if a chunk hits 546, so one
              click finishes the sweep without you re-running it.
            </p>
          </div>
        </div>

        <div className="wl-home-v2-admin-radio-tab-alerts">
          {backfillBanner && (
            <div
              role="status"
              className={`rounded-lg border px-3 py-2 text-sm transition-all duration-200 ease-out ${
                backfillBanner.kind === "error"
                  ? "border-destructive/50 bg-destructive/10 text-destructive"
                  : "border-primary/30 bg-primary/5 text-foreground"
              }`}
            >
              {backfillBanner.message}
            </div>
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

          {error && !syncBanner && !backfillBanner && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive transition-all duration-200">
              {error}
            </div>
          )}
        </div>

        <div className="wl-home-v2-admin-radio-tab-tables">
          <div
            className={
              "widget-panel wl-home-v2-years-shows-panel wl-home-v2-years-shows-panel--natural wl-home-v2-admin-radio-tab-panel"
            }
          >
            <div
              className={cn(
                "wp-head wl-home-v2-years-shows-wp-head",
                "wl-home-v2-admin-radio-tab-section-head",
              )}
            >
              <span className="wp-head-date min-w-0 truncate">
                NEW{" "}
                <span className="font-normal text-white/55">
                  ({loading ? "…" : newRows.length})
                </span>
              </span>
            </div>
            <div className="wl-home-v2-years-table-scroll min-h-0 min-w-0 flex-1">
              {loading ? (
                <p className="wl-home-v2-admin-radio-tab-table-hint">Loading…</p>
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
            </div>
          </div>

          <div
            className={
              "widget-panel wl-home-v2-years-shows-panel wl-home-v2-years-shows-panel--natural wl-home-v2-admin-radio-tab-panel"
            }
          >
            <div
              className={cn(
                "wp-head wl-home-v2-years-shows-wp-head",
                "wl-home-v2-admin-radio-tab-section-head",
              )}
            >
              <span className="wp-head-date min-w-0 truncate">
                REMOVED{" "}
                <span className="font-normal text-white/55">
                  ({loading ? "…" : removedRows.length})
                </span>
              </span>
            </div>
            <div className="wl-home-v2-years-table-scroll min-h-0 min-w-0 flex-1">
              {loading ? (
                <p className="wl-home-v2-admin-radio-tab-table-hint">Loading…</p>
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
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
