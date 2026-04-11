"use client"

import { useSyncExternalStore } from "react"
import { X } from "lucide-react"
import type { SongPick } from "./types"
import { getResultDescription } from "./utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface TooltipContainerProps {
  result: string | undefined
  score: number | undefined
  pick?: SongPick
}

function subscribeHoverCapability(cb: () => void) {
  if (typeof window === "undefined") return () => {}
  const mq = window.matchMedia("(hover: none)")
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}

function getHoverNoneSnapshot() {
  if (typeof window === "undefined") return false
  return window.matchMedia("(hover: none)").matches
}

/** True when the primary UI has no hover (phones, most tablets): use tap for score explainer. */
function useTapForScoreExplainer() {
  return useSyncExternalStore(
    subscribeHoverCapability,
    getHoverNoneSnapshot,
    () => false
  )
}

export function TooltipContainer({
  result,
  score,
  pick,
}: TooltipContainerProps) {
  const tapExplainer = useTapForScoreExplainer()
  const html = getResultDescription(
    result,
    pick?.showcloser_correct ?? false,
    pick?.showopener_correct ?? false
  )

  const explainerBody = (
    <div
      className="text-[11px] leading-tight"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )

  const scoreFace = (
    <>
      {result === "not_played" ? (
        <span className="inline-flex items-center justify-center size-5 rounded bg-red-600">
          <X className="size-3 text-white" />
        </span>
      ) : (
        <span className="font-medium text-xs text-white bg-green-600 rounded px-1 py-0.5">
          +{score}
        </span>
      )}
    </>
  )

  const triggerClassName = cn(
    "inline-flex items-center justify-center rounded-md touch-manipulation outline-none",
    "p-2 -m-2 min-h-9 min-w-11",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
  )

  if (tapExplainer) {
    return (
      <Popover>
        <PopoverTrigger
          type="button"
          aria-label="How this pick was scored"
          className={triggerClassName}
        >
          {scoreFace}
        </PopoverTrigger>
        <PopoverContent
          side="left"
          sideOffset={8}
          align="center"
          className="w-fit max-w-[200px] border-0 bg-foreground px-3 py-1.5 text-xs text-background shadow-md"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {explainerBody}
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="How this pick was scored"
            className={triggerClassName}
          >
            {scoreFace}
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-[200px]">
          {explainerBody}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
