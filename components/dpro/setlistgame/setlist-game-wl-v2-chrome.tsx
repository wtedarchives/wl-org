"use client"

import {
  createContext,
  useContext,
  type ReactNode,
} from "react"

import { cn } from "@/lib/utils"

const SetlistGameWlV2ChromeContext = createContext(false)

export function SetlistGameWlV2ChromeProvider({
  children,
}: {
  children: ReactNode
}) {
  return (
    <SetlistGameWlV2ChromeContext.Provider value={true}>
      {children}
    </SetlistGameWlV2ChromeContext.Provider>
  )
}

export function useSetlistGameWlV2Chrome(): boolean {
  return useContext(SetlistGameWlV2ChromeContext)
}

/** Tour dates table (`TourShowsTable` wlHomeV2) — scroll, header row, cells. */
export const sgWlV2 = {
  tableScroll: "wl-home-v2-years-table-scroll min-h-0",
  table: "min-w-max text-[11px] wl-home-v2-years-table",
  headRow: "border-0 border-b bg-black/25 hover:bg-black/25",
  th: "!px-2 !py-0.5 text-[11px] font-medium",
  td: "!px-2 !py-0.5 text-[11px]",
  bodyRow:
    "border-b bg-transparent transition-colors hover:bg-[rgba(88,200,174,0.11)]",
  emptyMsg: "px-1 py-4 text-center text-xs text-white/65",
  sortBtn:
    "flex min-h-11 w-full items-center gap-1 px-1 py-0.5 md:min-h-0 cursor-pointer rounded-sm text-white/90 transition-colors hover:bg-white/10",
} as const

export function SetlistGameWlV2Panel({
  title,
  titleRight,
  children,
}: {
  title: ReactNode
  titleRight?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="widget-panel wl-home-v2-years-shows-panel wl-home-v2-years-shows-panel--natural flex min-h-0 min-w-0 flex-col overflow-hidden">
      <div
        className={cn(
          "wp-head wl-home-v2-years-shows-wp-head wl-home-v2-tours-shows-wp-head",
          "flex w-full min-w-0 shrink-0 flex-row flex-wrap items-center gap-x-3 gap-y-1",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-x-2">
          {typeof title === "string" ?
            <span className="wp-head-date min-w-0 truncate">{title}</span>
          : title}
        </div>
        {titleRight ?
          <div className="shrink-0">{titleRight}</div>
        : null}
      </div>
      {children}
    </div>
  )
}
