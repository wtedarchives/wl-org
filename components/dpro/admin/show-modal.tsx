"use client"

import { useState, useEffect } from "react"
import { Save, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type {
  AdminShowData,
  GroupData,
  TourData,
  SubvenueDisplayData,
  YearData,
} from "@/types/admin"
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

interface ShowModalProps {
  isOpen: boolean
  onClose: () => void
  show: AdminShowData | null
  onSave: () => void
  isNewShow: boolean
  groups: GroupData[]
  tours: TourData[]
  subvenues: SubvenueDisplayData[]
  years: YearData[]
}

export function ShowModal({
  isOpen,
  onClose,
  show,
  onSave,
  isNewShow,
  groups,
  tours,
  subvenues,
  years,
}: ShowModalProps) {
  const [formData, setFormData] = useState<Partial<AdminShowData>>({
    show_date: "",
    show_group: "",
    show_tour: "",
    show_subvenue: "",
    show_iscanon: false,
    show_year: "",
    show_issetlistgame: false,
    show_detail: null,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isNewShow) {
      setFormData({
        show_date: "",
        show_group: "",
        show_tour: "",
        show_subvenue: "",
        show_iscanon: false,
        show_year: "",
        show_issetlistgame: false,
        show_detail: null,
      })
    } else if (show) {
      setFormData(show)
    }
    setErrors({})
  }, [show, isNewShow, isOpen])

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.show_date) newErrors.show_date = "Date is required"
    if (!formData.show_group) newErrors.show_group = "Group is required"
    if (!formData.show_tour) newErrors.show_tour = "Tour is required"
    if (!formData.show_subvenue) newErrors.show_subvenue = "Subvenue is required"
    if (!formData.show_year) newErrors.show_year = "Year is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value === "" ? null : value,
    }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }))
  }

  const handleSubmit = async () => {
    if (!validate() || !supabase) return
    setIsSubmitting(true)
    try {
      if (isNewShow) {
        const { error } = await supabase.from("shows").insert([
          {
            show_date: formData.show_date,
            show_group: formData.show_group,
            show_tour: formData.show_tour,
            show_subvenue: formData.show_subvenue,
            show_iscanon: formData.show_iscanon ?? false,
            show_year: formData.show_year,
            show_issetlistgame: formData.show_issetlistgame ?? false,
            show_detail: formData.show_detail,
          },
        ])
        if (error) throw error
      }
      onSave()
      onClose()
    } catch (error) {
      console.error("Error saving show:", error)
      setErrors({ submit: "Failed to save show. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isNewShow ? "Add New Show" : "Edit Show"}
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
        {errors.submit && (
          <div className="rounded border border-destructive/50 bg-destructive/10 px-2 py-1 text-xs text-destructive">
            {errors.submit}
          </div>
        )}
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <div>
            <label className="mb-0.5 block text-xs font-medium">
              Date <span className="text-destructive">*</span>
            </label>
            <Input
              type="date"
              name="show_date"
              value={formData.show_date ?? ""}
              onChange={handleChange}
              className={`h-8 text-xs ${errors.show_date ? "border-destructive" : ""}`}
            />
            {errors.show_date && (
              <p className="mt-0.5 text-xs text-destructive">
                {errors.show_date}
              </p>
            )}
          </div>
          <div>
            <label className="mb-0.5 block text-xs font-medium">
              Group <span className="text-destructive">*</span>
            </label>
            <Select
              value={formData.show_group ?? ""}
              onValueChange={(v) =>
                setFormData((prev) => ({ ...prev, show_group: v }))
              }
            >
              <SelectTrigger
                className={`h-8 text-xs ${errors.show_group ? "border-destructive" : ""}`}
              >
                <SelectValue placeholder="-- Select Group --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">-- Select Group --</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.group} value={g.group}>
                    {g.group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.show_group && (
              <p className="mt-0.5 text-xs text-destructive">
                {errors.show_group}
              </p>
            )}
          </div>
          <div>
            <label className="mb-0.5 block text-xs font-medium">
              Tour <span className="text-destructive">*</span>
            </label>
            <Select
              value={formData.show_tour ?? ""}
              onValueChange={(v) =>
                setFormData((prev) => ({ ...prev, show_tour: v }))
              }
            >
              <SelectTrigger
                className={`h-8 text-xs ${errors.show_tour ? "border-destructive" : ""}`}
              >
                <SelectValue placeholder="-- Select Tour --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">-- Select Tour --</SelectItem>
                {tours.map((t) => (
                  <SelectItem key={t.tour} value={t.tour}>
                    {t.tour}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.show_tour && (
              <p className="mt-0.5 text-xs text-destructive">
                {errors.show_tour}
              </p>
            )}
          </div>
          <div>
            <label className="mb-0.5 block text-xs font-medium">
              Subvenue <span className="text-destructive">*</span>
            </label>
            <Select
              value={formData.show_subvenue ?? ""}
              onValueChange={(v) =>
                setFormData((prev) => ({ ...prev, show_subvenue: v }))
              }
            >
              <SelectTrigger
                className={`h-8 text-xs ${errors.show_subvenue ? "border-destructive" : ""}`}
              >
                <SelectValue placeholder="-- Select Subvenue --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">-- Select Subvenue --</SelectItem>
                {subvenues.map((s) => (
                  <SelectItem key={s.subvenue} value={s.subvenue}>
                    {s.subvenue}
                    {s.subvenue_venue_location &&
                      ` - ${s.subvenue_venue_location}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.show_subvenue && (
              <p className="mt-0.5 text-xs text-destructive">
                {errors.show_subvenue}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="show_iscanon"
              checked={formData.show_iscanon ?? false}
              onChange={handleChange}
              className="size-4 rounded"
            />
            <label className="text-xs font-medium">Is Canon?</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="show_issetlistgame"
              checked={formData.show_issetlistgame ?? false}
              onChange={handleChange}
              className="size-4 rounded"
            />
            <label className="text-xs font-medium">Is Setlist Game?</label>
          </div>
          <div>
            <label className="mb-0.5 block text-xs font-medium">
              Year <span className="text-destructive">*</span>
            </label>
            <Select
              value={formData.show_year ?? ""}
              onValueChange={(v) =>
                setFormData((prev) => ({ ...prev, show_year: v }))
              }
            >
              <SelectTrigger
                className={`h-8 text-xs ${errors.show_year ? "border-destructive" : ""}`}
              >
                <SelectValue placeholder="-- Select Year --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">-- Select Year --</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y.year} value={y.year}>
                    {y.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.show_year && (
              <p className="mt-0.5 text-xs text-destructive">
                {errors.show_year}
              </p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="mb-0.5 block text-xs font-medium">
              Detail (Optional)
            </label>
            <textarea
              name="show_detail"
              value={formData.show_detail ?? ""}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter any additional details..."
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
