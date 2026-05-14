"use client"

import { useState, useEffect } from "react"
import { Save, X } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
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
  const { session } = useAuth()
  const token = session?.token ?? null
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
    if (!validate() || !token) return
    setIsSubmitting(true)
    try {
      if (isNewShow) {
        const { error } = await invokeDproAdmin(token, {
          action: "shows_insert",
          row: {
            show_date: formData.show_date,
            show_group: formData.show_group,
            show_tour: formData.show_tour,
            show_subvenue: formData.show_subvenue,
            show_iscanon: formData.show_iscanon ?? false,
            show_year: formData.show_year,
            show_issetlistgame: formData.show_issetlistgame ?? false,
            show_detail: formData.show_detail,
          },
        })
        if (error) throw new Error(error)
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
      <DialogContent
        className="max-h-[90vh] max-w-3xl overflow-y-auto sm:max-w-3xl"
        showCloseButton={false}
      >
        <div className="flex items-center justify-between">
          <DialogHeader>
            <DialogTitle>
              {isNewShow ? "Add New Show" : "Edit Show"}
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
        {errors.submit && (
          <div className="rounded border border-destructive/50 bg-destructive/10 px-2 py-1 text-xs text-destructive">
            {errors.submit}
          </div>
        )}
        <div className="wl-home-v2-archive-admin-song-form">
          <div className="wl-home-v2-archive-admin-song-form__grid">
            <div className="min-w-0">
              <label htmlFor="show-modal-date">
                Date <span className="text-destructive">*</span>
              </label>
              <Input
                id="show-modal-date"
                type="date"
                name="show_date"
                value={formData.show_date ?? ""}
                onChange={handleChange}
                className={errors.show_date ? "border-destructive" : undefined}
              />
              {errors.show_date && (
                <p className="mt-0.5 text-xs text-destructive">
                  {errors.show_date}
                </p>
              )}
            </div>
            <div className="min-w-0">
              <label htmlFor="show-modal-group">
                Group <span className="text-destructive">*</span>
              </label>
              <Select
                value={formData.show_group || "__none__"}
                onValueChange={(v) =>
                  setFormData((prev) => ({
                    ...prev,
                    show_group: v === "__none__" ? "" : v,
                  }))
                }
              >
                <SelectTrigger
                  id="show-modal-group"
                  size="sm"
                  className={errors.show_group ? "border-destructive" : undefined}
                >
                  <SelectValue placeholder="-- Select Group --" />
                </SelectTrigger>
                <SelectContent className="wl-home-v2-archive-admin-portal-content">
                  <SelectItem value="__none__">-- Select Group --</SelectItem>
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
            <div className="min-w-0">
              <label htmlFor="show-modal-tour">
                Tour <span className="text-destructive">*</span>
              </label>
              <Select
                value={formData.show_tour || "__none__"}
                onValueChange={(v) =>
                  setFormData((prev) => ({
                    ...prev,
                    show_tour: v === "__none__" ? "" : v,
                  }))
                }
              >
                <SelectTrigger
                  id="show-modal-tour"
                  size="sm"
                  className={errors.show_tour ? "border-destructive" : undefined}
                >
                  <SelectValue placeholder="-- Select Tour --" />
                </SelectTrigger>
                <SelectContent className="wl-home-v2-archive-admin-portal-content">
                  <SelectItem value="__none__">-- Select Tour --</SelectItem>
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
            <div className="min-w-0">
              <label htmlFor="show-modal-subvenue">
                Subvenue <span className="text-destructive">*</span>
              </label>
              <Select
                value={formData.show_subvenue || "__none__"}
                onValueChange={(v) =>
                  setFormData((prev) => ({
                    ...prev,
                    show_subvenue: v === "__none__" ? "" : v,
                  }))
                }
              >
                <SelectTrigger
                  id="show-modal-subvenue"
                  size="sm"
                  className={
                    errors.show_subvenue ? "border-destructive" : undefined
                  }
                >
                  <SelectValue placeholder="-- Select Subvenue --" />
                </SelectTrigger>
                <SelectContent className="wl-home-v2-archive-admin-portal-content">
                  <SelectItem value="__none__">-- Select Subvenue --</SelectItem>
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
            <div className="min-w-0 flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="show-modal-iscanon"
                  name="show_iscanon"
                  checked={formData.show_iscanon ?? false}
                  onChange={handleChange}
                  className="size-4 shrink-0 rounded"
                />
                <label htmlFor="show-modal-iscanon">Is Canon?</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="show-modal-issetlistgame"
                  name="show_issetlistgame"
                  checked={formData.show_issetlistgame ?? false}
                  onChange={handleChange}
                  className="size-4 shrink-0 rounded"
                />
                <label htmlFor="show-modal-issetlistgame">
                  Is Setlist Game?
                </label>
              </div>
            </div>
            <div className="min-w-0">
              <label htmlFor="show-modal-year">
                Year <span className="text-destructive">*</span>
              </label>
              <Select
                value={formData.show_year || "__none__"}
                onValueChange={(v) =>
                  setFormData((prev) => ({
                    ...prev,
                    show_year: v === "__none__" ? "" : v,
                  }))
                }
              >
                <SelectTrigger
                  id="show-modal-year"
                  size="sm"
                  className={errors.show_year ? "border-destructive" : undefined}
                >
                  <SelectValue placeholder="-- Select Year --" />
                </SelectTrigger>
                <SelectContent className="wl-home-v2-archive-admin-portal-content">
                  <SelectItem value="__none__">-- Select Year --</SelectItem>
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
            <div className="wl-home-v2-archive-admin-song-form__notes min-w-0">
              <label htmlFor="show-modal-detail">Detail (Optional)</label>
              <textarea
                id="show-modal-detail"
                name="show_detail"
                value={formData.show_detail ?? ""}
                onChange={handleChange}
                rows={4}
                placeholder="Enter any additional details..."
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
