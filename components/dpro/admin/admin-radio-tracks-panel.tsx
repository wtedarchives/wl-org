"use client"

import { ImageUpIcon, RefreshCwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-md font-semibold">Radio request tracks</h2>
          <p className="text-xs leading-relaxed text-muted-foreground sm:text-[13px] sm:leading-relaxed">
            Compare Radio.co request tracks with{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              wted_radio_ids
            </code>
            . New and removed tracks update status; when Radio.co sends{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              artwork.large_url
            </code>
            , the{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              artwork
            </code>{" "}
            column is filled or corrected. Backfill artwork: rows with empty{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              artwork
            </code>{" "}
            use Radio.co{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              large_url
            </code>{" "}
            when present, otherwise release artwork like the request drawer.
            Rows that already have a URL are left alone unless Radio.co{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              large_url
            </code>{" "}
            differs from the stored value, then the DB is updated to match
            Radio.co.
            Runs via a Supabase Edge Function in one request. Very large
            catalogs may hit HTTP 546; run again to
            finish stragglers or use a capped{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              max_rows
            </code>{" "}
            from the API.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Button
            type="button"
            size="default"
            variant="secondary"
            className="min-h-11 w-full shrink-0 touch-manipulation sm:w-auto sm:min-h-10"
            onClick={handleBackfillArtwork}
            disabled={backfilling || syncing || loading}
          >
            {backfilling ? (
              <>
                <RefreshCwIcon className="mr-2 size-4 animate-spin" />
                Backfilling...
              </>
            ) : (
              <>
                <ImageUpIcon className="mr-2 size-4" />
                Artwork
              </>
            )}
          </Button>
          <Button
            type="button"
            size="default"
            className="min-h-11 w-full shrink-0 touch-manipulation sm:w-auto sm:min-h-10"
            onClick={handleSync}
            disabled={syncing || backfilling || loading}
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
      </div>

      <div className="mt-5 flex flex-col gap-2">
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
    </>
  )
}
