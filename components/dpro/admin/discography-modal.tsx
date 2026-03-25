"use client"

import { useState, useEffect, useMemo } from "react"
import { X, Save, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { DiscographyAdminRecord } from "@/types/admin"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DiscographyEntriesPanel } from "./discography-entries-panel"
import { cn } from "@/lib/utils"

type DiscographyFormFields = Omit<DiscographyAdminRecord, "uuid" | "canon_id"> & {
  canon_id: string
}

const emptyForm = (): DiscographyFormFields => ({
  name: "",
  displayname: "",
  artist: "",
  category: "",
  artwork: "",
  canon_id: "0",
  release_date: null,
  coach_notes: null,
})

function recordToForm(row: DiscographyAdminRecord): DiscographyFormFields {
  return {
    name: row.name,
    displayname: row.displayname,
    artist: row.artist,
    category: row.category,
    artwork: row.artwork,
    canon_id: String(row.canon_id),
    release_date: row.release_date,
    coach_notes: row.coach_notes ?? null,
  }
}

interface DiscographyModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  record: DiscographyAdminRecord | null
  isAddMode: boolean
}

export function DiscographyModal({
  isOpen,
  onClose,
  onSave,
  record,
  isAddMode,
}: DiscographyModalProps) {
  const [formData, setFormData] = useState<DiscographyFormFields>(emptyForm)
  const [categories, setCategories] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [activeSection, setActiveSection] = useState<"details" | "links">(
    "details",
  )

  useEffect(() => {
    if (!isOpen || !supabase) return
    void supabase
      .from("discography_categories")
      .select("category")
      .order("category", { ascending: true })
      .then(({ data, error: qErr }) => {
        if (!qErr && data?.length) {
          setCategories(data.map((r) => r.category))
        }
      })
  }, [isOpen])

  useEffect(() => {
    if (record && !isAddMode) {
      setFormData(recordToForm(record))
    } else if (isAddMode) {
      setFormData(emptyForm())
    }
  }, [record, isAddMode])

  useEffect(() => {
    if (!isOpen) {
      setShowDeleteConfirm(false)
      setActiveSection("details")
    }
  }, [isOpen])

  useEffect(() => {
    if (isAddMode) setActiveSection("details")
  }, [isAddMode])

  const categoryOptions = useMemo(() => {
    if (formData.category && !categories.includes(formData.category)) {
      return [...categories, formData.category].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" }),
      )
    }
    return categories
  }, [categories, formData.category])

  const setField = <K extends keyof DiscographyFormFields>(
    field: K,
    value: DiscographyFormFields[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    const name = formData.name.trim()
    const displayname = formData.displayname.trim()
    const artist = formData.artist.trim()
    const category = formData.category.trim()
    const artwork = formData.artwork.trim()
    const canonParsed = Number.parseInt(formData.canon_id, 10)

    if (!name || !displayname || !artist || !category || !artwork) {
      setError("Name, display name, artist, category, and artwork are required.")
      return
    }
    if (Number.isNaN(canonParsed) || canonParsed < 0) {
      setError("Canon ID must be a valid non-negative integer.")
      return
    }

    setSaving(true)
    setError(null)
    try {
      if (!supabase) throw new Error("Supabase not available")

      const payload = {
        name,
        displayname,
        artist,
        category,
        artwork,
        canon_id: canonParsed,
        release_date: formData.release_date?.trim() || null,
        coach_notes: formData.coach_notes?.trim() || null,
      }

      if (isAddMode) {
        const { error: insErr } = await supabase.from("discography").insert([payload])
        if (insErr) throw insErr
      } else if (record) {
        const { error: updErr } = await supabase
          .from("discography")
          .update(payload)
          .eq("uuid", record.uuid)
        if (updErr) throw updErr
      }
      onSave()
    } catch (err: unknown) {
      console.error("Error saving discography:", err)
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to save. Please try again."
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!record || !supabase) return
    setDeleting(true)
    setError(null)
    try {
      const { error: delErr } = await supabase
        .from("discography")
        .delete()
        .eq("uuid", record.uuid)
      if (delErr) throw delErr
      onSave()
    } catch (err: unknown) {
      console.error("Error deleting discography:", err)
      setError("Failed to delete. It may be referenced elsewhere.")
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const isEdit = !isAddMode && !!record
  const isLinksSection = activeSection === "links"

  const detailsForm = (
    <>
      {error && (
        <div className="rounded border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      <div className="space-y-2">
        {!isAddMode && record && (
          <div>
            <label className="mb-0.5 block text-xs font-medium">UUID</label>
            <Input value={record.uuid} disabled className="h-8 text-xs" />
          </div>
        )}
        <div>
          <label className="mb-0.5 block text-xs font-medium">
            Name (search key) <span className="text-destructive">*</span>
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="Internal / canonical name"
            className="h-8 text-xs"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-xs font-medium">
            Display name <span className="text-destructive">*</span>
          </label>
          <Input
            value={formData.displayname}
            onChange={(e) => setField("displayname", e.target.value)}
            placeholder="Public display name"
            className="h-8 text-xs"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-xs font-medium">
            Artist <span className="text-destructive">*</span>
          </label>
          <Input
            value={formData.artist}
            onChange={(e) => setField("artist", e.target.value)}
            placeholder="Artist"
            className="h-8 text-xs"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-xs font-medium">
            Category <span className="text-destructive">*</span>
          </label>
          <Select
            value={formData.category || undefined}
            onValueChange={(v) => setField("category", v)}
          >
            <SelectTrigger className="h-8 w-full text-xs">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((c) => (
                <SelectItem key={c} value={c} className="text-xs">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {categoryOptions.length === 0 && (
            <p className="mt-1 text-[10px] text-muted-foreground">
              No categories loaded. Check discography_categories in Supabase.
            </p>
          )}
        </div>
        <div>
          <label className="mb-0.5 block text-xs font-medium">
            Artwork URL <span className="text-destructive">*</span>
          </label>
          <Input
            value={formData.artwork}
            onChange={(e) => setField("artwork", e.target.value)}
            placeholder="Image URL"
            className="h-8 text-xs"
          />
          {formData.artwork ? (
            <div className="mt-1 w-max max-w-xs">
              <img
                src={formData.artwork}
                alt=""
                className="block h-auto max-h-48 w-auto max-w-full rounded border border-border bg-muted/20"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = "none"
                }}
              />
            </div>
          ) : null}
        </div>
        <div>
          <label className="mb-0.5 block text-xs font-medium">
            Canon ID <span className="text-destructive">*</span>
          </label>
          <Input
            type="number"
            min={0}
            value={formData.canon_id}
            onChange={(e) => setField("canon_id", e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-xs font-medium">
            Release date
          </label>
          <Input
            type="date"
            value={formData.release_date ?? ""}
            onChange={(e) =>
              setField(
                "release_date",
                e.target.value ? e.target.value : null,
              )
            }
            className="h-8 text-xs"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-xs font-medium">
            Coach notes
          </label>
          <Textarea
            value={formData.coach_notes ?? ""}
            onChange={(e) =>
              setField(
                "coach_notes",
                e.target.value === "" ? null : e.target.value,
              )
            }
            placeholder="Optional internal notes"
            className="min-h-20 text-xs"
          />
        </div>
      </div>
    </>
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-none",
          isEdit
            ? "w-full max-w-[calc(100vw-1rem)] overflow-hidden lg:max-w-5xl"
            : "max-w-md overflow-y-auto overflow-x-hidden",
        )}
        showCloseButton={false}
      >
        <div className="shrink-0 border-b border-border px-4 pt-4 pb-3 sm:px-6 sm:pt-6">
          <DialogHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <DialogTitle>
              {isAddMode ? "Add Discography Entry" : "Edit Discography Entry"}
            </DialogTitle>
            <div className="flex shrink-0 items-center gap-1">
              {!isAddMode && record && activeSection === "details" ? (
                !showDeleteConfirm ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    className="border-destructive/50 text-destructive hover:bg-destructive/10"
                    onClick={() => setShowDeleteConfirm(true)}
                    title="Delete discography entry"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      disabled={deleting}
                      onClick={() => void handleDelete()}
                    >
                      {deleting ? "…" : "Delete"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </>
                )
              ) : null}
              {activeSection === "details" ? (
                <Button
                  variant="default"
                  size="icon-sm"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  title="Save"
                >
                  <Save className="size-4" />
                </Button>
              ) : null}
              <DialogClose asChild>
                <Button variant="ghost" size="icon-sm" title="Close">
                  <X className="size-4" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>
        </div>

        {isEdit ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:flex-row">
            <nav
              className="flex shrink-0 flex-row gap-1 border-b border-border p-2 md:w-40 md:flex-col md:border-b-0 md:border-r md:px-3 md:py-4"
              aria-label="Discography editor sections"
            >
              <Button
                type="button"
                variant={activeSection === "details" ? "secondary" : "ghost"}
                className="min-h-11 flex-1 touch-manipulation md:h-10 md:flex-none md:justify-start"
                onClick={() => setActiveSection("details")}
              >
                Details
              </Button>
              <Button
                type="button"
                variant={activeSection === "links" ? "secondary" : "ghost"}
                className="min-h-11 flex-1 touch-manipulation md:h-10 md:flex-none md:justify-start"
                onClick={() => setActiveSection("links")}
              >
                Links
              </Button>
            </nav>
            <div
              className={cn(
                "min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6",
                isLinksSection && "flex flex-col bg-muted/10",
              )}
            >
              {activeSection === "details" ? (
                <div className="space-y-4">{detailsForm}</div>
              ) : record ? (
                <DiscographyEntriesPanel
                  key={record.uuid}
                  discographyUuid={record.uuid}
                />
              ) : null}
            </div>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto p-4 sm:p-6">
            {detailsForm}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
