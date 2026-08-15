"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { formatBrainsSetLabel } from "@/lib/brains-sets"
import type { AdminSetlistEntryData } from "@/types/admin"

interface BrainsDeleteSetDialogProps {
  setKey: string | null
  entries: AdminSetlistEntryData[]
  onClose: () => void
  onConfirm: (setKey: string) => void
}

export function BrainsDeleteSetDialog({
  setKey,
  entries,
  onClose,
  onConfirm,
}: BrainsDeleteSetDialogProps) {
  const songs = entries.map((e) => e.entry_song).filter(Boolean) as string[]

  return (
    <AlertDialog open={setKey !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-md sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {setKey ? formatBrainsSetLabel(setKey) : "this set"}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {songs.length === 0 ?
              "This empty set will be removed."
            : "If you delete this set, these setlist entries will be deleted too."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {songs.length > 0 ?
          <ul className="m-0 max-h-40 list-disc overflow-y-auto pl-5 text-xs text-white/80">
            {songs.map((name, i) => (
              <li key={`${name}-${i}`}>{name}</li>
            ))}
          </ul>
        : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              if (setKey) onConfirm(setKey)
            }}
          >
            Delete set
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
