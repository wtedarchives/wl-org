"use client"

import { FloppyDisk, PencilSimple } from "@phosphor-icons/react"
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
    <div className="wl-home-v2-archive-admin-song-form">
      <div className="wl-home-v2-archive-admin-song-form__head">
        <h4 className="wl-home-v2-archive-admin-song-form__title">
          {guest.guest}
        </h4>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onToggleEdit}
          disabled={isSubmitting}
          className="wl-home-v2-tours-header-pill shrink-0 gap-1"
        >
          {isEditing ?
            <>
              <FloppyDisk className="size-3.5 shrink-0 opacity-80" aria-hidden />
              Save
            </>
          : <>
              <PencilSimple
                className="size-3.5 shrink-0 opacity-80"
                aria-hidden
              />
              Edit
            </>
          }
        </Button>
      </div>
      <div className="wl-home-v2-archive-admin-song-form__grid">
        <div className="min-w-0">
          <label htmlFor="personnel-admin-name">Guest Name</label>
          <Input
            id="personnel-admin-name"
            type="text"
            name="guest"
            value={editedGuest?.guest ?? ""}
            onChange={onInputChange}
            readOnly={!isEditing}
          />
        </div>
        <div className="min-w-0">
          <label htmlFor="personnel-admin-displayname">Display Name</label>
          <Input
            id="personnel-admin-displayname"
            type="text"
            name="guest_displayname"
            value={editedGuest?.guest_displayname ?? ""}
            onChange={onInputChange}
            readOnly={!isEditing}
          />
        </div>
        <div className="min-w-0">
          <label htmlFor="personnel-admin-instrument">Instrument</label>
          <Input
            id="personnel-admin-instrument"
            type="text"
            name="guest_instrument"
            value={editedGuest?.guest_instrument ?? ""}
            onChange={onInputChange}
            readOnly={!isEditing}
          />
        </div>
        <div className="min-w-0">
          <label htmlFor="personnel-admin-category">Category</label>
          {isEditing ?
            <Select
              value={editedGuest?.guest_category || "__none__"}
              onValueChange={onCategoryChange}
            >
              <SelectTrigger id="personnel-admin-category" size="sm">
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
          : <Input value={editedGuest?.guest_category ?? ""} readOnly />}
        </div>
        <div className="min-w-0">
          <label htmlFor="personnel-admin-canonid">Canon ID</label>
          <Input
            id="personnel-admin-canonid"
            value={
              editedGuest?.guest_canonid === null ||
              editedGuest?.guest_canonid === undefined
                ? ""
                : String(editedGuest.guest_canonid)
            }
            readOnly
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Auto-generated value
          </p>
        </div>
      </div>
    </div>
  )
}
