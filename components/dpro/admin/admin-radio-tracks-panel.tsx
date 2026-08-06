"use client"

import { RefreshCwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ClickableRadioTracksTable,
  NewDispositionDialog,
  RemovedDispositionDialog,
} from "@/components/dpro/admin/admin-radio-tables"
import { useAdminRadioTracksPanel } from "@/hooks/use-admin-radio-tracks-panel"
import { useShowData } from "@/hooks/use-show-data"

export function AdminRadioTracksPanel() {
  // Loaded at panel level, not inside the dialog: the dialog unmounts on close,
  // so a hook there would refetch the full show list on every single open while
  // working through the NEW queue.
  const {
    allShows,
    loading: showsLoading,
    loadingProgress: showsLoadingProgress,
  } = useShowData()

  const {
    newRows,
    removedRows,
    loading,
    syncing,
    error,
    syncBanner,
    updatingUuid,
    newDispositionRow,
    setNewDispositionRow,
    removedDispositionRow,
    setRemovedDispositionRow,
    savingNewDisposition,
    savingRemovedDisposition,
    assigningShowUuid,
    assignShow,
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
        showPicker={{
          allShows,
          showsLoading,
          loadingProgress: showsLoadingProgress,
          assigningShow:
            newDispositionRow !== null &&
            assigningShowUuid === newDispositionRow.uuid,
          onAssignShow: (showId) =>
            newDispositionRow ?
              assignShow(newDispositionRow.uuid, showId)
            : Promise.resolve(false),
        }}
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
            {/*
              The old "Artwork" and "Re-verify all" buttons were removed on
              2026-08-06. They called `wted-radio-backfill-artwork`, which wrote
              "Radio.co large_url, else release artwork" into
              `wted_radio_ids.artwork` — both halves now break the artwork model:
              its large_url came from the PUBLIC feed (no `artwork.type`), so it
              re-introduced iTunes auto-matches, and writing release artwork into
              that column collapses the tier-1/tier-2 split that
              `wted_radio_ids_catalog` depends on. Sync owns tier 1; the view
              resolves tier 2 live. Do not reinstate them.
            */}
            <div className="wl-home-v2-admin-radio-tab-actions">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="wl-home-v2-tours-header-pill wl-home-v2-admin-radio-action-pill"
                onClick={handleSync}
                disabled={syncing || loading}
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
              Sync is the only action here. It calls the{" "}
              <code className="wl-home-v2-admin-radio-tab-code">dpro-admin</code>{" "}
              Edge Function (admin session + service role) and runs two passes.
              First it crawls the authenticated Radio.co{" "}
              <strong>Studio</strong> catalog — the full station inventory,
              including commentary, intros, bumpers and station IDs that the
              public feed omits — in resumable page chunks, inserting anything
              missing from{" "}
              <code className="wl-home-v2-admin-radio-tab-code">
                wted_radio_ids
              </code>
              . Then it reads the <strong>public</strong> requests feed, the only
              source of truth for{" "}
              <code className="wl-home-v2-admin-radio-tab-code">requestable</code>
              , and sets that flag, resolves new tracks into NEW or skipped, and
              marks departures REMOVED. If more than 10% of requestable tracks
              would be hidden in one run it aborts without writing anything,
              since a truncated Radio.co response is indistinguishable from a
              real mass removal.
              <br />
              <br />
              Artwork has three tiers.{" "}
              <code className="wl-home-v2-admin-radio-tab-code">artwork</code>{" "}
              stores <em>only</em> art uploaded to Radio.co (
              <code className="wl-home-v2-admin-radio-tab-code">
                artwork.type = &quot;custom&quot;
              </code>
              ) — Sync writes it and clears anything else, so the column mirrors
              Radio.co exactly. Radio.co&apos;s automatic iTunes matches are
              deliberately excluded; curated release artwork beats them. Tracks
              without custom art fall through to their show&apos;s
              lowest-
              <code className="wl-home-v2-admin-radio-tab-code">
                release_order
              </code>{" "}
              release artwork, resolved live by the{" "}
              <code className="wl-home-v2-admin-radio-tab-code">
                wted_radio_ids_catalog
              </code>{" "}
              view — no backfill, and edits to{" "}
              <code className="wl-home-v2-admin-radio-tab-code">
                releases.release_artwork
              </code>{" "}
              show up immediately. Anything with neither falls back to WL.png, so
              assigning a show in the NEW dialog is what gives a track its image.
            </p>
          </div>
        </div>

        <div className="wl-home-v2-admin-radio-tab-alerts">
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
