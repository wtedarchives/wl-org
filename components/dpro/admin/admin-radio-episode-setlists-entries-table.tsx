"use client"

import { useMemo, type Dispatch, type SetStateAction } from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { Loader2Icon, SaveIcon } from "lucide-react"
import type { AdminEpisodeSetlistTableRow } from "@/lib/admin-radio-episode-setlists-enrich"
import {
  applyDraftOrderChange,
  applyDraftSetChange,
  applyDragEnd,
  type EpisodeSetlistEditorState,
} from "@/lib/admin-radio-episode-setlist-entries-dnd"
import type { PlacementOptions, SetOptions, SetnumOptions } from "@/types/admin"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SortableEpisodeSetlistTableRow } from "@/components/dpro/admin/admin-radio-episode-setlists-entries-table-row"
import { cn } from "@/lib/utils"

export { EPISODE_SETLIST_NULL } from "@/components/dpro/admin/admin-radio-episode-setlists-entries-table-row"

/** Stable comparison so "E1" / "e1" / spacing differences still get a set divider. */
function episodeListingSetDividerKey(s: string | null | undefined): string {
  const t = s?.trim().toUpperCase()
  return t && t !== "" ? t : "__empty__"
}

export function AdminRadioEpisodeSetlistsEntriesTable({
  rows,
  editor,
  onEditorChange,
  loadingRows,
  sets,
  setnums,
  placements,
  savingAll,
  deletingUuid,
  onSaveListing,
  onDeleteRow,
}: {
  /** Persisted + staged picks (full listing for cells and drag). */
  rows: AdminEpisodeSetlistTableRow[]
  editor: EpisodeSetlistEditorState
  onEditorChange: Dispatch<SetStateAction<EpisodeSetlistEditorState>>
  loadingRows: boolean
  sets: SetOptions[]
  setnums: SetnumOptions[]
  placements: PlacementOptions[]
  savingAll: boolean
  deletingUuid: string | null
  onSaveListing: () => void
  onDeleteRow: (eeUuid: string) => void
}) {
  const setEditor = onEditorChange

  const rowByUuid = useMemo(() => {
    const m = new Map<string, AdminEpisodeSetlistTableRow>()
    for (const r of rows) m.set(r.eeUuid, r)
    return m
  }, [rows])

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor),
  )

  const sortableIds = useMemo<UniqueIdentifier[]>(
    () => editor.orderUuids,
    [editor.orderUuids],
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setEditor((s) => applyDragEnd(s, String(active.id), String(over.id)))
  }

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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
          >
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 bg-muted/55 hover:bg-muted/55 dark:bg-muted/45">
                  <TableHead className="h-auto w-8 align-middle py-1.5 pr-0 pl-2 text-xs leading-tight">
                    <span className="sr-only">Reorder</span>
                  </TableHead>
                  <TableHead className="h-auto min-w-[7rem] align-middle py-1.5 pr-2 pl-2 text-xs leading-tight">
                    Song
                  </TableHead>
                  <TableHead className="h-auto w-[4.5rem] align-middle py-1.5 pr-2 pl-2 text-xs leading-tight">
                    Date
                  </TableHead>
                  <TableHead className="h-auto min-w-[5rem] align-middle py-1.5 pr-2 pl-2 text-xs leading-tight">
                    Location
                  </TableHead>
                  <TableHead className="h-auto w-[4rem] align-middle py-1.5 pr-2 pl-2 text-xs leading-tight">
                    Group
                  </TableHead>
                  <TableHead className="h-auto w-auto min-w-0 whitespace-nowrap align-middle py-1.5 pr-2 pl-2 text-xs leading-tight">
                    Set
                  </TableHead>
                  <TableHead className="h-auto w-auto min-w-0 whitespace-nowrap align-middle py-1.5 pr-2 pl-2 text-xs leading-tight">
                    Order
                  </TableHead>
                  <TableHead className="h-auto w-auto min-w-0 whitespace-nowrap align-middle py-1.5 pr-2 pl-2 text-xs leading-tight">
                    Placement
                  </TableHead>
                  <TableHead className="h-auto w-[4.5rem] align-middle py-1.5 pr-1 pl-2 text-xs leading-tight">
                    <div className="flex items-center justify-end gap-1">
                      <span className="sr-only">Save and remove</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className={cn(
                          "size-6 shrink-0 touch-manipulation shadow-none [&_svg]:size-3.5",
                          "border-primary/35 bg-primary/12 text-primary hover:bg-primary/22 hover:text-primary",
                          "dark:border-primary/40 dark:bg-primary/18 dark:hover:bg-primary/26",
                        )}
                        disabled={savingAll}
                        aria-label="Save episode listing"
                        onClick={() => onSaveListing()}
                      >
                        {savingAll ?
                          <Loader2Icon
                            className="size-3.5 animate-spin"
                            aria-hidden
                          />
                        : <SaveIcon className="size-3.5" aria-hidden />}
                      </Button>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SortableContext
                  items={sortableIds}
                  strategy={verticalListSortingStrategy}
                >
                  {editor.orderUuids.map((id, index) => {
                    const r = rowByUuid.get(id)
                    if (!r) return null
                    const d = editor.drafts[id]
                    if (!d) return null
                    const prevId =
                      index > 0 ? editor.orderUuids[index - 1] : null
                    const prevSet =
                      prevId ? (editor.drafts[prevId]?.set ?? null) : null
                    const showGroupTopBorder =
                      index > 0 &&
                      episodeListingSetDividerKey(d.set) !==
                        episodeListingSetDividerKey(prevSet)
                    const interactionLocked = savingAll || deletingUuid === id
                    return (
                      <SortableEpisodeSetlistTableRow
                        key={id}
                        r={r}
                        sets={sets}
                        setnums={setnums}
                        placements={placements}
                        interactionLocked={interactionLocked}
                        deleteSpinning={deletingUuid === id}
                        showGroupTopBorder={showGroupTopBorder}
                        draftSet={d.set}
                        draftOrder={d.order}
                        draftPlacement={d.placement}
                        onSetChange={(v) =>
                          setEditor((s) => applyDraftSetChange(s, id, v))
                        }
                        onOrderChange={(v) =>
                          setEditor((s) => applyDraftOrderChange(s, id, v))
                        }
                        onPlacementChange={(v) =>
                          setEditor((s) => ({
                            ...s,
                            drafts: {
                              ...s.drafts,
                              [id]: { ...s.drafts[id], placement: v },
                            },
                          }))
                        }
                        onDeleteRow={() => onDeleteRow(id)}
                      />
                    )
                  })}
                </SortableContext>
              </TableBody>
            </Table>
          </DndContext>
      </div>
    </div>
  )
}
