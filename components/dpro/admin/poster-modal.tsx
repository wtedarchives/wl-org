"use client"

import { useCallback, useEffect, useState } from "react"
import { Save, Trash2, X } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import { uploadShowPosterImage } from "@/lib/show-poster-upload"
import { supabase } from "@/lib/supabase"
import type { ShowData, ShowPosterArtist, ShowPosterRecord, TourData } from "@/types/admin"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PosterFormFields } from "./poster-form-fields"
import {
  emptyPosterForm,
  posterFormToPayload,
  posterRecordToForm,
  type PosterFormFields as PosterFormState,
} from "./poster-modal-form"

const SHOW_PAGE_SIZE = 1000

interface PosterModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  record: ShowPosterRecord | null
  isAddMode: boolean
  /** Unique artists already on posters (for quick-pick). */
  knownArtists: ShowPosterArtist[]
}

function formatAuthError(message: string): string {
  if (/invalid or expired wysteria session/i.test(message) || /unauthorized/i.test(message)) {
    return "Your session expired. Sign out and sign back in, then try again."
  }
  return message
}

export function PosterModal({
  isOpen,
  onClose,
  onSave,
  record,
  isAddMode,
  knownArtists,
}: PosterModalProps) {
  const { session } = useAuth()
  const token = session?.token ?? null
  const [formData, setFormData] = useState<PosterFormState>(emptyPosterForm())
  const [shows, setShows] = useState<ShowData[]>([])
  const [tours, setTours] = useState<TourData[]>([])
  const [showsLoading, setShowsLoading] = useState(false)
  const [showsLoadingProgress, setShowsLoadingProgress] = useState(0)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadReferenceData = useCallback(async () => {
    if (!supabase) return
    setShowsLoading(true)
    setShowsLoadingProgress(5)
    try {
      const { data: toursData } = await supabase
        .from("tours")
        .select("tour, tour_canonid")
        .order("tour_canonid", { ascending: true })
      setTours((toursData as TourData[]) || [])

      let allShows: ShowData[] = []
      let page = 0
      let hasMore = true
      while (hasMore) {
        const { data, error: qErr } = await supabase
          .from("shows")
          .select(
            "show_id, show_date, show_group, show_subvenue, show_venue_location, show_canonid",
          )
          .order("show_date", { ascending: false })
          .order("show_canonid", { ascending: false })
          .range(page * SHOW_PAGE_SIZE, (page + 1) * SHOW_PAGE_SIZE - 1)
        if (qErr) throw qErr
        if (data?.length) {
          allShows = [...allShows, ...(data as ShowData[])]
          page++
          setShowsLoadingProgress(Math.min(95, 5 + page * 15))
          hasMore = data.length === SHOW_PAGE_SIZE
        } else {
          hasMore = false
        }
      }
      setShows(allShows)
      setShowsLoadingProgress(100)
    } catch (e) {
      console.error("Error loading poster reference data:", e)
    } finally {
      setTimeout(() => {
        setShowsLoading(false)
        setShowsLoadingProgress(0)
      }, 200)
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    void loadReferenceData()
  }, [isOpen, loadReferenceData])

  useEffect(() => {
    if (record && !isAddMode) {
      setFormData(posterRecordToForm(record))
    } else if (isAddMode) {
      setFormData(emptyPosterForm())
    }
  }, [record, isAddMode])

  useEffect(() => {
    if (!isOpen) {
      setShowDeleteConfirm(false)
      setError(null)
    }
  }, [isOpen])

  const handleImageFile = async (file: File | null) => {
    if (!file) return
    if (!token) {
      setError("You must be signed in to upload images.")
      return
    }
    setUploading(true)
    setError(null)
    try {
      const { publicUrl, error: upErr } = await uploadShowPosterImage(token, file)
      if (upErr) throw new Error(upErr)
      if (!publicUrl) throw new Error("Upload did not return a URL")
      setFormData((prev) => ({ ...prev, image: publicUrl }))
    } catch (err) {
      console.error("Poster image upload failed:", err)
      setError(
        formatAuthError(
          err instanceof Error ? err.message : "Image upload failed",
        ),
      )
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!token) {
      setError("You must be signed in")
      return
    }
    const printRaw = formData.print_run.trim()
    if (printRaw !== "" && Number.isNaN(Number.parseInt(printRaw, 10))) {
      setError("Print run must be a whole number.")
      return
    }

    setSaving(true)
    setError(null)
    try {
      const payload = posterFormToPayload(formData)
      if (isAddMode) {
        const { error: insErr } = await invokeDproAdmin(token, {
          action: "show_posters_insert",
          row: payload,
        })
        if (insErr) throw new Error(insErr)
      } else if (record) {
        const { error: updErr } = await invokeDproAdmin(token, {
          action: "show_posters_update",
          uuid: record.uuid,
          patch: payload,
        })
        if (updErr) throw new Error(updErr)
      }
      onSave()
    } catch (err) {
      console.error("Error saving poster:", err)
      setError(
        formatAuthError(
          err instanceof Error ? err.message : "Failed to save poster",
        ),
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!record || !token) return
    setDeleting(true)
    setError(null)
    try {
      const { error: delErr } = await invokeDproAdmin(token, {
        action: "show_posters_delete",
        uuid: record.uuid,
      })
      if (delErr) throw new Error(delErr)
      onSave()
    } catch (err) {
      console.error("Error deleting poster:", err)
      setError("Failed to delete poster.")
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100%-1.5rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="shrink-0 border-b border-border px-4 py-3 sm:px-5">
          <div className="flex items-start justify-between gap-2">
            <DialogTitle className="text-base">
              {isAddMode ? "Add poster" : "Edit poster"}
            </DialogTitle>
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-9 shrink-0 p-0"
                aria-label="Close"
              >
                <X className="size-4" aria-hidden />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <PosterFormFields
            formData={formData}
            setFormData={setFormData}
            shows={shows}
            tours={tours}
            knownArtists={knownArtists}
            showsLoading={showsLoading}
            showsLoadingProgress={showsLoadingProgress}
            uploading={uploading}
            onImageFile={(file) => void handleImageFile(file)}
            error={error}
          />
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 sm:px-5">
          <div>
            {!isAddMode && record ? (
              showDeleteConfirm ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-destructive">Delete?</span>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="h-9 text-xs sm:h-8"
                    disabled={deleting}
                    onClick={() => void handleDelete()}
                  >
                    {deleting ? "Deleting…" : "Confirm"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 text-xs sm:h-8"
                    disabled={deleting}
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 gap-1 text-xs text-destructive sm:h-8"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Delete
                </Button>
              )
            ) : null}
          </div>
          <Button
            type="button"
            size="sm"
            className="h-11 min-w-[5.5rem] gap-1 sm:h-8"
            disabled={saving || uploading}
            onClick={() => void handleSave()}
          >
            <Save className="size-3.5" aria-hidden />
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
