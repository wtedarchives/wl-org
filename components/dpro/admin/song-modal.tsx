"use client"

import { useState, useEffect } from "react"
import { Save, X } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import type { SongDataFull } from "@/types/admin"
import {
  Dialog,
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

interface SongModalProps {
  isOpen: boolean
  onClose: () => void
  song?: SongDataFull | null
  onSave: () => void
  isNewSong?: boolean
}

export function SongModal({
  isOpen,
  onClose,
  song,
  onSave,
  isNewSong = false,
}: SongModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editedSong, setEditedSong] = useState<SongDataFull | null>(null)
  const [categories, setCategories] = useState<{ category: string }[]>([])
  const [artists, setArtists] = useState<{ artist: string }[]>([])

  useEffect(() => {
    if (supabase) {
      supabase
        .from("categories")
        .select("category")
        .order("category", { ascending: true })
        .then(({ data }) => setCategories(data || []))
      supabase
        .from("artists")
        .select("artist")
        .order("artist", { ascending: true })
        .then(({ data }) => setArtists(data || []))
    }
  }, [])

  useEffect(() => {
    if (isNewSong) {
      setEditedSong({
        song: "",
        song_id: "",
        song_displayname: "",
        song_category: "",
        song_originalartist: "",
        song_categoryorder: null,
        song_coachnotes: "",
      })
    } else if (song) {
      setEditedSong(song)
    }
  }, [song, isNewSong])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (!editedSong) return
    const { name, value } = e.target
    setEditedSong({
      ...editedSong,
      [name]:
        name === "song_categoryorder"
          ? value === ""
            ? null
            : (() => {
                const n = parseInt(value, 10)
                return Number.isNaN(n) ? null : n
              })()
          : value,
    })
  }

  const handleSaveChanges = async () => {
    if (!editedSong || !supabase) return
    setIsSubmitting(true)
    try {
      const displayName =
        (editedSong.song_displayname ?? "").trim() || null
      if (!displayName) {
        throw new Error("Display Name is required")
      }
      const songToSave = {
        ...editedSong,
        song_displayname: displayName,
        song_category: editedSong.song_category === "" ? null : editedSong.song_category,
        song_originalartist:
          editedSong.song_originalartist === ""
            ? null
            : editedSong.song_originalartist,
        song_coachnotes:
          editedSong.song_coachnotes === "" ? null : editedSong.song_coachnotes,
      }
      if (isNewSong) {
        const { error } = await supabase.from("songs").insert({
          song: songToSave.song,
          song_displayname: songToSave.song_displayname,
          song_category: songToSave.song_category,
          song_originalartist: songToSave.song_originalartist,
          song_categoryorder: songToSave.song_categoryorder,
          song_coachnotes: songToSave.song_coachnotes,
        })
        if (error) throw error
      } else {
        const { error } = await supabase.rpc("update_song", {
          song_id_param: songToSave.song_id,
          song_param: songToSave.song,
          song_displayname_param: songToSave.song_displayname,
          song_category_param: songToSave.song_category,
          song_originalartist_param: songToSave.song_originalartist,
          song_categoryorder_param: songToSave.song_categoryorder,
          song_coachnotes_param: songToSave.song_coachnotes,
        })
        if (error) throw error
      }
      onSave()
      onClose()
    } catch (error) {
      console.error("Error saving song:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to save song"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-h-[90vh] max-w-3xl overflow-y-auto sm:max-w-3xl"
        showCloseButton={false}
      >
        <div className="flex items-center justify-between">
          <DialogHeader>
            <DialogTitle>
              {isNewSong ? "Add New Song" : "Edit Song"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSaveChanges}
              disabled={isSubmitting}
            >
              <Save className="size-4" />
              {isSubmitting && "..."}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <div>
            <label className="mb-0.5 block text-xs font-medium">
              Song Title
            </label>
            <Input
              type="text"
              name="song"
              value={editedSong?.song ?? ""}
              onChange={handleInputChange}
              className="h-8 text-xs"
              placeholder="Enter song title"
              required
            />
          </div>
          <div>
            <label className="mb-0.5 block text-xs font-medium">
              Display Name
            </label>
            <Input
              type="text"
              name="song_displayname"
              value={editedSong?.song_displayname ?? ""}
              onChange={handleInputChange}
              className="h-8 text-xs"
              placeholder="Enter display name"
              required
            />
          </div>
          <div>
            <label className="mb-0.5 block text-xs font-medium">
              Original Artist
            </label>
            <Select
              value={editedSong?.song_originalartist || "__none__"}
              onValueChange={(v) =>
                handleInputChange({
                  target: {
                    name: "song_originalartist",
                    value: v === "__none__" ? "" : v,
                  },
                } as React.ChangeEvent<HTMLSelectElement>)
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="-- Select Artist --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">-- Select Artist --</SelectItem>
                {artists.map((a) => (
                  <SelectItem key={a.artist} value={a.artist}>
                    {a.artist}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-0.5 block text-xs font-medium">Category</label>
            <Select
              value={editedSong?.song_category || "__none__"}
              onValueChange={(v) =>
                handleInputChange({
                  target: {
                    name: "song_category",
                    value: v === "__none__" ? "" : v,
                  },
                } as React.ChangeEvent<HTMLSelectElement>)
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="-- Select Category --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">-- Select Category --</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.category} value={c.category}>
                    {c.category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-0.5 block text-xs font-medium">
              Category Order
            </label>
            <Input
              type="text"
              name="song_categoryorder"
              value={
                editedSong?.song_categoryorder === null
                  ? ""
                  : editedSong?.song_categoryorder ?? ""
              }
              onChange={handleInputChange}
              className="h-8 text-xs"
              placeholder="Enter order number"
            />
          </div>
          <div className="md:col-span-3">
            <label className="mb-0.5 block text-xs font-medium">
              Coach&apos;s Notes
            </label>
            <textarea
              name="song_coachnotes"
              value={editedSong?.song_coachnotes ?? ""}
              onChange={handleInputChange}
              rows={4}
              className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Add notes here..."
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
