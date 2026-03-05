"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Tour } from "@/hooks/use-setlist-data"

interface SetlistTourDropdownProps {
  tours: Tour[]
  currentTourId: string
  currentTourName: string | null
  onTourSelect: (tourId: string) => void
}

export function SetlistTourDropdown({
  tours,
  currentTourId,
  currentTourName,
  onTourSelect,
}: SetlistTourDropdownProps) {
  if (tours.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">
        Tour: {currentTourName ?? "—"}
      </span>
    )
  }

  return (
    <Select
      value={currentTourId || undefined}
      onValueChange={(value) => value && onTourSelect(value)}
    >
      <SelectTrigger size="sm" className="h-7 w-auto min-w-[120px] text-xs">
        <SelectValue placeholder="Tour" />
      </SelectTrigger>
      <SelectContent>
        {tours.map((t) => (
          <SelectItem key={t.tour_id} value={t.tour_id} className="text-xs">
            {t.tour}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
