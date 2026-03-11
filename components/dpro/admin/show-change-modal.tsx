"use client"

import { useState, useEffect } from "react"
import { Save, Edit, X, Trash2, Check } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { ShowChangeData } from "@/types/admin"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ShowChangeModalProps {
  isOpen: boolean
  onClose: () => void
  change: ShowChangeData | null
  onSave: () => void
  isNewChange?: boolean
}

export function ShowChangeModal({
  isOpen,
  onClose,
  change,
  onSave,
  isNewChange = false,
}: ShowChangeModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editedChange, setEditedChange] = useState<ShowChangeData | null>(null)
  const [changeTypes, setChangeTypes] = useState<{ change: string }[]>([])
  const [songs, setSongs] = useState<{ song: string; song_id: string }[]>([])
  const [selectedSongId, setSelectedSongId] = useState("")
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false)

  useEffect(() => {
    if (supabase) {
      supabase
        .from("changes")
        .select("change")
        .order("change")
        .then(({ data }) => setChangeTypes(data || []))
      supabase
        .from("songs")
        .select("song, song_id")
        .eq("song_placeholder", false)
        .order("song", { ascending: true })
        .then(({ data }) => setSongs(data || []))
    }
  }, [])

  useEffect(() => {
    if (change) {
      setEditedChange(change)
      setIsEditing(isNewChange)
    }
  }, [change, isNewChange])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (!editedChange) return
    const { name, value } = e.target
    const updatedValue =
      name === "change_order" ? (value === "" ? 0 : parseInt(value) || 0) : value
    setEditedChange({ ...editedChange, [name]: updatedValue })
  }

  const handleSongSelect = (songId: string) => {
    if (!editedChange || !songId) return
    const selectedSong = songs.find((s) => s.song_id === songId)
    if (!selectedSong) return
    const songLink = `<a href="https://dripfield.pro/song/${selectedSong.song_id}">${selectedSong.song}</a>`
    setEditedChange({
      ...editedChange,
      change: editedChange.change + songLink,
    })
    setSelectedSongId("")
  }

  const handleInsertArrow = () => {
    if (!editedChange) return
    setEditedChange({ ...editedChange, change: editedChange.change + "→" })
  }

  const toggleEdit = () => {
    if (isEditing && !isNewChange) handleSaveChanges()
    else setIsEditing(true)
  }

  const handleSaveChanges = async () => {
    if (!editedChange || !editedChange.change_type || !editedChange.change) {
      alert("Please fill in all required fields")
      return
    }
    if (!supabase) return
    setIsSubmitting(true)
    try {
      const err = isNewChange
        ? (
            await supabase.from("show_changes").insert({
              show_id: editedChange.show_id,
              change_order: editedChange.change_order,
              change_type: editedChange.change_type,
              change: editedChange.change,
            })
          ).error
        : (
            await supabase
              .from("show_changes")
              .update({
                change_order: editedChange.change_order,
                change_type: editedChange.change_type,
                change: editedChange.change,
              })
              .eq("show_change_uuid", editedChange.show_change_uuid)
          ).error
      if (err) throw err
      setIsEditing(false)
      onSave()
      onClose()
    } catch (error) {
      console.error("Error saving show change:", error)
      alert(
        `Error ${isNewChange ? "creating" : "updating"} change: ${error instanceof Error ? error.message : "Unknown"}`
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!editedChange?.show_change_uuid || !supabase) return
    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from("show_changes")
        .delete()
        .eq("show_change_uuid", editedChange.show_change_uuid)
      if (error) throw error
      onSave()
      onClose()
    } catch (error) {
      console.error("Error deleting change:", error)
      alert(
        `Error deleting change: ${error instanceof Error ? error.message : "Unknown"}`
      )
    } finally {
      setIsSubmitting(false)
      setIsDeleteConfirming(false)
    }
  }

  if (!isOpen || !change) return null

  const isReadOnly = !isEditing && !isNewChange

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isNewChange ? "Add Show Change" : "Edit Show Change"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          {!isNewChange && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleEdit}
                disabled={isSubmitting}
              >
                {isEditing ? <Save className="size-4" /> : <Edit className="size-4" />}
              </Button>
              <Button
                variant={isDeleteConfirming ? "default" : "destructive"}
                size="sm"
                onClick={() =>
                  isDeleteConfirming ? handleDelete() : setIsDeleteConfirming(true)
                }
                disabled={isSubmitting}
                title={isDeleteConfirming ? "Confirm Delete" : "Delete"}
              >
                {isDeleteConfirming ? (
                  <Check className="size-4" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </Button>
            </>
          )}
          {isNewChange && (
            <Button
              size="sm"
              onClick={handleSaveChanges}
              disabled={
                isSubmitting ||
                !editedChange?.change_type ||
                !editedChange?.change
              }
            >
              <Save className="size-4" />
              {isSubmitting && "..."}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
        <div className="space-y-2">
          <div>
            <label className="mb-0.5 block text-xs font-medium">Order</label>
            <Input
              type="number"
              name="change_order"
              value={editedChange?.change_order ?? ""}
              onChange={handleInputChange}
              readOnly={isReadOnly}
              className="h-8 text-xs"
            />
          </div>
          <div>
            <label className="mb-0.5 block text-xs font-medium">Type</label>
            {isReadOnly ? (
              <Input
                value={editedChange?.change_type ?? ""}
                readOnly
                className="h-8 text-xs"
              />
            ) : (
              <select
                name="change_type"
                value={editedChange?.change_type ?? ""}
                onChange={handleInputChange}
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                required
              >
                <option value="">Select a type...</option>
                {changeTypes.map((t) => (
                  <option key={t.change} value={t.change}>
                    {t.change}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <div className="mb-0.5 flex items-center justify-between">
              <label className="block text-xs font-medium">Change</label>
              {!isReadOnly && (
                <div className="flex gap-2">
                  <select
                    value={selectedSongId}
                    onChange={(e) => handleSongSelect(e.target.value)}
                    className="h-8 w-48 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="">Add song link...</option>
                    {songs.map((s) => (
                      <option key={s.song_id} value={s.song_id}>
                        {s.song}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleInsertArrow}
                    title="Insert arrow"
                  >
                    →
                  </Button>
                </div>
              )}
            </div>
            <textarea
              name="change"
              value={editedChange?.change ?? ""}
              onChange={handleInputChange}
              readOnly={isReadOnly}
              rows={6}
              placeholder="Enter the change details..."
              className="w-full rounded-md border border-input bg-background px-2 py-1 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
