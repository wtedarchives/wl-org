"use client"

import type { Dispatch, RefObject, SetStateAction } from "react"
import { Save, Trash2, ChevronLeft, ChevronRight, X } from "lucide-react"
import {
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

export function ShowReleaseModalForm({
  mode,
  dialogContentRef,
  error,
  loading,
  saving,
  deleting,
  releaseDisplayLabels,
  selectedReleaseId,
  setSelectedReleaseId,
  releaseOrder,
  setReleaseOrder,
  showDeleteConfirm,
  setShowDeleteConfirm,
  existingReleaseId,
  onSave,
  onClose,
  onDelete,
}: {
  mode: "add" | "edit"
  dialogContentRef: RefObject<HTMLDivElement | null>
  error: string | null
  loading: boolean
  saving: boolean
  deleting: boolean
  releaseDisplayLabels: { id: string; label: string }[]
  selectedReleaseId: string
  setSelectedReleaseId: (id: string) => void
  releaseOrder: number
  setReleaseOrder: Dispatch<SetStateAction<number>>
  showDeleteConfirm: boolean
  setShowDeleteConfirm: (v: boolean) => void
  existingReleaseId?: string
  onSave: () => void
  onClose: () => void
  onDelete: () => void
}) {
  const releaseItems = releaseDisplayLabels.map((r) => r.label)

  return (
    <>
      <div className="flex items-center justify-between">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add Release to Show" : "Edit Release Order"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={onSave}
            disabled={saving || (mode === "add" && !selectedReleaseId)}
          >
            <Save className="size-4" />
            {saving && "..."}
          </Button>
          {mode === "edit" && !showDeleteConfirm && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              title="Delete"
            >
              <Trash2 className="size-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>
      </div>
      {error && (
        <div className="rounded border border-destructive/50 bg-destructive/10 px-2 py-1 text-xs text-destructive">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {mode === "add" ? (
          <div className="md:col-span-2">
            <label className="mb-0.5 block text-xs font-medium">
              Select Release <span className="text-destructive">*</span>
            </label>
            {loading ? (
              <div className="flex items-center justify-center p-3">
                <div className="flex gap-2">
                  <div className="size-3 animate-pulse rounded-lg bg-muted" />
                  <div className="size-3 animate-pulse rounded-lg bg-muted [animation-delay:150ms]" />
                  <div className="size-3 animate-pulse rounded-lg bg-muted [animation-delay:300ms]" />
                </div>
              </div>
            ) : (
              <Combobox
                items={releaseItems}
                value={
                  releaseDisplayLabels.find((r) => r.id === selectedReleaseId)
                    ?.label ?? null
                }
                onValueChange={(label) => {
                  const found = releaseDisplayLabels.find(
                    (r) => r.label === label,
                  )
                  if (found) setSelectedReleaseId(found.id)
                }}
                disabled={loading}
              >
                <ComboboxInput
                  placeholder="Select a release..."
                  className="h-8 w-full text-xs"
                />
                <ComboboxContent container={dialogContentRef}>
                  <ComboboxEmpty>No releases found.</ComboboxEmpty>
                  <ComboboxList>
                    {(item) => {
                      const release = releaseDisplayLabels.find(
                        (r) => r.label === item,
                      )
                      return (
                        <ComboboxItem
                          key={release?.id ?? item}
                          value={item}
                          className="text-xs"
                        >
                          {item}
                        </ComboboxItem>
                      )
                    }}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            )}
          </div>
        ) : (
          <div className="md:col-span-2">
            <label className="mb-0.5 block text-xs font-medium">
              Release
            </label>
            <Input
              value={existingReleaseId ?? ""}
              disabled
              className="h-8 text-xs"
            />
          </div>
        )}
        <div className="md:col-span-2">
          <label className="mb-0.5 block text-xs font-medium">
            Release Order <span className="text-destructive">*</span>
          </label>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 shrink-0 p-0"
              onClick={() => setReleaseOrder((n) => Math.max(1, n - 1))}
              aria-label="Decrease order"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Input
              type="number"
              min={1}
              value={releaseOrder}
              onChange={(e) =>
                setReleaseOrder(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="h-8 w-20 shrink-0 text-center text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              placeholder="1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 shrink-0 p-0"
              onClick={() => setReleaseOrder((n) => n + 1)}
              aria-label="Increase order"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Lower numbers appear first in the list
          </p>
        </div>
        {mode === "edit" && showDeleteConfirm && (
          <div className="flex items-center gap-2 md:col-span-2">
            <span className="text-xs">Are you sure?</span>
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Yes, Delete"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
