"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { DiscographyAdminRecord } from "@/types/admin"
import type { DiscographyFormFields } from "@/components/dpro/admin/discography-modal-form"

export interface DiscographyModalDetailsFieldsProps {
  error: string | null
  isAddMode: boolean
  record: DiscographyAdminRecord | null
  formData: DiscographyFormFields
  setField: <K extends keyof DiscographyFormFields>(
    field: K,
    value: DiscographyFormFields[K],
  ) => void
  categoryOptions: string[]
}

export function DiscographyModalDetailsFields({
  error,
  isAddMode,
  record,
  formData,
  setField,
  categoryOptions,
}: DiscographyModalDetailsFieldsProps) {
  return (
    <>
      {error && (
        <div className="rounded border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      <div className="space-y-2">
        {!isAddMode && record && (
          <div>
            <label className="mb-0.5 block text-xs font-medium">UUID</label>
            <Input value={record.uuid} disabled className="h-8 text-xs" />
          </div>
        )}
        <div>
          <label className="mb-0.5 block text-xs font-medium">
            Name (search key) <span className="text-destructive">*</span>
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="Internal / canonical name"
            className="h-8 text-xs"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-xs font-medium">
            Display name <span className="text-destructive">*</span>
          </label>
          <Input
            value={formData.displayname}
            onChange={(e) => setField("displayname", e.target.value)}
            placeholder="Public display name"
            className="h-8 text-xs"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-xs font-medium">
            Artist <span className="text-destructive">*</span>
          </label>
          <Input
            value={formData.artist}
            onChange={(e) => setField("artist", e.target.value)}
            placeholder="Artist"
            className="h-8 text-xs"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-xs font-medium">
            Category <span className="text-destructive">*</span>
          </label>
          <Select
            value={formData.category || undefined}
            onValueChange={(v) => setField("category", v)}
          >
            <SelectTrigger className="h-8 w-full text-xs">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((c) => (
                <SelectItem key={c} value={c} className="text-xs">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {categoryOptions.length === 0 && (
            <p className="mt-1 text-[10px] text-muted-foreground">
              No categories loaded. Check discography_categories in Supabase.
            </p>
          )}
        </div>
        <div>
          <label className="mb-0.5 block text-xs font-medium">
            Artwork URL <span className="text-destructive">*</span>
          </label>
          <Input
            value={formData.artwork}
            onChange={(e) => setField("artwork", e.target.value)}
            placeholder="Image URL"
            className="h-8 text-xs"
          />
          {formData.artwork ? (
            <div className="mt-1 w-max max-w-xs">
              <img
                src={formData.artwork}
                alt=""
                className="block h-auto max-h-48 w-auto max-w-full rounded border border-border bg-muted/20"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = "none"
                }}
              />
            </div>
          ) : null}
        </div>
        <div>
          <label className="mb-0.5 block text-xs font-medium">
            Canon ID <span className="text-destructive">*</span>
          </label>
          <Input
            type="number"
            min={0}
            value={formData.canon_id}
            onChange={(e) => setField("canon_id", e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-xs font-medium">
            Release date
          </label>
          <Input
            type="date"
            value={formData.release_date ?? ""}
            onChange={(e) =>
              setField(
                "release_date",
                e.target.value ? e.target.value : null,
              )
            }
            className="h-8 text-xs"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-xs font-medium">
            Coach notes
          </label>
          <Textarea
            value={formData.coach_notes ?? ""}
            onChange={(e) =>
              setField(
                "coach_notes",
                e.target.value === "" ? null : e.target.value,
              )
            }
            placeholder="Optional internal notes"
            className="min-h-20 text-xs"
          />
        </div>
      </div>
    </>
  )
}
