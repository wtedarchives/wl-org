"use client"

import { useState, useEffect } from "react"
import { X, Save } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import type { ReleaseData } from "@/types/admin"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ReleaseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  release: ReleaseData | null
  isAddMode: boolean
}

export function ReleaseModal({
  isOpen,
  onClose,
  onSave,
  release,
  isAddMode,
}: ReleaseModalProps) {
  const { session } = useAuth()
  const token = session?.token ?? null
  const [formData, setFormData] = useState<
    Omit<ReleaseData, "release_id">
  >({
    release: "",
    release_displayname: "",
    release_link: "",
    release_service: "",
    release_artwork: "",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (release && !isAddMode) {
      setFormData({
        release: release.release,
        release_displayname: release.release_displayname,
        release_link: release.release_link || "",
        release_service: release.release_service || "",
        release_artwork: release.release_artwork || "",
      })
    } else if (isAddMode) {
      setFormData({
        release: "",
        release_displayname: "",
        release_link: "",
        release_service: "",
        release_artwork: "",
      })
    }
  }, [release, isAddMode])

  const handleInputChange = (
    field: keyof Omit<ReleaseData, "release_id">,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!formData.release || !formData.release_displayname) {
      setError("Release and Display Name are required fields")
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (!token) throw new Error("You must be signed in")
      if (isAddMode) {
        const { error } = await invokeDproAdmin(token, {
          action: "releases_insert",
          row: {
            release: formData.release,
            release_displayname: formData.release_displayname,
            release_link: formData.release_link || null,
            release_service: formData.release_service || null,
            release_artwork: formData.release_artwork || null,
          },
        })
        if (error) throw new Error(error)
      } else if (release) {
        const { error } = await invokeDproAdmin(token, {
          action: "releases_update",
          release_id: release.release_id,
          patch: {
            release: formData.release,
            release_displayname: formData.release_displayname,
            release_link: formData.release_link || null,
            release_service: formData.release_service || null,
            release_artwork: formData.release_artwork || null,
          },
        })
        if (error) throw new Error(error)
      }
      onSave()
    } catch (err) {
      console.error("Error saving release:", err)
      setError("Failed to save release. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!release || !token) return
    setDeleting(true)
    setError(null)
    try {
      const { error } = await invokeDproAdmin(token, {
        action: "releases_delete",
        release_id: release.release_id,
      })
      if (error) throw new Error(error)
      onSave()
    } catch (err) {
      console.error("Error deleting release:", err)
      setError("Failed to delete release. Please try again.")
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-md max-h-[90vh] overflow-y-auto"
        showCloseButton={false}
      >
        <DialogHeader className="flex flex-row items-center justify-between gap-4">
          <DialogTitle>
            {isAddMode ? "Add New Release" : "Edit Release"}
          </DialogTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="default"
              size="icon-sm"
              onClick={handleSave}
              disabled={saving}
              title="Save"
            >
              <Save className="size-4" />
            </Button>
            <DialogClose asChild>
              <Button variant="ghost" size="icon-sm" title="Close">
                <X className="size-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <div className="rounded border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            {!isAddMode && release && (
              <div>
                <label className="mb-0.5 block text-xs font-medium">
                  Release ID
                </label>
                <Input
                  value={release.release_id}
                  disabled
                  className="h-8 text-xs"
                />
              </div>
            )}
            <div>
              <label className="mb-0.5 block text-xs font-medium">
                Release <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.release}
                onChange={(e) => handleInputChange("release", e.target.value)}
                placeholder="Enter release name"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="mb-0.5 block text-xs font-medium">
                Display Name <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.release_displayname}
                onChange={(e) =>
                  handleInputChange("release_displayname", e.target.value)
                }
                placeholder="Enter display name"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="mb-0.5 block text-xs font-medium">
                Release Link
              </label>
              <Input
                value={formData.release_link ?? ""}
                onChange={(e) =>
                  handleInputChange("release_link", e.target.value)
                }
                placeholder="Enter release link URL"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <div className="mb-0.5 flex items-center justify-between">
                <label className="text-xs font-medium">Service</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (formData.release_link) {
                      const link = formData.release_link.toLowerCase()
                      let service = ""
                      if (link.includes("bandcamp.com")) service = "Bandcamp"
                      else if (link.includes("youtube.com")) service = "YouTube"
                      else if (link.includes("nugsnet")) service = "nugs"
                      else if (link.includes("spotify.com")) service = "Spotify"
                      if (service) handleInputChange("release_service", service)
                    }
                  }}
                  className="text-xs"
                >
                  Auto-detect Service
                </Button>
              </div>
              <Input
                value={formData.release_service ?? ""}
                onChange={(e) =>
                  handleInputChange("release_service", e.target.value)
                }
                placeholder="e.g., Spotify, Apple Music"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <div className="mb-0.5 flex items-center justify-between">
                <label className="text-xs font-medium">Artwork URL</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (
                      formData.release_link &&
                      formData.release_link.length >= 11
                    ) {
                      const videoId = formData.release_link.slice(-11)
                      handleInputChange(
                        "release_artwork",
                        `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
                      )
                    }
                  }}
                  className="text-xs"
                >
                  YouTube Thumbnail
                </Button>
              </div>
              <Input
                value={formData.release_artwork ?? ""}
                onChange={(e) =>
                  handleInputChange("release_artwork", e.target.value)
                }
                placeholder="Enter artwork URL"
                className="h-8 text-xs"
              />
              {formData.release_artwork && (
                <div className="mt-1">
                  <img
                    src={formData.release_artwork}
                    alt="Release artwork preview"
                    className="h-32 object-cover rounded border"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = "none"
                    }}
                  />
                </div>
              )}
            </div>
            {!isAddMode && release && (
              <div>
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
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
                    Delete
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
