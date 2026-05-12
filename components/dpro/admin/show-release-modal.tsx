"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/components/auth-context"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import { supabase } from "@/lib/supabase"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { fetchShowReleaseModalReleases } from "@/lib/show-release-modal-fetch"
import type { ShowReleaseModalReleaseRow } from "@/lib/show-release-modal-fetch"
import { ShowReleaseModalForm } from "@/components/dpro/admin/show-release-modal-form"

interface ShowReleaseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  showId: string
  mode: "add" | "edit"
  existingReleaseId?: string
  existingOrder?: number
}

export function ShowReleaseModal({
  isOpen,
  onClose,
  onSave,
  showId,
  mode,
  existingReleaseId,
  existingOrder,
}: ShowReleaseModalProps) {
  const { session } = useAuth()
  const token = session?.token ?? null
  const [availableReleases, setAvailableReleases] = useState<
    ShowReleaseModalReleaseRow[]
  >([])
  const [selectedReleaseId, setSelectedReleaseId] = useState(
    existingReleaseId ?? "",
  )
  const [releaseOrder, setReleaseOrder] = useState(existingOrder ?? 1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const dialogContentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && mode === "add") {
      setSelectedReleaseId("")
      void fetchAvailableReleases()
    }
    if (mode === "edit" && existingReleaseId && existingOrder !== undefined) {
      setSelectedReleaseId(existingReleaseId)
      setReleaseOrder(existingOrder)
    }
  }, [isOpen, mode, existingReleaseId, existingOrder])

  const fetchAvailableReleases = async () => {
    if (!supabase) return
    setLoading(true)
    try {
      const result = await fetchShowReleaseModalReleases(showId)
      setAvailableReleases(result.availableReleases)
      setReleaseOrder(result.nextOrder)
    } catch (err) {
      console.error("Error fetching releases:", err)
      setError("Failed to load available releases")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!supabase) return
    if (!token) {
      setError("You must be signed in.")
      return
    }
    if (!selectedReleaseId || !releaseOrder) {
      setError("Please select a release and enter an order number")
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (mode === "add") {
        const { error: err } = await invokeDproAdmin(token, {
          action: "releases_shows_insert",
          release_id: selectedReleaseId,
          show_id: showId,
          release_order: releaseOrder,
        })
        if (err) throw new Error(err)
      } else {
        const { error: err } = await invokeDproAdmin(token, {
          action: "releases_shows_update",
          release_id: existingReleaseId,
          show_id: showId,
          release_order: releaseOrder,
        })
        if (err) throw new Error(err)
      }
      onSave()
      onClose()
    } catch {
      setError("Failed to save. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!existingReleaseId || !token) return
    setDeleting(true)
    setError(null)
    try {
      const { error: err } = await invokeDproAdmin(token, {
        action: "releases_shows_delete",
        release_id: existingReleaseId,
        show_id: showId,
      })
      if (err) throw new Error(err)
      onSave()
      onClose()
    } catch {
      setError("Failed to delete. Please try again.")
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (!isOpen) return null

  const releaseDisplayLabels = availableReleases.map((r) => {
    const baseLabel =
      r.release_service ? `${r.release_service} - ${r.release}` : r.release
    const sameLabelCount = availableReleases.filter(
      (o) =>
        (o.release_service ? `${o.release_service} - ${o.release}` : o.release) ===
        baseLabel,
    ).length
    const label =
      sameLabelCount > 1 ?
        `${baseLabel} (${r.release_id.slice(0, 8)})`
      : baseLabel
    return { id: r.release_id, label }
  })

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-h-[90vh] max-w-3xl overflow-y-auto sm:max-w-3xl"
        showCloseButton={false}
      >
        <div ref={dialogContentRef} className="contents">
          <ShowReleaseModalForm
            mode={mode}
            dialogContentRef={dialogContentRef}
            error={error}
            loading={loading}
            saving={saving}
            deleting={deleting}
            releaseDisplayLabels={releaseDisplayLabels}
            selectedReleaseId={selectedReleaseId}
            setSelectedReleaseId={setSelectedReleaseId}
            releaseOrder={releaseOrder}
            setReleaseOrder={setReleaseOrder}
            showDeleteConfirm={showDeleteConfirm}
            setShowDeleteConfirm={setShowDeleteConfirm}
            existingReleaseId={existingReleaseId}
            onSave={handleSave}
            onClose={onClose}
            onDelete={handleDelete}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
