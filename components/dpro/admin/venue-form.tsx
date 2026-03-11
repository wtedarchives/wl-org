"use client"

import type { VenueData } from "@/types/admin"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

interface VenueFormProps {
  editedVenue: VenueData | null
  isEditing: boolean
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void
}

export function VenueForm({
  editedVenue,
  isEditing,
  onInputChange,
}: VenueFormProps) {
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      <div>
        <label className="mb-0.5 block text-xs font-medium">Venue Name</label>
        <Input
          type="text"
          name="venue"
          value={editedVenue?.venue ?? ""}
          onChange={onInputChange}
          readOnly={!isEditing}
          placeholder="Enter venue name"
          className="h-8 text-xs"
        />
      </div>
      <div>
        <label className="mb-0.5 block text-xs font-medium">Location</label>
        <Input
          type="text"
          name="venue_location"
          value={editedVenue?.venue_location ?? ""}
          onChange={onInputChange}
          readOnly={!isEditing}
          placeholder="Enter location"
          className="h-8 text-xs"
        />
      </div>
      <div className="md:col-span-2">
        <label className="mb-0.5 block text-xs font-medium">Address</label>
        <Input
          type="text"
          name="venue_address"
          value={editedVenue?.venue_address ?? ""}
          onChange={onInputChange}
          readOnly={!isEditing}
          placeholder="Enter full address"
          className="h-8 text-xs"
        />
      </div>
      <div>
        <label className="mb-0.5 block text-xs font-medium">Latitude</label>
        <Input
          type="text"
          name="venue_latitude"
          value={editedVenue?.venue_latitude ?? ""}
          onChange={onInputChange}
          readOnly={!isEditing}
          placeholder="e.g., 40.7128"
          className="h-8 text-xs"
        />
      </div>
      <div>
        <label className="mb-0.5 block text-xs font-medium">Longitude</label>
        <Input
          type="text"
          name="venue_longitude"
          value={editedVenue?.venue_longitude ?? ""}
          onChange={onInputChange}
          readOnly={!isEditing}
          placeholder="e.g., -74.0060"
          className="h-8 text-xs"
        />
      </div>
      <div className="md:col-span-2">
        <label className="mb-0.5 block text-xs font-medium">
          Coach&apos;s Notes
        </label>
        <textarea
          name="venue_coachnotes"
          value={editedVenue?.venue_coachnotes ?? ""}
          onChange={onInputChange}
          readOnly={!isEditing}
          rows={4}
          className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          placeholder="Enter any notes about this venue..."
        />
      </div>
      <div className="flex items-center gap-2 md:col-span-2">
        <Checkbox
          id="venue_global"
          name="venue_global"
          checked={editedVenue?.venue_global ?? false}
          onCheckedChange={(checked) => {
            const e = {
              target: {
                name: "venue_global",
                type: "checkbox",
                checked: !!checked,
              },
            } as React.ChangeEvent<HTMLInputElement>
            onInputChange(e)
          }}
          disabled={!isEditing}
        />
        <label
          htmlFor="venue_global"
          className="text-xs font-medium cursor-pointer"
        >
          Global Venue
        </label>
      </div>
    </div>
  )
}
