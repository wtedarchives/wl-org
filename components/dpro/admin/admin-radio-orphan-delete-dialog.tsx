"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const dispositionButtonClass =
  "min-h-10 px-3 py-1.5 sm:min-h-9 touch-manipulation"

export function AdminRadioOrphanDeleteDialog({
  open,
  onOpenChange,
  updating,
  onConfirm,
  title,
  description,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  updating: boolean
  onConfirm: () => void
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!updating}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter className="flex flex-row flex-wrap items-center justify-end gap-2 sm:gap-2">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className={dispositionButtonClass}
            disabled={updating}
            onClick={() => onConfirm()}
          >
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
