"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { Tour } from "@/hooks/use-setlist-data"

interface SetlistTourDropdownProps {
  tours: Tour[]
  currentTourId: string
  currentTourName: string | null
  onTourSelect: (tourId: string) => void
  /** Optional className for the SelectTrigger (e.g. for truncation in mobile) */
  triggerClassName?: string
  /** Optional className for the portaled SelectContent */
  contentClassName?: string
}

export function SetlistTourDropdown({
  tours,
  currentTourId,
  currentTourName,
  onTourSelect,
  triggerClassName,
  contentClassName,
}: SetlistTourDropdownProps) {
  if (tours.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">
        Tour: {currentTourName ?? "—"}
      </span>
    )
  }

  const triggerLabel =
    tours.find((t) => t.tour_id === currentTourId)?.tour ??
    currentTourName ??
    ""

  return (
    <Select
      value={currentTourId || undefined}
      onValueChange={(value) => value && onTourSelect(value)}
    >
      <SelectTrigger
        size="sm"
        className={cn("h-6 w-auto min-w-[120px] text-xs", triggerClassName)}
      >
        <SelectValue placeholder="Tour">
          {currentTourId ?
            <span className="font-semibold">{triggerLabel || currentTourName}</span>
          : undefined}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        {tours.map((t) => (
          <SelectItem key={t.tour_id} value={t.tour_id} className="text-xs">
            {t.tour}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
