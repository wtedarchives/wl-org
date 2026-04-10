"use client"

import { useEffect, useState } from "react"
import { Loader2Icon, SaveIcon, Trash2Icon } from "lucide-react"
import { formatDate } from "@/lib/utils/show-utils"
import type { AdminEpisodeSetlistTableRow } from "@/lib/admin-radio-episode-setlists-enrich"
import type { PlacementOptions, SetOptions, SetnumOptions } from "@/types/admin"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export const EPISODE_SETLIST_NULL = "__none__"

function setSelectValue(v: string | null) {
  return v === EPISODE_SETLIST_NULL || !v ? null : v
}

function orderSelectValue(v: string | null) {
  if (v === EPISODE_SETLIST_NULL || v == null || v === "") return null
  const n = Number.parseInt(v, 10)
  return Number.isFinite(n) ? n : null
}

function placementSelectValue(v: string | null) {
  return v === EPISODE_SETLIST_NULL || !v ? null : v
}

function EpisodeSetlistEntryTableRow({
  r,
  sets,
  setnums,
  placements,
  savingUuid,
  deletingUuid,
  onSaveRow,
  onDeleteRow,
}: {
  r: AdminEpisodeSetlistTableRow
  sets: SetOptions[]
  setnums: SetnumOptions[]
  placements: PlacementOptions[]
  savingUuid: string | null
  deletingUuid: string | null
  onSaveRow: (
    eeUuid: string,
    fields: {
      set: string | null
      order: number | null
      placement: string | null
    },
  ) => void
  onDeleteRow: (eeUuid: string) => void
}) {
  const [draftSet, setDraftSet] = useState<string | null>(r.wtedSet ?? null)
  const [draftOrder, setDraftOrder] = useState<number | null>(
    r.wtedOrder ?? null,
  )
  const [draftPlacement, setDraftPlacement] = useState<string | null>(
    r.wtedPlacement ?? null,
  )

  useEffect(() => {
    setDraftSet(r.wtedSet ?? null)
    setDraftOrder(r.wtedOrder ?? null)
    setDraftPlacement(r.wtedPlacement ?? null)
  }, [r.eeUuid, r.wtedSet, r.wtedOrder, r.wtedPlacement])

  const busy = savingUuid === r.eeUuid || deletingUuid === r.eeUuid
  const isDirty =
    draftSet !== (r.wtedSet ?? null) ||
    draftOrder !== (r.wtedOrder ?? null) ||
    draftPlacement !== (r.wtedPlacement ?? null)

  return (
    <TableRow className="border-border/50 hover:bg-background/55 dark:hover:bg-background/25">
      <TableCell className="align-top py-1.5 px-2 text-xs leading-tight">
        <SongDisplayName
          song={r.entrySong}
          songDisplayName={r.songDisplayName}
        />
      </TableCell>
      <TableCell className="align-top py-1.5 px-2 text-xs leading-tight whitespace-nowrap">
        {r.showDateRaw ? formatDate(r.showDateRaw) : "—"}
      </TableCell>
      <TableCell className="align-top py-1.5 px-2 text-xs break-words leading-tight">
        {r.venueLocation ?? "—"}
      </TableCell>
      <TableCell className="align-top py-1.5 px-2 text-xs break-words leading-tight">
        {r.showGroup ?? "—"}
      </TableCell>
      <TableCell className="align-top py-1 px-1.5">
        <Select
          value={draftSet ?? EPISODE_SETLIST_NULL}
          onValueChange={(v) => setDraftSet(setSelectValue(v))}
          disabled={busy}
        >
          <SelectTrigger
            size="sm"
            className="w-[5rem] px-1.5 text-[0.65rem] [&_svg]:size-3"
          >
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value={EPISODE_SETLIST_NULL}>—</SelectItem>
            {sets.map((s) => (
              <SelectItem key={s.set} value={s.set}>
                {s.set}
              </SelectItem>
            ))}
            {draftSet && !sets.some((s) => s.set === draftSet) ?
              <SelectItem value={draftSet}>{draftSet}</SelectItem>
            : null}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="align-top py-1 px-1.5">
        <Select
          value={
            draftOrder != null ? String(draftOrder) : EPISODE_SETLIST_NULL
          }
          onValueChange={(v) => setDraftOrder(orderSelectValue(v))}
          disabled={busy}
        >
          <SelectTrigger
            size="sm"
            className="w-[4rem] px-1.5 text-[0.65rem] [&_svg]:size-3"
          >
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value={EPISODE_SETLIST_NULL}>—</SelectItem>
            {setnums.map((sn) => (
              <SelectItem key={sn.setnums} value={String(sn.setnums)}>
                {sn.setnums}
              </SelectItem>
            ))}
            {draftOrder != null &&
            !setnums.some((s) => s.setnums === draftOrder) ?
              <SelectItem value={String(draftOrder)}>{draftOrder}</SelectItem>
            : null}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="align-top py-1 px-1.5">
        <Select
          value={draftPlacement ?? EPISODE_SETLIST_NULL}
          onValueChange={(v) =>
            setDraftPlacement(placementSelectValue(v))
          }
          disabled={busy}
        >
          <SelectTrigger
            size="sm"
            className="w-[5.25rem] px-1.5 text-[0.65rem] [&_svg]:size-3"
          >
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value={EPISODE_SETLIST_NULL}>—</SelectItem>
            {placements.map((p) => (
              <SelectItem key={p.placements} value={p.placements}>
                {p.placements}
              </SelectItem>
            ))}
            {draftPlacement &&
            !placements.some((p) => p.placements === draftPlacement) ?
              <SelectItem value={draftPlacement}>{draftPlacement}</SelectItem>
            : null}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="align-top py-0.5 px-1">
        <div className="flex items-center justify-end gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="min-w-9 text-primary hover:bg-primary/10 [&_svg]:size-3.5"
            aria-label="Save set, order, and placement"
            disabled={busy || !isDirty}
            onClick={() =>
              onSaveRow(r.eeUuid, {
                set: draftSet,
                order: draftOrder,
                placement: draftPlacement,
              })
            }
          >
            {savingUuid === r.eeUuid ?
              <Loader2Icon className="size-3.5 animate-spin" />
            : <SaveIcon className="size-3.5" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="min-w-9 text-destructive hover:bg-destructive/10 [&_svg]:size-3.5"
            aria-label="Remove entry"
            disabled={busy}
            onClick={() => onDeleteRow(r.eeUuid)}
          >
            {deletingUuid === r.eeUuid ?
              <Loader2Icon className="size-3.5 animate-spin" />
            : <Trash2Icon className="size-3.5" />}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function AdminRadioEpisodeSetlistsEntriesTable({
  rows,
  loadingRows,
  sets,
  setnums,
  placements,
  savingUuid,
  deletingUuid,
  onSaveRow,
  onDeleteRow,
}: {
  rows: AdminEpisodeSetlistTableRow[]
  loadingRows: boolean
  sets: SetOptions[]
  setnums: SetnumOptions[]
  placements: PlacementOptions[]
  savingUuid: string | null
  deletingUuid: string | null
  onSaveRow: (
    eeUuid: string,
    fields: {
      set: string | null
      order: number | null
      placement: string | null
    },
  ) => void
  onDeleteRow: (eeUuid: string) => void
}) {
  if (loadingRows) {
    return <p className="text-sm text-muted-foreground">Loading entries…</p>
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No songs linked yet. Select a show above and add entries.
      </p>
    )
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-border/80 bg-muted/45 transition-colors dark:bg-muted/35",
      )}
    >
      <div className="max-h-[min(40vh,24rem)] overflow-auto md:max-h-[min(45vh,28rem)]">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 bg-muted/55 hover:bg-muted/55 dark:bg-muted/45">
              <TableHead className="h-auto min-w-[7rem] py-1.5 pr-2 pl-2 text-xs leading-tight">
                Song
              </TableHead>
              <TableHead className="h-auto w-[4.5rem] py-1.5 pr-2 pl-2 text-xs leading-tight">
                Date
              </TableHead>
              <TableHead className="h-auto min-w-[5rem] py-1.5 pr-2 pl-2 text-xs leading-tight">
                Location
              </TableHead>
              <TableHead className="h-auto w-[4rem] py-1.5 pr-2 pl-2 text-xs leading-tight">
                Group
              </TableHead>
              <TableHead className="h-auto w-[5.25rem] py-1.5 pr-2 pl-2 text-xs leading-tight">
                Set
              </TableHead>
              <TableHead className="h-auto w-[4.25rem] py-1.5 pr-2 pl-2 text-xs leading-tight">
                Order
              </TableHead>
              <TableHead className="h-auto w-[5.5rem] py-1.5 pr-2 pl-2 text-xs leading-tight">
                Placement
              </TableHead>
              <TableHead className="h-auto w-[4.5rem] py-1.5 pr-1 pl-2 text-xs leading-tight text-right">
                <span className="sr-only">Save / remove</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <EpisodeSetlistEntryTableRow
                key={r.eeUuid}
                r={r}
                sets={sets}
                setnums={setnums}
                placements={placements}
                savingUuid={savingUuid}
                deletingUuid={deletingUuid}
                onSaveRow={onSaveRow}
                onDeleteRow={onDeleteRow}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
