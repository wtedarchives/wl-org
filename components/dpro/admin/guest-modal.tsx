"use client"

import { useState, useEffect } from "react"
import { Save, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
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

interface GuestData {
  guest: string
  guest_id: string
  guest_displayname: string | null
  guest_instrument: string | null
  guest_category: string | null
  guest_canonid: number | null
}

interface GuestModalProps {
  isOpen: boolean
  onClose: () => void
  guest: GuestData | null
  onSave: () => void
  isNewGuest: boolean
}

const GUEST_CATEGORIES = [
  "Goose (current)",
  "Goose (former)",
  "Group",
  "Guest",
]

export function GuestModal({
  isOpen,
  onClose,
  guest,
  onSave,
  isNewGuest,
}: GuestModalProps) {
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
    if (!supabase) return
    setIsSubmitting(true)
    setError(null)
    try {
      if (!formData.guest) throw new Error("Guest name is required")
      if (!formData.guest_category) throw new Error("Category is required")
      if (isNewGuest) {
        const { data: highest } = await supabase
          .from("guests")
          .select("guest_canonid")
          .eq("guest_category", formData.guest_category)
          .order("guest_canonid", { ascending: false })
          .limit(1)
        const nextCanonId =
          highest?.length && highest[0].guest_canonid
            ? highest[0].guest_canonid + 1
            : 1
        const { error: insertError } = await supabase.from("guests").insert({
          guest: formData.guest,
          guest_displayname: formData.guest_displayname || null,
          guest_instrument: formData.guest_instrument || null,
          guest_category: formData.guest_category,
          guest_canonid: nextCanonId,
        })
        if (insertError) throw insertError
      } else if (guest) {
        const { error: updateError } = await supabase
          .from("guests")
          .update({
            guest: formData.guest,
            guest_displayname: formData.guest_displayname || null,
            guest_instrument: formData.guest_instrument || null,
            guest_category: formData.guest_category,
          })
          .eq("guest_id", guest.guest_id)
        if (updateError) throw updateError
      }
      onSave()
      onClose()
    } catch (err) {
      console.error("Error saving guest:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isNewGuest ? "Add New Guest" : "Edit Guest"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button size="sm" onClick={handleSubmit} disabled={isSubmitting}>
            <Save className="size-4" />
            {isSubmitting && "..."}
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
        <div className="space-y-2">
          <div>
            <label className="mb-0.5 block text-xs font-medium">
              Guest Name <span className="text-destructive">*</span>
            </label>
            <Input
              name="guest"
              value={formData.guest ?? ""}
              onChange={handleInputChange}
              className="h-8 text-xs"
              required
            />
          </div>
          <div>
            <label className="mb-0.5 block text-xs font-medium">
              Display Name
            </label>
            <Input
              name="guest_displayname"
              value={formData.guest_displayname ?? ""}
              onChange={handleInputChange}
              className="h-8 text-xs"
            />
          </div>
          <div>
            <label className="mb-0.5 block text-xs font-medium">
              Instrument
            </label>
            <Input
              name="guest_instrument"
              value={formData.guest_instrument ?? ""}
              onChange={handleInputChange}
              className="h-8 text-xs"
            />
          </div>
          <div>
            <label className="mb-0.5 block text-xs font-medium">
              Category <span className="text-destructive">*</span>
            </label>
            <Select
              value={formData.guest_category ?? ""}
              onValueChange={(v) =>
                setFormData((prev) => ({ ...prev, guest_category: v }))
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="-- Select Category --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">-- Select Category --</SelectItem>
                {GUEST_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isNewGuest && (
            <p className="text-xs italic text-muted-foreground">
              Canon ID will be automatically assigned based on the selected
              category.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
