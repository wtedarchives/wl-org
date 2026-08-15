"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Save, Trash2, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  defaultPlacementForNewSong,
  formatBrainsSetLabel,
  placementsForSet,
} from "@/lib/brains-sets"
import { nextBrainsSlot } from "@/lib/brains-setlist-reorder"
import type { AdminSetlistEntryData } from "@/types/admin"
import type { BrainsEntryOptions } from "@/hooks/use-brains-entry-options"
import type { BrainsEntryPatch } from "@/hooks/use-brains-setlist"

import { BrainsUnknownSongForm } from "./brains-unknown-song-form"

const SEGUE_VALUE = ">"
const LABEL_CLS = "mb-0.5 block text-xs font-medium"

interface BrainsEntryFormProps {
  open: boolean
  onClose: () => void
  /** Null when adding. */
  entry: AdminSetlistEntryData | null
  /** Set the new row will be appended to. Ignored when editing. */
  targetSet: string | null
  existing: AdminSetlistEntryData[]
  options: BrainsEntryOptions
  onSubmit: (patch: BrainsEntryPatch) => Promise<string | null>
  onDelete: (entryId: string) => Promise<boolean>
}

/**
 * Add or edit one setlist entry.
 *
 * Set and number are not chosen here — they come from the visual set the song
 * sits in. Placement is limited to labels that belong to that set.
 */
export function BrainsEntryForm({
  open,
  onClose,
  entry,
  targetSet,
  existing,
  options,
  onSubmit,
  onDelete,
}: BrainsEntryFormProps) {
  const dialogContentRef = useRef<HTMLDivElement>(null)
  const isNew = entry === null
  const entrySet = entry?.entry_set ?? targetSet ?? "1"

  const [creatingSong, setCreatingSong] = useState(false)
  const [unknownTitle, setUnknownTitle] = useState("")
  const [songName, setSongName] = useState("")
  const [placement, setPlacement] = useState("")
  const [short, setShort] = useState("")
  const [segue, setSegue] = useState(false)
  const [coachNotes, setCoachNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const placementOptions = useMemo(() => {
    const list = placementsForSet(entrySet, options.placements)
    if (placement && !list.includes(placement)) return [placement, ...list]
    return list
  }, [entrySet, options.placements, placement])

  const songNames = useMemo(
    () => options.songs.map((s) => s.song),
    [options.songs],
  )

  const slot = useMemo(
    () =>
      nextBrainsSlot(
        existing.map((e) => ({
          entry_id: e.entry_id,
          entry_set: e.entry_set ?? "1",
          entry_setnum: e.entry_setnum,
        })),
        entrySet,
      ),
    [existing, entrySet],
  )

  useEffect(() => {
    if (!open) return
    setCreatingSong(false)
    setUnknownTitle("")
    setConfirmDelete(false)
    if (entry) {
      setSongName(entry.entry_song ?? "")
      setPlacement(entry.entry_placement ?? "")
      setShort(entry.entry_short ?? "")
      setSegue((entry.entry_segue ?? "") === SEGUE_VALUE)
      setCoachNotes(entry.entry_coachnotes ?? "")
      return
    }
    const isFirst = slot.entry_setnum === 1
    setSongName("")
    setPlacement(defaultPlacementForNewSong(entrySet, isFirst))
    setShort("")
    setSegue(false)
    setCoachNotes("")
  }, [open, entry?.entry_id, entrySet, slot.entry_setnum, entry])

  const handleSave = async () => {
    if (!songName) {
      toast.error("Pick a song.")
      return
    }
    setSaving(true)
    try {
      const patch: BrainsEntryPatch = {
        entry_set: entrySet,
        entry_setnum: isNew ? slot.entry_setnum : (entry?.entry_setnum ?? slot.entry_setnum),
        entry_song: songName,
        entry_short: short === "" ? null : short,
        entry_segue: segue ? SEGUE_VALUE : null,
        entry_placement: placement === "" ? null : placement,
        entry_coachnotes: coachNotes.trim() === "" ? null : coachNotes.trim(),
      }
      const resultId = await onSubmit(patch)
      if (resultId) onClose()
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

  const setnum = isNew ? slot.entry_setnum : (entry?.entry_setnum ?? slot.entry_setnum)

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-xl overflow-y-auto sm:max-w-xl"
        showCloseButton={false}
      >
        <div ref={dialogContentRef} className="contents">
          <div className="flex items-center justify-between gap-2">
            <DialogHeader>
              <DialogTitle>
                {creatingSong ?
                  "Add a new song"
                : isNew ?
                  "Add Setlist Entry"
                : "Edit Setlist Entry"}
              </DialogTitle>
            </DialogHeader>
            {!creatingSong ?
              <div className="flex shrink-0 gap-2">
                {!isNew ?
                  <Button
                    variant={confirmDelete ? "default" : "destructive"}
                    size="sm"
                    onClick={() => void handleDelete()}
                    disabled={saving}
                    title={confirmDelete ? "Confirm delete" : "Delete"}
                  >
                    {confirmDelete ? "Confirm" : <Trash2 className="size-4" />}
                  </Button>
                : null}
                <Button
                  size="sm"
                  onClick={() => void handleSave()}
                  disabled={saving || !songName}
                >
                  <Save className="size-4" />
                  {saving ? "…" : null}
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="size-4" />
                </Button>
              </div>
            : null}
          </div>

          {creatingSong ?
            <BrainsUnknownSongForm
              songs={options.songs}
              artists={options.artists}
              initialTitle={unknownTitle}
              onCreated={(name) => {
                setSongName(name)
                setCreatingSong(false)
                setUnknownTitle("")
              }}
              onCancel={() => setCreatingSong(false)}
              onRefreshOptions={options.refresh}
            />
          : <div className="wl-home-v2-archive-admin-song-form grid grid-cols-1 gap-3">
              <p className="m-0 text-xs text-white/55">
                {formatBrainsSetLabel(entrySet)}
                {" · "}
                #{setnum}
              </p>

              <div className="min-w-0">
                <span className={LABEL_CLS}>Song</span>
                <Combobox
                  items={songNames}
                  value={songName || null}
                  onValueChange={(value) => value != null && setSongName(value)}
                >
                  <ComboboxInput
                    placeholder="Select a song..."
                    className="h-9 w-full text-sm"
                  />
                  <ComboboxContent container={dialogContentRef}>
                    <ComboboxEmpty>
                      <span className="flex flex-col items-center gap-2 px-2">
                        <span>No songs found.</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="min-h-11"
                          onClick={() => {
                            setUnknownTitle("")
                            setCreatingSong(true)
                          }}
                        >
                          Add a new song
                        </Button>
                      </span>
                    </ComboboxEmpty>
                    <ComboboxList>
                      {(item) => (
                        <ComboboxItem key={item} value={item} className="text-xs">
                          {item}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                <button
                  type="button"
                  className="mt-1.5 min-h-11 text-left text-xs text-white/55 underline-offset-2 hover:text-white hover:underline"
                  onClick={() => {
                    setUnknownTitle("")
                    setCreatingSong(true)
                  }}
                >
                  Song isn’t listed?
                </button>
              </div>

              <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex min-w-0 flex-col">
                  <span className={LABEL_CLS}>Placement</span>
                  <select
                    value={placement}
                    onChange={(e) => setPlacement(e.target.value)}
                    className="h-9 min-w-0 rounded border border-white/15 bg-transparent px-2 text-sm"
                  >
                    {placementOptions.map((p) => (
                      <option key={p} value={p} className="text-black">
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex min-w-0 flex-col">
                  <span className={LABEL_CLS}>Short</span>
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
              </div>

              <label className="flex min-h-11 min-w-0 cursor-pointer items-center gap-2">
                <Checkbox
                  checked={segue}
                  onCheckedChange={(v) => setSegue(v === true)}
                />
                <span className="text-sm">Segues into the next song →</span>
              </label>

              <label className="flex min-w-0 flex-col">
                <span className={LABEL_CLS}>Coach&apos;s Notes</span>
                <Textarea
                  value={coachNotes}
                  onChange={(e) => setCoachNotes(e.target.value)}
                  rows={4}
                  className="font-mono text-xs"
                />
              </label>
            </div>
          }
        </div>
      </DialogContent>
    </Dialog>
  )
}
