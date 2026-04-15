import type { AdminEpisodeSetlistTableRow } from "@/lib/admin-radio-episode-setlists-enrich"
import { sortAdminEpisodeSetlistRows } from "@/lib/admin-radio-episode-setlists-enrich"
import { getDefaultPlacementForSet } from "@/lib/setlist-default-placement"
import { arrayMove } from "@dnd-kit/sortable"

export type EpisodeEntryDraft = {
  set: string | null
  order: number | null
  placement: string | null
}

export type EpisodeSetlistEditorState = {
  orderUuids: string[]
  drafts: Record<string, EpisodeEntryDraft>
}

/** Client-only episode rows before insert; `eeUuid` uses this prefix. */
export const EPISODE_LISTING_STAGED_PREFIX = "temp:"

export function isStagedEpisodeListingId(id: string): boolean {
  return id.startsWith(EPISODE_LISTING_STAGED_PREFIX)
}

export function episodeSetlistRowsFingerprint(
  rows: AdminEpisodeSetlistTableRow[],
): string {
  return rows
    .map(
      (r) =>
        `${r.eeUuid}\t${r.wtedSet ?? ""}\t${r.wtedOrder ?? ""}\t${r.wtedPlacement ?? ""}`,
    )
    .join("\n")
}

function coerceDraftOrderFromRow(val: unknown): number | null {
  if (val == null) return null
  if (typeof val === "number" && Number.isFinite(val)) return Math.trunc(val)
  if (typeof val === "string" && val.trim() !== "") {
    const n = Number.parseInt(val, 10)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function normalizeDraftSet(s: string | null | undefined): string | null {
  const t = s?.trim()
  return t && t !== "" ? t : null
}

function normalizeDraftPlacement(p: string | null | undefined): string | null {
  const t = p?.trim()
  return t && t !== "" ? t : null
}

export function initEpisodeSetlistEditorState(
  rows: AdminEpisodeSetlistTableRow[],
): EpisodeSetlistEditorState {
  const sorted = sortAdminEpisodeSetlistRows(rows)
  const orderUuids = sorted.map((r) => r.eeUuid)
  const drafts: Record<string, EpisodeEntryDraft> = {}
  for (const r of sorted) {
    drafts[r.eeUuid] = {
      set: normalizeDraftSet(r.wtedSet),
      order: coerceDraftOrderFromRow(r.wtedOrder),
      placement: normalizeDraftPlacement(r.wtedPlacement),
    }
  }
  return { orderUuids, drafts }
}

function draftsEqualForDirty(b: EpisodeEntryDraft, d: EpisodeEntryDraft): boolean {
  return (
    normalizeDraftSet(b.set) === normalizeDraftSet(d.set) &&
    coerceDraftOrderFromRow(b.order) === coerceDraftOrderFromRow(d.order) &&
    normalizeDraftPlacement(b.placement) === normalizeDraftPlacement(d.placement)
  )
}

/** Rows in UI list order with draft `set` / `order` / `placement` applied. */
export function episodeListingOrderedRowsFromEditor(
  rows: AdminEpisodeSetlistTableRow[],
  editor: EpisodeSetlistEditorState,
): AdminEpisodeSetlistTableRow[] {
  const byId = new Map(rows.map((r) => [r.eeUuid, r]))
  const out: AdminEpisodeSetlistTableRow[] = []
  for (const id of editor.orderUuids) {
    const base = byId.get(id)
    const d = editor.drafts[id]
    if (!base || !d) continue
    out.push({
      ...base,
      wtedSet: d.set,
      wtedOrder: d.order,
      wtedPlacement: d.placement,
    })
  }
  return out
}

function normalizeEpisodeListingSet(s: string | null | undefined): string {
  const t = s?.trim()
  return t && t !== "" ? t : "1"
}

function nextWtedEpisodeEntryAutoFieldsFromOrderedRows(
  ordered: AdminEpisodeSetlistTableRow[],
): { set: string; order: number; placement: string | null } {
  if (ordered.length === 0) {
    return {
      set: "1",
      order: 1,
      placement: getDefaultPlacementForSet("1"),
    }
  }
  const last = ordered[ordered.length - 1]
  const nextSet = normalizeEpisodeListingSet(last.wtedSet)
  const maxOrder = ordered
    .filter((r) => normalizeEpisodeListingSet(r.wtedSet) === nextSet)
    .reduce((m, r) => Math.max(m, r.wtedOrder ?? 0), 0)
  return {
    set: nextSet,
    order: maxOrder + 1,
    placement: getDefaultPlacementForSet(nextSet),
  }
}

/**
 * Next slot for a new episode entry. Uses draft order and values when `editor`
 * has rows; otherwise saved DB order from `rows`.
 */
export function getNextWtedEpisodeEntryAutoFieldsFromState(
  rows: AdminEpisodeSetlistTableRow[],
  editor: EpisodeSetlistEditorState | null | undefined,
): { set: string; order: number; placement: string | null } {
  const ordered =
    editor && editor.orderUuids.length > 0 ?
      episodeListingOrderedRowsFromEditor(rows, editor)
    : sortAdminEpisodeSetlistRows(rows)
  return nextWtedEpisodeEntryAutoFieldsFromOrderedRows(ordered)
}

export function removeEditorRow(
  state: EpisodeSetlistEditorState,
  id: string,
): EpisodeSetlistEditorState {
  return {
    orderUuids: state.orderUuids.filter((x) => x !== id),
    drafts: Object.fromEntries(
      Object.entries(state.drafts).filter(([k]) => k !== id),
    ),
  }
}

/** Inserts to run for staged (not-yet-saved) picks. */
export function collectStagedEpisodeInserts(
  editor: EpisodeSetlistEditorState,
  stagedRowsByTempId: Map<string, AdminEpisodeSetlistTableRow>,
): Array<{
  tempId: string
  entryId: string
  set: string | null
  order: number | null
  placement: string | null
}> {
  const out: Array<{
    tempId: string
    entryId: string
    set: string | null
    order: number | null
    placement: string | null
  }> = []
  for (const id of editor.orderUuids) {
    if (!isStagedEpisodeListingId(id)) continue
    const row = stagedRowsByTempId.get(id)
    const d = editor.drafts[id]
    if (!row || !d) continue
    out.push({
      tempId: id,
      entryId: row.entryId,
      set: normalizeDraftSet(d.set),
      order: coerceDraftOrderFromRow(d.order),
      placement: normalizeDraftPlacement(d.placement),
    })
  }
  return out
}

export function renumberOrdersInPlace(
  orderUuids: string[],
  drafts: Record<string, EpisodeEntryDraft>,
): Record<string, EpisodeEntryDraft> {
  const next: Record<string, EpisodeEntryDraft> = { ...drafts }
  for (const id of orderUuids) {
    const s = drafts[id]?.set ?? "__null__"
    let c = 0
    for (const id2 of orderUuids) {
      if (id2 === id) break
      const s2 = drafts[id2]?.set ?? "__null__"
      if (s2 === s) c++
    }
    const cur = next[id]
    if (cur) next[id] = { ...cur, order: c + 1 }
  }
  return next
}

/** Move `uuid` to after the last row with `newSet` in `drafts` (by list order). */
export function orderUuidsAfterSetChange(
  orderUuids: string[],
  drafts: Record<string, EpisodeEntryDraft>,
  uuid: string,
  newSet: string | null,
): string[] {
  const key = newSet ?? "__null__"
  const rest = orderUuids.filter((id) => id !== uuid)
  for (let i = rest.length - 1; i >= 0; i--) {
    const s = drafts[rest[i]]?.set ?? "__null__"
    if (s === key) {
      const at = i + 1
      return [...rest.slice(0, at), uuid, ...rest.slice(at)]
    }
  }
  return [...rest, uuid]
}

export function applyDraftSetChange(
  state: EpisodeSetlistEditorState,
  uuid: string,
  newSet: string | null,
): EpisodeSetlistEditorState {
  const prev = state.drafts[uuid]
  if (!prev) return state
  if ((prev.set ?? null) === newSet) return state
  const placement = getDefaultPlacementForSet(newSet)
  const drafts = {
    ...state.drafts,
    [uuid]: { ...prev, set: newSet, placement },
  }
  const orderUuids = orderUuidsAfterSetChange(
    state.orderUuids,
    drafts,
    uuid,
    newSet,
  )
  return {
    orderUuids,
    drafts: renumberOrdersInPlace(orderUuids, drafts),
  }
}

export function applyDraftOrderChange(
  state: EpisodeSetlistEditorState,
  uuid: string,
  newOrder: number | null,
): EpisodeSetlistEditorState {
  if (newOrder == null) {
    const prev = state.drafts[uuid]
    if (!prev) return state
    const drafts = {
      ...state.drafts,
      [uuid]: { ...prev, order: null },
    }
    return { ...state, drafts }
  }
  const { orderUuids, drafts } = state
  const s = drafts[uuid]?.set ?? "__null__"
  const blockStart = orderUuids.findIndex(
    (id) => (drafts[id]?.set ?? "__null__") === s,
  )
  if (blockStart < 0) return state
  const blockEnd = orderUuids.findIndex(
    (id, i) => i > blockStart && (drafts[id]?.set ?? "__null__") !== s,
  )
  const end = blockEnd === -1 ? orderUuids.length : blockEnd
  const block = orderUuids.slice(blockStart, end)
  const oldIdx = block.indexOf(uuid)
  if (oldIdx < 0) return state
  const newIdx = Math.min(Math.max(0, newOrder - 1), block.length - 1)
  const newBlock = arrayMove(block, oldIdx, newIdx)
  const nextOrder = [
    ...orderUuids.slice(0, blockStart),
    ...newBlock,
    ...orderUuids.slice(end),
  ]
  return {
    orderUuids: nextOrder,
    drafts: renumberOrdersInPlace(nextOrder, drafts),
  }
}

export function applyDragEnd(
  state: EpisodeSetlistEditorState,
  activeId: string,
  overId: string,
): EpisodeSetlistEditorState {
  const { orderUuids, drafts } = state
  const oldIdx = orderUuids.indexOf(activeId)
  const newIdx = orderUuids.indexOf(overId)
  if (oldIdx < 0 || newIdx < 0 || oldIdx === newIdx) return state
  const nextOrder = arrayMove(orderUuids, oldIdx, newIdx)
  const overSet = drafts[overId]?.set ?? null
  const prevMoved = drafts[activeId]
  if (!prevMoved) return { orderUuids: nextOrder, drafts }
  const prevSet = prevMoved.set ?? null
  const placement =
    prevSet !== overSet ? getDefaultPlacementForSet(overSet) : prevMoved.placement
  const nextDrafts: Record<string, EpisodeEntryDraft> = {
    ...drafts,
    [activeId]: { ...prevMoved, set: overSet, placement },
  }
  return {
    orderUuids: nextOrder,
    drafts: renumberOrdersInPlace(nextOrder, nextDrafts),
  }
}

export function isEpisodeSetlistEditorDirty(
  rows: AdminEpisodeSetlistTableRow[],
  state: EpisodeSetlistEditorState,
): boolean {
  if (state.orderUuids.some((id) => isStagedEpisodeListingId(id))) return true
  const baseline = initEpisodeSetlistEditorState(rows)
  if (baseline.orderUuids.join("\0") !== state.orderUuids.join("\0")) return true
  for (const id of state.orderUuids) {
    const b = baseline.drafts[id]
    const d = state.drafts[id]
    if (!b || !d) return true
    if (!draftsEqualForDirty(b, d)) return true
  }
  return false
}

export function collectEpisodeSetlistUpdates(
  rows: AdminEpisodeSetlistTableRow[],
  state: EpisodeSetlistEditorState,
): Array<{
  eeUuid: string
  set: string | null
  order: number | null
  placement: string | null
}> {
  const baseline = initEpisodeSetlistEditorState(rows)
  const out: Array<{
    eeUuid: string
    set: string | null
    order: number | null
    placement: string | null
  }> = []
  for (const id of state.orderUuids) {
    const b = baseline.drafts[id]
    const d = state.drafts[id]
    if (!b || !d) continue
    if (!draftsEqualForDirty(b, d)) {
      out.push({
        eeUuid: id,
        set: normalizeDraftSet(d.set),
        order: coerceDraftOrderFromRow(d.order),
        placement: normalizeDraftPlacement(d.placement),
      })
    }
  }
  return out
}
