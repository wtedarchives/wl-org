"use client"

import React, { useState, useEffect } from "react"
import { X, Save, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Release {
  release_id: string
  release: string
  release_displayname: string
  release_service: string | null
}

interface ShowReleaseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  showId: string
  mode: "add" | "edit"
  existingReleaseId?: string
  existingOrder?: number
}

const PAGE_SIZE = 1000

export function ShowReleaseModal({
  isOpen,
  onClose,
  onSave,
  showId,
  mode,
  existingReleaseId,
  existingOrder,
}: ShowReleaseModalProps) {
  const [availableReleases, setAvailableReleases] = useState<Release[]>([])
  const [allAssociatedReleaseIds, setAllAssociatedReleaseIds] = useState<
    Set<string>
  >(new Set())
  const [selectedReleaseId, setSelectedReleaseId] = useState(
    existingReleaseId ?? ""
  )
  const [releaseOrder, setReleaseOrder] = useState(existingOrder ?? 1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (isOpen && mode === "add") fetchAvailableReleases()
    if (mode === "edit" && existingReleaseId && existingOrder !== undefined) {
      setSelectedReleaseId(existingReleaseId)
      setReleaseOrder(existingOrder)
    }
  }, [isOpen, mode, existingReleaseId, existingOrder])

  const fetchAvailableReleases = async () => {
    if (!supabase) return
    setLoading(true)
    try {
      let allReleases: Release[] = []
      let page = 0
      let hasMore = true
      while (hasMore) {
        const { data, error: err } = await supabase
          .from("releases")
          .select(
            "release_id, release, release_displayname, release_service"
          )
          .order("release_displayname", { ascending: true })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
        if (err) throw err
        if (data?.length) {
          allReleases = [...allReleases, ...data]
          page++
          hasMore = data.length === PAGE_SIZE
        } else {
          hasMore = false
        }
      }
      let allShowReleases: { release_id: string }[] = []
      let ap = 0
      let hasMoreA = true
      while (hasMoreA) {
        const { data, error: err } = await supabase
          .from("releases_shows")
          .select("release_id")
          .range(ap * PAGE_SIZE, (ap + 1) * PAGE_SIZE - 1)
        if (err) throw err
        if (data?.length) {
          allShowReleases = [...allShowReleases, ...data]
          ap++
          hasMoreA = data.length === PAGE_SIZE
        } else {
          hasMoreA = false
        }
      }
      const { data: thisShowReleases } = await supabase
        .from("releases_shows")
        .select("release_id")
        .eq("show_id", showId)
      const allIds = new Set(allShowReleases?.map((r) => r.release_id) ?? [])
      const thisIds = new Set(thisShowReleases?.map((r) => r.release_id) ?? [])
      const available = allReleases.filter((r) => !thisIds.has(r.release_id))
      const sorted = available.sort((a, b) => {
        const aA = allIds.has(a.release_id)
        const bA = allIds.has(b.release_id)
        if (!aA && bA) return -1
        if (aA && !bA) return 1
        const aD = a.release_service ? `${a.release_service} - ${a.release}` : a.release
        const bD = b.release_service ? `${b.release_service} - ${b.release}` : b.release
        return aD.localeCompare(bD)
      })
      setAvailableReleases(sorted)
      setAllAssociatedReleaseIds(allIds)
    } catch (err) {
      console.error("Error fetching releases:", err)
      setError("Failed to load available releases")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!supabase) return
    if (!selectedReleaseId || !releaseOrder) {
      setError("Please select a release and enter an order number")
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (mode === "add") {
        const { error: err } = await supabase.from("releases_shows").insert({
          release_id: selectedReleaseId,
          show_id: showId,
          release_order: releaseOrder,
        })
        if (err) throw err
      } else {
        const { error: err } = await supabase
          .from("releases_shows")
          .update({ release_order: releaseOrder })
          .eq("release_id", existingReleaseId)
          .eq("show_id", showId)
        if (err) throw err
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
    if (!existingReleaseId || !supabase) return
    setDeleting(true)
    setError(null)
    try {
      const { error: err } = await supabase
        .from("releases_shows")
        .delete()
        .eq("release_id", existingReleaseId)
        .eq("show_id", showId)
      if (err) throw err
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "add"
              ? "Add Release to Show"
              : "Edit Release Order"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || (mode === "add" && !selectedReleaseId)}
          >
            <Save className="size-4" />
            {saving && "..."}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
        {error && (
          <div className="rounded border border-destructive/50 bg-destructive/10 px-2 py-1 text-xs text-destructive">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {mode === "add" ? (
            <div className="md:col-span-2">
              <label className="mb-0.5 block text-xs font-medium">
                Select Release <span className="text-destructive">*</span>
              </label>
              {loading ? (
                <div className="flex items-center justify-center p-3">
                  <div className="flex gap-2">
                    <div className="size-3 animate-pulse rounded-lg bg-muted" />
                    <div className="size-3 animate-pulse rounded-lg bg-muted [animation-delay:150ms]" />
                    <div className="size-3 animate-pulse rounded-lg bg-muted [animation-delay:300ms]" />
                  </div>
                </div>
              ) : (
                <select
                  value={selectedReleaseId}
                  onChange={(e) => setSelectedReleaseId(e.target.value)}
                  className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="">-- Select a release --</option>
                  {availableReleases.map((r, i) => {
                    const isFirst =
                      i > 0 &&
                      !allAssociatedReleaseIds.has(
                        availableReleases[i - 1].release_id
                      ) &&
                      allAssociatedReleaseIds.has(r.release_id)
                    return (
                      <React.Fragment key={r.release_id}>
                        {isFirst && (
                          <option disabled>
                            ──────── Already in other shows ────────
                          </option>
                        )}
                        <option value={r.release_id}>
                          {r.release_service
                            ? `${r.release_service} - ${r.release}`
                            : r.release}
                        </option>
                      </React.Fragment>
                    )
                  })}
                </select>
              )}
            </div>
          ) : (
            <div className="md:col-span-2">
              <label className="mb-0.5 block text-xs font-medium">
                Release
              </label>
              <Input
                value={existingReleaseId ?? ""}
                disabled
                className="h-8 text-xs"
              />
            </div>
          )}
          <div className="md:col-span-2">
            <label className="mb-0.5 block text-xs font-medium">
              Release Order <span className="text-destructive">*</span>
            </label>
            <Input
              type="number"
              min={1}
              value={releaseOrder}
              onChange={(e) =>
                setReleaseOrder(parseInt(e.target.value) || 1)
              }
              className="h-8 text-xs"
              placeholder="Enter order number"
            />
            <p className="mt-0.5 text-xs text-muted-foreground">
              Lower numbers appear first in the list
            </p>
          </div>
          {mode === "edit" && (
            <div className="md:col-span-2">
              {showDeleteConfirm ? (
                <div className="flex gap-2">
                  <span className="text-xs">Are you sure?</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Yes, Delete"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
