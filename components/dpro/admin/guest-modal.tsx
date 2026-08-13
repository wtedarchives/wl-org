"use client"

import { useState, useEffect } from "react"
import { Save, X } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
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
import { GUEST_CATEGORIES } from "@/constants/guest-categories"
import type { GuestData } from "./admin-guest-dropdown"

interface GuestModalProps {
  isOpen: boolean
  onClose: () => void
  guest: GuestData | null
  onSave: () => void
  isNewGuest: boolean
}

export function GuestModal({
  isOpen,
  onClose,
  guest,
  onSave,
  isNewGuest,
}: GuestModalProps) {
  const { session } = useAuth()
  const token = session?.token ?? null
  const [formData, setFormData] = useState<Partial<GuestData>>({
    guest: "",
    guest_displayname: "",
    guest_instrument: "",
    guest_category: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      if (isNewGuest) {
        setFormData({
          guest: "",
          guest_displayname: "",
          guest_instrument: "",
          guest_category: "",
        })
        setError(null)
      } else if (guest) {
        setFormData({
          guest: guest.guest ?? "",
          guest_displayname: guest.guest_displayname ?? "",
          guest_instrument: guest.guest_instrument ?? "",
          guest_category: guest.guest_category ?? "",
        })
        setError(null)
      }
    }
  }, [isOpen, isNewGuest, guest])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    if (!token) return
    setIsSubmitting(true)
    setError(null)
    try {
      if (!formData.guest) throw new Error("Guest name is required")
      if (!formData.guest_category) throw new Error("Category is required")
      if (isNewGuest) {
        const { error: insertError } = await invokeDproAdmin(token, {
          action: "guests_insert_new",
          guest: formData.guest,
          guest_displayname: formData.guest_displayname || null,
          guest_instrument: formData.guest_instrument || null,
          guest_category: formData.guest_category,
        })
        if (insertError) throw new Error(insertError)
      } else if (guest) {
        const { error: updateError } = await invokeDproAdmin(token, {
          action: "guests_update",
          guest_id: guest.guest_id,
          patch: {
            guest: formData.guest,
            guest_displayname: formData.guest_displayname || null,
            guest_instrument: formData.guest_instrument || null,
            guest_category: formData.guest_category,
          },
        })
        if (updateError) throw new Error(updateError)
      }
      onSave()
      onClose()
    } catch (err) {
      console.error("Error saving guest:", err)
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
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
              {isNewGuest ? "Add New Personnel" : "Edit Personnel"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSubmit} disabled={isSubmitting}>
              <Save className="size-4" />
              {isSubmitting && "..."}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>
        </div>
        {error && (
          <div className="rounded border border-destructive/50 bg-destructive/10 px-2 py-1 text-xs text-destructive">
            {error}
          </div>
        )}
        <div className="wl-home-v2-archive-admin-song-form">
          <div className="wl-home-v2-archive-admin-song-form__grid">
            <div className="min-w-0">
              <label htmlFor="guest-modal-name">
                Guest Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="guest-modal-name"
                name="guest"
                value={formData.guest ?? ""}
                onChange={handleInputChange}
                placeholder="Enter personnel name"
                required
              />
            </div>
            <div className="min-w-0">
              <label htmlFor="guest-modal-displayname">Display Name</label>
              <Input
                id="guest-modal-displayname"
                name="guest_displayname"
                value={formData.guest_displayname ?? ""}
                onChange={handleInputChange}
                placeholder="Enter display name"
              />
            </div>
            <div className="min-w-0">
              <label htmlFor="guest-modal-instrument">Instrument</label>
              <Input
                id="guest-modal-instrument"
                name="guest_instrument"
                value={formData.guest_instrument ?? ""}
                onChange={handleInputChange}
                placeholder="Enter instrument"
              />
            </div>
            <div className="min-w-0">
              <label htmlFor="guest-modal-category">
                Category <span className="text-destructive">*</span>
              </label>
              <Select
                value={formData.guest_category || "__none__"}
                onValueChange={(v) =>
                  setFormData((prev) => ({
                    ...prev,
                    guest_category: v === "__none__" ? "" : v,
                  }))
                }
              >
                <SelectTrigger id="guest-modal-category" size="sm">
                  <SelectValue placeholder="-- Select Category --" />
                </SelectTrigger>
                <SelectContent className="wl-home-v2-archive-admin-portal-content">
                  <SelectItem value="__none__">-- Select Category --</SelectItem>
                  {GUEST_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isNewGuest && (
              <p className="wl-home-v2-archive-admin-song-form__notes text-xs text-muted-foreground">
                Canon ID will be automatically assigned based on the selected
                category.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
