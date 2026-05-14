"use client"

import type { VenueData } from "@/types/admin"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

interface VenueFormProps {
  editedVenue: VenueData | null
  isEditing: boolean
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void
}

export function VenueForm({
  editedVenue,
  isEditing,
  onInputChange,
}: VenueFormProps) {
  return (
    <div className="wl-home-v2-archive-admin-song-form__grid">
      <div className="min-w-0">
        <label htmlFor="venue-admin-name">Venue Name</label>
        <Input
          id="venue-admin-name"
          type="text"
          name="venue"
          value={editedVenue?.venue ?? ""}
          onChange={onInputChange}
          readOnly={!isEditing}
          placeholder="Enter venue name"
        />
      </div>
      <div className="min-w-0">
        <label htmlFor="venue-admin-location">Location</label>
        <Input
          id="venue-admin-location"
          type="text"
          name="venue_location"
          value={editedVenue?.venue_location ?? ""}
          onChange={onInputChange}
          readOnly={!isEditing}
          placeholder="Enter location"
        />
      </div>
      <div className="min-w-0 md:col-span-2">
        <label htmlFor="venue-admin-address">Address</label>
        <Input
          id="venue-admin-address"
          type="text"
          name="venue_address"
          value={editedVenue?.venue_address ?? ""}
          onChange={onInputChange}
          readOnly={!isEditing}
          placeholder="Enter full address"
        />
      </div>
      <div className="min-w-0">
        <label htmlFor="venue-admin-lat">Latitude</label>
        <Input
          id="venue-admin-lat"
          type="text"
          name="venue_latitude"
          value={editedVenue?.venue_latitude ?? ""}
          onChange={onInputChange}
          readOnly={!isEditing}
          placeholder="e.g., 40.7128"
        />
      </div>
      <div className="min-w-0">
        <label htmlFor="venue-admin-lng">Longitude</label>
        <Input
          id="venue-admin-lng"
          type="text"
          name="venue_longitude"
          value={editedVenue?.venue_longitude ?? ""}
          onChange={onInputChange}
          readOnly={!isEditing}
          placeholder="e.g., -74.0060"
        />
      </div>
      <div className="min-w-0 md:col-span-2">
        <label htmlFor="venue-admin-coachnotes">Coach&apos;s Notes</label>
        <textarea
          id="venue-admin-coachnotes"
          name="venue_coachnotes"
          value={editedVenue?.venue_coachnotes ?? ""}
          onChange={onInputChange}
          readOnly={!isEditing}
          rows={4}
          placeholder="Enter any notes about this venue..."
        />
      </div>
      <div className="wl-home-v2-archive-admin-inline-check-row md:col-span-2">
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
        <label htmlFor="venue_global">Global Venue</label>
      </div>
    </div>
  )
}
