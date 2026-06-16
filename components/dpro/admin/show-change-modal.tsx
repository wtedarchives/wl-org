"use client"

import { useState, useEffect, useRef } from "react"
import {
  Save,
  Edit,
  Trash2,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import { supabase } from "@/lib/supabase"
import type { ShowChangeData } from "@/types/admin"
import {
  AdminHtmlLinkInserters,
  insertTextAtTextareaCursor,
} from "./admin-html-link-inserters"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  const { session } = useAuth()
  const token = session?.token ?? null
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editedChange, setEditedChange] = useState<ShowChangeData | null>(null)
  const [changeTypes, setChangeTypes] = useState<{ change: string }[]>([])
  const [songs, setSongs] = useState<{ song: string; song_id: string }[]>([])
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false)
  const changeTextareaRef = useRef<HTMLTextAreaElement>(null)

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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!editedChange) return
    const { name, value } = e.target
    const updatedValue =
      name === "change_order" ? (value === "" ? 0 : parseInt(value) || 0) : value
    setEditedChange({ ...editedChange, [name]: updatedValue })
  }

  const handleOrderStep = (delta: number) => {
    if (!editedChange) return
    const next = Math.max(0, (editedChange.change_order ?? 0) + delta)
    setEditedChange({ ...editedChange, change_order: next })
  }

  const insertChangeAtCursor = (text: string, cursorOffset?: number) => {
    if (!editedChange) return
    insertTextAtTextareaCursor(
      changeTextareaRef.current,
      text,
      editedChange.change ?? "",
      (newValue) => setEditedChange({ ...editedChange, change: newValue }),
      cursorOffset,
    )
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
    if (!token) {
      alert("You must be signed in.")
      return
    }
    setIsSubmitting(true)
    try {
      const err = isNewChange
        ? (
            await invokeDproAdmin(token, {
              action: "show_changes_insert",
              row: {
                show_id: editedChange.show_id,
                change_order: editedChange.change_order,
                change_type: editedChange.change_type,
                change: editedChange.change,
              },
            })
          ).error
        : (
            await invokeDproAdmin(token, {
              action: "show_changes_update",
              show_change_uuid: editedChange.show_change_uuid,
              patch: {
                change_order: editedChange.change_order,
                change_type: editedChange.change_type,
                change: editedChange.change,
              },
            })
          ).error
      if (err) throw new Error(err)
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
    if (!editedChange?.show_change_uuid || !token) return
    setIsSubmitting(true)
    try {
      const { error } = await invokeDproAdmin(token, {
        action: "show_changes_delete",
        show_change_uuid: editedChange.show_change_uuid,
      })
      if (error) throw new Error(error)
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
      <DialogContent
        className="max-h-[90vh] max-w-md overflow-y-auto"
        showCloseButton={false}
      >
        <DialogHeader className="flex flex-row items-center justify-between gap-4">
          <DialogTitle>
            {isNewChange ? "Add Show Change" : "Edit Show Change"}
          </DialogTitle>
          <div className="flex items-center gap-1">
            {!isNewChange && (
              <>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={toggleEdit}
                  disabled={isSubmitting}
                  title={isEditing ? "Save" : "Edit"}
                >
                  {isEditing ? (
                    <Save className="size-4" />
                  ) : (
                    <Edit className="size-4" />
                  )}
                </Button>
                <Button
                  variant={isDeleteConfirming ? "default" : "destructive"}
                  size="icon-sm"
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
                size="icon-sm"
                onClick={handleSaveChanges}
                disabled={
                  isSubmitting ||
                  !editedChange?.change_type ||
                  !editedChange?.change
                }
                title="Save"
              >
                <Save className="size-4" />
              </Button>
            )}
            <DialogClose asChild>
              <Button variant="ghost" size="icon-sm" title="Close">
                <X className="size-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        <div className="space-y-2">
          <div>
            <label className="mb-0.5 block text-xs font-medium">Order</label>
            {isReadOnly ? (
              <Input
                type="text"
                value={editedChange?.change_order ?? ""}
                readOnly
                className="h-8 w-20 text-center text-xs"
              />
            ) : (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => handleOrderStep(-1)}
                  disabled={isSubmitting}
                  title="Decrease order"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Input
                  type="text"
                  inputMode="numeric"
                  name="change_order"
                  value={editedChange?.change_order ?? ""}
                  onChange={handleInputChange}
                  className="h-8 w-16 text-center text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => handleOrderStep(1)}
                  disabled={isSubmitting}
                  title="Increase order"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
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
              <Select
                value={editedChange?.change_type ?? ""}
                onValueChange={(value) =>
                  editedChange &&
                  setEditedChange({ ...editedChange, change_type: value })
                }
              >
                <SelectTrigger className="h-8 w-full text-xs">
                  <SelectValue placeholder="Select a type..." />
                </SelectTrigger>
                <SelectContent>
                  {changeTypes.map((t) => (
                    <SelectItem key={t.change} value={t.change}>
                      {t.change}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <div className="mb-0.5 flex items-center justify-between">
              <label className="block text-xs font-medium">Change</label>
              {!isReadOnly && (
                <AdminHtmlLinkInserters
                  songs={songs}
                  onInsert={insertChangeAtCursor}
                  showInsertShow={false}
                  showInsertArrow
                />
              )}
            </div>
            <textarea
              ref={changeTextareaRef}
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
