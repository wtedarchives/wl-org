"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import type { SongPick } from "./types"
import { getResultDescription } from "./utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface TooltipContainerProps {
  result: string | undefined
  score: number | undefined
  pick?: SongPick
}

export function TooltipContainer({
  result,
  score,
  pick,
}: TooltipContainerProps) {
  const html = getResultDescription(
    result,
    pick?.showcloser_correct ?? false,
    pick?.showopener_correct ?? false
  )

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-center cursor-pointer">
            {result === "not_played" ? (
              <span className="inline-flex items-center justify-center size-5 rounded bg-red-600">
                <X className="size-3 text-white" />
              </span>
            ) : (
              <span className="font-medium text-xs text-white bg-green-600 rounded px-1 py-0.5">
                +{score}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-[200px]">
          <div
            className="text-[11px] leading-tight"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
