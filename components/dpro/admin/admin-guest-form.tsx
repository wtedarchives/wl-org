"use client"

import { Save, Edit } from "lucide-react"
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

interface AdminGuestFormProps {
  guest: GuestData
  editedGuest: GuestData | null
  isEditing: boolean
  isSubmitting: boolean
  onInputChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void
  onCategoryChange: (value: string) => void
  onToggleEdit: () => void
}

export function AdminGuestForm({
  guest,
  editedGuest,
  isEditing,
  isSubmitting,
  onInputChange,
  onCategoryChange,
  onToggleEdit,
}: AdminGuestFormProps) {
  return (
    <div className="pb-1">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-medium">{guest.guest}</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleEdit}
          disabled={isSubmitting}
          className="gap-1"
        >
          {isEditing ? (
            <>
              <Save className="size-4" />
              Save
            </>
          ) : (
            <>
              <Edit className="size-4" />
              Edit
            </>
          )}
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <div>
          <label className="mb-0.5 block text-xs font-medium">Guest Name</label>
          <Input
            type="text"
            name="guest"
            value={editedGuest?.guest ?? ""}
            onChange={onInputChange}
            readOnly={!isEditing}
            className="h-8 text-xs"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-xs font-medium">
            Display Name
          </label>
          <Input
            type="text"
            name="guest_displayname"
            value={editedGuest?.guest_displayname ?? ""}
            onChange={onInputChange}
            readOnly={!isEditing}
            className="h-8 text-xs"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-xs font-medium">Instrument</label>
          <Input
            type="text"
            name="guest_instrument"
            value={editedGuest?.guest_instrument ?? ""}
            onChange={onInputChange}
            readOnly={!isEditing}
            className="h-8 text-xs"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-xs font-medium">Category</label>
          {isEditing ? (
            <Select
              value={editedGuest?.guest_category || "__none__"}
              onValueChange={onCategoryChange}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="-- Select Category --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">-- Select Category --</SelectItem>
                {GUEST_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={editedGuest?.guest_category ?? ""}
              readOnly
              className="h-8 text-xs"
            />
          )}
        </div>
        <div>
          <label className="mb-0.5 block text-xs font-medium">Canon ID</label>
          <Input
            value={editedGuest?.guest_canonid ?? ""}
            readOnly
            className="h-8 text-xs"
          />
          <p className="mt-0.5 text-xs italic text-muted-foreground">
            Auto-generated value
          </p>
        </div>
      </div>
    </div>
  )
}
