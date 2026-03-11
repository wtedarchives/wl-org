"use client"

import { convertToEasternDisplay } from "@/lib/utils/show-utils"
import type {
  AdminShowData,
  GroupData,
  TourData,
  SubvenueDisplayData,
  YearData,
} from "@/types/admin"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ShowFormFieldsProps {
  editedShow: AdminShowData | null
  isEditing: boolean
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
  groups: GroupData[]
  tours: TourData[]
  subvenues: SubvenueDisplayData[]
  years: YearData[]
  selectedShow: AdminShowData
  allShows: AdminShowData[]
  songs: { song: string; song_id: string }[]
}

export function ShowFormFields({
  editedShow,
  isEditing,
  onInputChange,
  groups,
  tours,
  subvenues,
  years,
}: ShowFormFieldsProps) {
  return (
    <div className="px-2 pb-1">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <div>
          <label className="mb-0.5 block text-xs font-medium">Date</label>
          <Input
            type="date"
            name="show_date"
            value={editedShow?.show_date ?? ""}
            onChange={onInputChange}
            readOnly={!isEditing}
            className="h-8 text-xs"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-xs font-medium">Group</label>
          {isEditing ? (
            <Select
              value={editedShow?.show_group ?? ""}
              onValueChange={(v) =>
                onInputChange({
                  target: { name: "show_group", value: v },
                } as React.ChangeEvent<HTMLSelectElement>)
                }
            >
              <SelectTrigger className="h-8 text-xs">
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
          ) : (
            <Input
              value={editedShow?.show_group ?? ""}
              readOnly
              className="h-8 text-xs"
            />
          )}
        </div>
        <div>
          <label className="mb-0.5 block text-xs font-medium">Tour</label>
          {isEditing ? (
            <Select
              value={editedShow?.show_tour ?? ""}
              onValueChange={(v) =>
                onInputChange({
                  target: { name: "show_tour", value: v },
                } as React.ChangeEvent<HTMLSelectElement>)
              }
            >
              <SelectTrigger className="h-8 text-xs">
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
          ) : (
            <Input
              value={editedShow?.show_tour ?? ""}
              readOnly
              className="h-8 text-xs"
            />
          )}
        </div>
        <div>
          <label className="mb-0.5 block text-xs font-medium">Subvenue</label>
          {isEditing ? (
            <Select
              value={editedShow?.show_subvenue ?? ""}
              onValueChange={(v) =>
                onInputChange({
                  target: { name: "show_subvenue", value: v },
                } as React.ChangeEvent<HTMLSelectElement>)
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="-- Select Subvenue --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">-- Select Subvenue --</SelectItem>
                {subvenues.map((s) => (
                  <SelectItem key={s.subvenue} value={s.subvenue}>
                    {s.subvenue}
                    {s.subvenue_venue_location && ` - ${s.subvenue_venue_location}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={editedShow?.show_subvenue ?? ""}
              readOnly
              className="h-8 text-xs"
            />
          )}
        </div>
        <div>
          <label className="mb-0.5 block text-xs font-medium">Canon ID</label>
          <Input
            value={editedShow?.show_canonid ?? ""}
            readOnly
            className="h-8 text-xs"
          />
          <p className="mt-0.5 text-xs italic text-muted-foreground">
            Auto-generated value
          </p>
        </div>
        <div>
          <label className="mb-0.5 block text-xs font-medium">Detail</label>
          <Input
            name="show_detail"
            value={editedShow?.show_detail ?? ""}
            onChange={onInputChange}
            readOnly={!isEditing}
            className="h-8 text-xs"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-xs font-medium">Alert</label>
          <Input
            name="show_alert"
            value={editedShow?.show_alert ?? ""}
            onChange={onInputChange}
            readOnly={!isEditing}
            className="h-8 text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="show_iscanon"
            name="show_iscanon"
            checked={editedShow?.show_iscanon ?? false}
            onChange={onInputChange}
            disabled={!isEditing}
            className="size-4 rounded"
          />
          <label htmlFor="show_iscanon" className="text-xs font-medium">
            Is Canon?
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="show_issetlistgame"
            name="show_issetlistgame"
            checked={editedShow?.show_issetlistgame ?? false}
            onChange={onInputChange}
            disabled={!isEditing}
            className="size-4 rounded"
          />
          <label htmlFor="show_issetlistgame" className="text-xs font-medium">
            Is Setlist Game?
          </label>
        </div>
        <div>
          <label className="mb-0.5 block text-xs font-medium">
            Show Time (Eastern Time)
          </label>
          <Input
            type="datetime-local"
            name="show_time"
            value={convertToEasternDisplay(editedShow?.show_time ?? null)}
            onChange={onInputChange}
            readOnly={!isEditing}
            className="h-8 text-xs"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-xs font-medium">
            WysteriaLane.org Thread Link
          </label>
          <Input
            type="url"
            name="show_wl_link"
            value={editedShow?.show_wl_link ?? ""}
            onChange={onInputChange}
            readOnly={!isEditing}
            placeholder="https://wysterialane.org/..."
            className="h-8 text-xs"
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-0.5 block text-xs font-medium">
            Coach&apos;s Notes
          </label>
          <textarea
            name="show_coachnotes"
            value={editedShow?.show_coachnotes ?? ""}
            onChange={onInputChange}
            readOnly={!isEditing}
            rows={3}
            className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-0.5 block text-xs font-medium">
            Callbacks
          </label>
          <textarea
            name="show_callbacks"
            value={editedShow?.show_callbacks ?? ""}
            onChange={onInputChange}
            readOnly={!isEditing}
            rows={4}
            className="w-full rounded-md border border-input bg-background px-2 py-1 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            placeholder="HTML for callbacks..."
          />
        </div>
      </div>
    </div>
  )
}
