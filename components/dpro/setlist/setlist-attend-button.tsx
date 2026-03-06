"use client"

import { UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SetlistAttendButtonProps {
  attended: boolean
  toggling: boolean
  onToggle: () => void
  className?: string
}

export function SetlistAttendButton({
  attended,
  toggling,
  onToggle,
  className,
}: SetlistAttendButtonProps) {
  return (
    <Button
      variant={attended ? "default" : "outline"}
      size="sm"
      className={cn("h-7 gap-1 text-xs", className)}
      onClick={onToggle}
      disabled={toggling}
    >
      <UserCheck className="size-3.5" />
      {toggling ? "…" : attended ? "Attended" : "I attended"}
    </Button>
  )
}
