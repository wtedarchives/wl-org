"use client"

import { FloppyDisk, PencilSimple } from "@phosphor-icons/react"
import { formatDate } from "@/lib/utils/show-utils"
import type {
  AdminShowData,
  GroupData,
  TourData,
  SubvenueDisplayData,
  YearData,
} from "@/types/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CallbacksEditor } from "./callbacks-editor"

interface ShowFormFieldsProps {
  editedShow: AdminShowData | null
  isEditing: boolean
  isSubmitting: boolean
  onToggleEdit: () => void
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
  isSubmitting,
  onToggleEdit,
  onInputChange,
  groups,
  tours,
  subvenues,
  years,
  selectedShow,
  allShows,
  songs,
}: ShowFormFieldsProps) {
  return (
    <>
      <div className="wl-home-v2-archive-admin-song-form__head">
        <h4 className="wl-home-v2-archive-admin-song-form__title">
          {formatDate(selectedShow.show_date)} — {selectedShow.show_subvenue}
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
          <label htmlFor="show-admin-date">Date</label>
          <Input
            id="show-admin-date"
            type="date"
            name="show_date"
            value={editedShow?.show_date ?? ""}
            onChange={onInputChange}
            readOnly={!isEditing}
          />
        </div>
        <div className="min-w-0">
          <label htmlFor="show-admin-group">Group</label>
          {isEditing ?
            <Select
              value={editedShow?.show_group || "__none__"}
              onValueChange={(v) =>
                onInputChange({
                  target: {
                    name: "show_group",
                    value: v === "__none__" ? "" : v,
                  },
                } as React.ChangeEvent<HTMLSelectElement>)
              }
            >
              <SelectTrigger id="show-admin-group" size="sm">
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
          : <Input value={editedShow?.show_group ?? ""} readOnly />}
        </div>
        <div className="min-w-0">
          <label htmlFor="show-admin-tour">Tour</label>
          {isEditing ?
            <Select
              value={editedShow?.show_tour || "__none__"}
              onValueChange={(v) =>
                onInputChange({
                  target: {
                    name: "show_tour",
                    value: v === "__none__" ? "" : v,
                  },
                } as React.ChangeEvent<HTMLSelectElement>)
              }
            >
              <SelectTrigger id="show-admin-tour" size="sm">
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
          : <Input value={editedShow?.show_tour ?? ""} readOnly />}
        </div>
        <div className="min-w-0">
          <label htmlFor="show-admin-subvenue">Subvenue</label>
          {isEditing ?
            <Select
              value={editedShow?.show_subvenue || "__none__"}
              onValueChange={(v) =>
                onInputChange({
                  target: {
                    name: "show_subvenue",
                    value: v === "__none__" ? "" : v,
                  },
                } as React.ChangeEvent<HTMLSelectElement>)
              }
            >
              <SelectTrigger id="show-admin-subvenue" size="sm">
                <SelectValue placeholder="-- Select Subvenue --" />
              </SelectTrigger>
              <SelectContent className="wl-home-v2-archive-admin-portal-content">
                <SelectItem value="__none__">-- Select Subvenue --</SelectItem>
                {subvenues.map((s) => (
                  <SelectItem key={s.subvenue} value={s.subvenue}>
                    {s.subvenue}
                    {s.subvenue_venue_location && ` - ${s.subvenue_venue_location}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          : <Input value={editedShow?.show_subvenue ?? ""} readOnly />}
        </div>
        <div className="min-w-0">
          <label htmlFor="show-admin-year">Year</label>
          {isEditing ?
            <Select
              value={editedShow?.show_year || "__none__"}
              onValueChange={(v) =>
                onInputChange({
                  target: {
                    name: "show_year",
                    value: v === "__none__" ? "" : v,
                  },
                } as React.ChangeEvent<HTMLSelectElement>)
              }
            >
              <SelectTrigger id="show-admin-year" size="sm">
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
          : <Input value={editedShow?.show_year ?? ""} readOnly />}
        </div>
        <div className="min-w-0">
          <label htmlFor="show-admin-canonid">Canon ID</label>
          <Input
            id="show-admin-canonid"
            value={editedShow?.show_canonid ?? ""}
            readOnly
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Auto-generated value
          </p>
        </div>
        <div className="min-w-0">
          <label htmlFor="show-admin-detail">Detail</label>
          <Input
            id="show-admin-detail"
            name="show_detail"
            value={editedShow?.show_detail ?? ""}
            onChange={onInputChange}
            readOnly={!isEditing}
          />
        </div>
        <div className="min-w-0">
          <label htmlFor="show-admin-alert">Alert</label>
          <Input
            id="show-admin-alert"
            name="show_alert"
            value={editedShow?.show_alert ?? ""}
            onChange={onInputChange}
            readOnly={!isEditing}
          />
        </div>
        <div className="min-w-0 flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="show_iscanon"
              name="show_iscanon"
              checked={editedShow?.show_iscanon ?? false}
              onChange={onInputChange}
              disabled={!isEditing}
              className="size-4 shrink-0 rounded"
            />
            <label htmlFor="show_iscanon">Is Canon?</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="show_issetlistgame"
              name="show_issetlistgame"
              checked={editedShow?.show_issetlistgame ?? false}
              onChange={onInputChange}
              disabled={!isEditing}
              className="size-4 shrink-0 rounded"
            />
            <label htmlFor="show_issetlistgame">Is Setlist Game?</label>
          </div>
        </div>
        <div className="wl-home-v2-archive-admin-song-form__notes min-w-0">
          <label htmlFor="show-admin-wl-link">
            WysteriaLane.org Thread Link
          </label>
          <Input
            id="show-admin-wl-link"
            type="url"
            name="show_wl_link"
            value={editedShow?.show_wl_link ?? ""}
            onChange={onInputChange}
            readOnly={!isEditing}
            placeholder="https://wysterialane.org/..."
          />
        </div>
        <div className="wl-home-v2-archive-admin-song-form__notes min-w-0">
          <label htmlFor="show-admin-coachnotes">Coach&apos;s Notes</label>
          <textarea
            id="show-admin-coachnotes"
            name="show_coachnotes"
            value={editedShow?.show_coachnotes ?? ""}
            onChange={onInputChange}
            readOnly={!isEditing}
            rows={4}
          />
        </div>
        <CallbacksEditor
          selectedShow={selectedShow}
          editedShow={editedShow}
          isEditing={isEditing}
          onInputChange={onInputChange}
          allShows={allShows}
          songs={songs}
        />
      </div>
    </>
  )
}
