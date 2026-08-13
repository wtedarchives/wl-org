"use client"

import { useEffect, useMemo, useState } from "react"
import { MagnifyingGlass } from "@phosphor-icons/react"
import { toast } from "sonner"

import { useAuth } from "@/components/auth-context"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import { getDefaultPlacementForSet } from "@/lib/setlist-default-placement"
import { nextBrainsSlot } from "@/lib/brains-setlist-reorder"
import { cn } from "@/lib/utils"
import type { AdminSetlistEntryData } from "@/types/admin"
import type {
  BrainsEntryOptions,
  BrainsGuestOption,
} from "@/hooks/use-brains-entry-options"
import type { BrainsEntryPatch } from "@/hooks/use-brains-setlist"

/**
 * "Is this a debut?" — a text column, not a boolean.
 *
 * Live values in the archive are `FALSE` (4,519 rows), `false` (3,464),
 * `New Cover Song` (16) and `New Original Song` (1). New writes standardize on
 * lowercase `false`; normalizing the legacy uppercase rows is a separate cleanup
 * that only affects the setlist game.
 */
const NEW_SONG_OPTIONS = [
  { value: "false", label: "Not new" },
  { value: "New Original Song", label: "New original" },
  { value: "New Cover Song", label: "New cover" },
] as const

const SEGUE_VALUE = ">"

interface BrainsEntryFormProps {
  open: boolean
  onClose: () => void
  /** Null when adding. */
  entry: AdminSetlistEntryData | null
  /** Current entries, for defaulting a new row's set and number. */
  existing: AdminSetlistEntryData[]
  options: BrainsEntryOptions
  onSubmit: (patch: BrainsEntryPatch) => Promise<string | null>
  onSavePersonnel: (entryId: string, guestIds: string[]) => Promise<boolean>
  onDelete: (entryId: string) => Promise<boolean>
}

function personnelLabel(g: BrainsGuestOption): string {
  const name = g.guest_displayname?.trim() || g.guest
  return g.guest_instrument?.trim() ? `${name} — ${g.guest_instrument}` : name
}

/**
 * Add or edit one setlist entry.
 *
 * Carries only the fields a setlister needs: set, number, placement, song, short,
 * segue, personnel, coach's notes and the debut flag. No show picker (the show is
 * fixed by the assignment), no length.
 *
 * Picking a set refills BOTH the number and the placement, so appending during a
 * live show is one choice — the song — and everything else lands correctly.
 */
export function BrainsEntryForm({
  open,
  onClose,
  entry,
  existing,
  options,
  onSubmit,
  onSavePersonnel,
  onDelete,
}: BrainsEntryFormProps) {
  const { session } = useAuth()
  const token = session?.token ?? null
  const isNew = entry === null

  const [entrySet, setEntrySet] = useState("1")
  const [setnum, setSetnum] = useState(1)
  const [placement, setPlacement] = useState<string>("")
  // `setlist_entries.entry_song` is TEXT with a foreign key onto `songs(song)`,
  // whose primary key is the name itself — so this holds the song NAME, not a uuid.
  const [songName, setSongName] = useState<string>("")
  const [songQuery, setSongQuery] = useState("")
  const [short, setShort] = useState<string>("")
  const [segue, setSegue] = useState(false)
  const [coachNotes, setCoachNotes] = useState("")
  const [isNewSong, setIsNewSong] = useState<string>("false")
  const [guestIds, setGuestIds] = useState<string[]>([])
  const [personnelQuery, setPersonnelQuery] = useState("")
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Reset the whole form whenever the dialog opens, keyed on which entry it opened
  // for. Without this an edit would inherit the previous row's values.
  useEffect(() => {
    if (!open) return
    if (entry) {
      setEntrySet(entry.entry_set ?? "1")
      setSetnum(entry.entry_setnum ?? 1)
      setPlacement(entry.entry_placement ?? "")
      setSongName(entry.entry_song ?? "")
      setShort(entry.entry_short ?? "")
      setSegue((entry.entry_segue ?? "") === SEGUE_VALUE)
      setCoachNotes(entry.entry_coachnotes ?? "")
      // Legacy rows carry FALSE as well as false; both mean "not new".
      const raw = (entry.entry_new ?? "false").trim()
      setIsNewSong(/^false$/i.test(raw) ? "false" : raw)
    } else {
      const slot = nextBrainsSlot(
        existing.map((e) => ({
          entry_id: e.entry_id,
          entry_set: e.entry_set ?? "1",
          entry_setnum: e.entry_setnum,
        })),
      )
      setEntrySet(slot.entry_set)
      setSetnum(slot.entry_setnum)
      setPlacement(getDefaultPlacementForSet(slot.entry_set) ?? "")
      setSongName("")
      setShort("")
      setSegue(false)
      setCoachNotes("")
      setIsNewSong("false")
    }
    setSongQuery("")
    setPersonnelQuery("")
    setConfirmDelete(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, entry?.entry_id])

  // Existing personnel for the row being edited.
  useEffect(() => {
    if (!open || !entry || !token) {
      setGuestIds([])
      return
    }
    let cancelled = false
    async function run() {
      const { data } = await invokeDproAdmin<{ guest_ids: string[] }>(token, {
        action: "setlist_entry_guests_select",
        setlist_entry_id: entry!.entry_id,
      })
      if (!cancelled) setGuestIds(data?.guest_ids ?? [])
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [open, entry, token])

  /** Changing the set re-derives the number and the placement together. */
  const handleSetChange = (nextSet: string) => {
    setEntrySet(nextSet)
    setPlacement(getDefaultPlacementForSet(nextSet) ?? "")
    if (isNew) {
      const slot = nextBrainsSlot(
        existing.map((e) => ({
          entry_id: e.entry_id,
          entry_set: e.entry_set ?? "1",
          entry_setnum: e.entry_setnum,
        })),
        nextSet,
      )
      setSetnum(slot.entry_setnum)
    }
  }

  const filteredSongs = useMemo(() => {
    const q = songQuery.trim().toLowerCase()
    if (q === "") return options.songs.slice(0, 40)
    return options.songs
      .filter((s) => s.song.toLowerCase().includes(q))
      .slice(0, 40)
  }, [songQuery, options.songs])

  const selectedSong = options.songs.find((s) => s.song === songName)

  const filteredPersonnel = useMemo(() => {
    const q = personnelQuery.trim().toLowerCase()
    if (q === "") return options.personnel.slice(0, 30)
    return options.personnel
      .filter((g) =>
        `${g.guest} ${g.guest_displayname ?? ""}`.toLowerCase().includes(q),
      )
      .slice(0, 30)
  }, [personnelQuery, options.personnel])

  const selectedPersonnel = options.personnel.filter((g) =>
    guestIds.includes(g.guest_id),
  )

  const handleSave = async () => {
    if (!songName) {
      toast.error("Pick a song.")
      return
    }
    setSaving(true)
    try {
      const patch: BrainsEntryPatch = {
        entry_set: entrySet,
        entry_setnum: setnum,
        entry_song: songName,
        entry_short: short === "" ? null : short,
        entry_segue: segue ? SEGUE_VALUE : null,
        entry_placement: placement === "" ? null : placement,
        entry_coachnotes: coachNotes.trim() === "" ? null : coachNotes.trim(),
        entry_new: isNewSong,
      }
      const resultId = await onSubmit(patch)
      const targetId = entry?.entry_id ?? resultId
      if (targetId) await onSavePersonnel(targetId, guestIds)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!entry) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setSaving(true)
    try {
      const ok = await onDelete(entry.entry_id)
      if (ok) onClose()
    } finally {
      setSaving(false)
    }
  }

  const labelCls =
    "font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-white/60"

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      {/* Near-fullscreen on a phone, a normal dialog from sm up. */}
      <DialogContent className="max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-base">
            {isNew ? "Add song" : "Edit song"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex min-w-0 flex-col gap-3">
          {/* Song — the one field that always needs a decision, so it leads. */}
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className={labelCls}>Song</span>
            {selectedSong ? (
              <div className="flex min-w-0 items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {selectedSong.song}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSongName("")}
                >
                  Change
                </Button>
              </div>
            ) : (
              <>
                <div className="relative min-w-0">
                  <MagnifyingGlass
                    className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 opacity-60"
                    aria-hidden
                  />
                  <Input
                    value={songQuery}
                    onChange={(e) => setSongQuery(e.target.value)}
                    placeholder="Search songs"
                    className="h-9 pl-9"
                    autoFocus={isNew}
                  />
                </div>
                <ul className="flex max-h-48 min-w-0 flex-col gap-0.5 overflow-y-auto">
                  {filteredSongs.map((s) => (
                    <li key={s.song_id} className="min-w-0">
                      <button
                        type="button"
                        onClick={() => setSongName(s.song)}
                        className="w-full min-w-0 truncate rounded px-2 py-1.5 text-left text-sm hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
                      >
                        {s.song}
                      </button>
                    </li>
                  ))}
                  {filteredSongs.length === 0 && (
                    <li className={labelCls}>No match — add it below the table</li>
                  )}
                </ul>
              </>
            )}
          </div>

          <div className="grid min-w-0 grid-cols-2 gap-3">
            <label className="flex min-w-0 flex-col gap-1.5">
              <span className={labelCls}>Set</span>
              <select
                value={entrySet}
                onChange={(e) => handleSetChange(e.target.value)}
                className="h-9 min-w-0 rounded border border-white/15 bg-transparent px-2 text-sm"
              >
                {options.sets.map((s) => (
                  <option key={s} value={s} className="text-black">
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex min-w-0 flex-col gap-1.5">
              <span className={labelCls}>Number</span>
              <Input
                type="number"
                min={1}
                value={setnum}
                onChange={(e) => setSetnum(Number(e.target.value) || 1)}
                className="h-9"
              />
            </label>
          </div>

          <label className="flex min-w-0 flex-col gap-1.5">
            <span className={labelCls}>Placement</span>
            <select
              value={placement}
              onChange={(e) => setPlacement(e.target.value)}
              className="h-9 min-w-0 rounded border border-white/15 bg-transparent px-2 text-sm"
            >
              <option value="" className="text-black">
                —
              </option>
              {options.placements.map((p) => (
                <option key={p} value={p} className="text-black">
                  {p}
                </option>
              ))}
            </select>
          </label>

          <div className="grid min-w-0 grid-cols-2 gap-3">
            <label className="flex min-w-0 flex-col gap-1.5">
              <span className={labelCls}>Short</span>
              <select
                value={short}
                onChange={(e) => setShort(e.target.value)}
                className="h-9 min-w-0 rounded border border-white/15 bg-transparent px-2 text-sm"
              >
                <option value="" className="text-black">
                  —
                </option>
                {options.shorts.map((s) => (
                  <option key={s} value={s} className="text-black">
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex min-w-0 flex-col gap-1.5">
              <span className={labelCls}>New?</span>
              <select
                value={isNewSong}
                onChange={(e) => setIsNewSong(e.target.value)}
                className="h-9 min-w-0 rounded border border-white/15 bg-transparent px-2 text-sm"
              >
                {NEW_SONG_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="text-black">
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Only ">" exists in the segues table, so this is a toggle. */}
          <label className="flex min-w-0 cursor-pointer items-center gap-2">
            <Checkbox
              checked={segue}
              onCheckedChange={(v) => setSegue(v === true)}
            />
            <span className="text-sm">Segues into the next song</span>
          </label>

          <div className="flex min-w-0 flex-col gap-1.5">
            <span className={labelCls}>Personnel</span>
            {selectedPersonnel.length > 0 && (
              <ul className="flex min-w-0 flex-wrap gap-1">
                {selectedPersonnel.map((g) => (
                  <li key={g.guest_id}>
                    <button
                      type="button"
                      onClick={() =>
                        setGuestIds((ids) =>
                          ids.filter((id) => id !== g.guest_id),
                        )
                      }
                      className="rounded bg-white/10 px-1.5 py-0.5 text-xs hover:bg-white/20"
                      title="Remove"
                    >
                      {personnelLabel(g)} ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Input
              value={personnelQuery}
              onChange={(e) => setPersonnelQuery(e.target.value)}
              placeholder="Search personnel"
              className="h-9"
            />
            {personnelQuery.trim() !== "" && (
              <ul className="flex max-h-40 min-w-0 flex-col gap-0.5 overflow-y-auto">
                {filteredPersonnel.map((g) => (
                  <li key={g.guest_id} className="min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        setGuestIds((ids) =>
                          ids.includes(g.guest_id) ? ids : [...ids, g.guest_id],
                        )
                        setPersonnelQuery("")
                      }}
                      className={cn(
                        "w-full min-w-0 truncate rounded px-2 py-1.5 text-left text-sm hover:bg-white/10",
                        guestIds.includes(g.guest_id) && "opacity-40",
                      )}
                    >
                      {personnelLabel(g)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <label className="flex min-w-0 flex-col gap-1.5">
            <span className={labelCls}>Coach&rsquo;s notes</span>
            <Textarea
              value={coachNotes}
              onChange={(e) => setCoachNotes(e.target.value)}
              rows={2}
              className="text-sm"
            />
          </label>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {!isNew ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={saving}
              onClick={() => void handleDelete()}
              className={cn(confirmDelete && "text-rose-300")}
            >
              {confirmDelete ? "Tap again to delete" : "Delete"}
            </Button>
          ) : (
            <span />
          )}
          <span className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => void handleSave()}
              disabled={saving || !songName}
            >
              {saving ? "Saving…" : isNew ? "Add" : "Save"}
            </Button>
          </span>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
