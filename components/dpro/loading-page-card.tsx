"use client"

import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Progress } from "@/components/ui/progress"

interface LoadingPageCardProps {
  /**
   * Custom message, e.g. "Loading 2025 data…", "Loading Arcadia…".
   * When provided, used as-is. Otherwise falls back to "Loading {page} data…".
   */
  message?: string
  /** Fallback when message not provided: "song", "years", "tour", "stats", "setlist", "songs" */
  page?: string
  /**
   * Progress 0–100. When provided, shows a progress bar and percentage.
   * Use to indicate how many components have finished loading.
   */
  progress?: number
  /**
   * When true, omits the outer page shell and card frame — for use inside
   * another card or constrained layout (same spinner, message, and progress UI).
   */
  embedded?: boolean
}

export function LoadingPageCard({
  message,
  page,
  progress,
  embedded = false,
}: LoadingPageCardProps) {
  const displayText =
    message ?? (page ? `Loading ${page} data…` : "Loading…")
  const showProgress = progress !== undefined && progress !== null

  const bodyInner = (
    <>
      <div className="flex items-center justify-center gap-2">
        <Loader2 className="size-5 animate-spin text-muted-foreground shrink-0" />
        <span className="text-sm text-muted-foreground">{displayText}</span>
      </div>
      {showProgress && (
        <Field className="w-full max-w-sm mx-auto">
          <FieldLabel
            htmlFor="loading-progress"
            className="flex items-center justify-between w-full"
          >
            <span>Loading progress</span>
            <span className="ml-auto tabular-nums">
              {Math.round(progress)}%
            </span>
          </FieldLabel>
          <Progress
            value={Math.min(100, Math.max(0, progress))}
            id="loading-progress"
          />
        </Field>
      )}
    </>
  )

  if (embedded) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8 px-4">
        {bodyInner}
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 rounded-b-none p-4 md:rounded-b-xl md:p-6">
      <Card className="border-border/60 bg-card/80 py-0 overflow-hidden">
        <CardContent className="flex flex-col gap-4 py-8 px-6">
          {bodyInner}
        </CardContent>
      </Card>
    </div>
  )
}
