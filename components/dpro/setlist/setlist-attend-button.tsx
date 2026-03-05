"use client"

import { UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SetlistAttendButtonProps {
  attended: boolean
  toggling: boolean
  onToggle: () => void
}

export function SetlistAttendButton({
  attended,
  toggling,
  onToggle,
}: SetlistAttendButtonProps) {
  return (
    <Button
      variant={attended ? "default" : "outline"}
      size="sm"
      className="h-7 gap-1 text-xs"
      onClick={onToggle}
      disabled={toggling}
    >
      <UserCheck className="size-3.5" />
      {toggling ? "…" : attended ? "Attended" : "I attended"}
    </Button>
  )
}
