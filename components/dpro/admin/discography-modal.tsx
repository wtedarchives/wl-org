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
import { DiscographyEntriesPanel } from "./discography-entries-panel"
import { cn } from "@/lib/utils"
import {
  emptyDiscographyForm,
  discographyRecordToForm,
  type DiscographyFormFields,
} from "@/components/dpro/admin/discography-modal-form"
import { DiscographyModalDetailsFields } from "@/components/dpro/admin/discography-modal-details-fields"

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
  const [formData, setFormData] = useState<DiscographyFormFields>(
    emptyDiscographyForm(),
  )
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
      setFormData(discographyRecordToForm(record))
    } else if (isAddMode) {
      setFormData(emptyDiscographyForm())
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
    <DiscographyModalDetailsFields
      error={error}
      isAddMode={isAddMode}
      record={record}
      formData={formData}
      setField={setField}
      categoryOptions={categoryOptions}
    />
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
                isLinksSection && "bg-muted/10",
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
          <div className="space-y-4 overflow-y-auto p-4 sm:p-6">{detailsForm}</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
