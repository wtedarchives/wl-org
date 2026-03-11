"use client"

import { Plus } from "lucide-react"
import { formatDate } from "@/lib/utils/show-utils"
import type { ShowData } from "@/types/admin"
import { Button } from "@/components/ui/button"

interface ShowHeaderProps {
  selectedShow: ShowData
  onCreateNewEntry: () => void
}

export function ShowHeader({
  selectedShow,
  onCreateNewEntry,
}: ShowHeaderProps) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <div>
        <h4 className="text-sm font-medium">
          {formatDate(selectedShow.show_date)} [{selectedShow.show_group}]
        </h4>
        <div className="text-xs text-muted-foreground">
          {selectedShow.show_subvenue} — {selectedShow.show_venue_location}
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onCreateNewEntry}
        className="gap-2"
      >
        <Plus className="size-4" />
      </Button>
    </div>
  )
}
