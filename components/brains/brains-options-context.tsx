"use client"

import { createContext, useContext } from "react"

import {
  useBrainsEntryOptions,
  type BrainsEntryOptions,
} from "@/hooks/use-brains-entry-options"

const BrainsOptionsContext = createContext<BrainsEntryOptions | null>(null)

/**
 * Holds the reference lists once for the whole page.
 *
 * The setlist editor and the add-song dialog share one fetch of ~1.3k songs so an
 * added song is selectable immediately after `refresh()`.
 */
export function BrainsOptionsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const options = useBrainsEntryOptions()
  return (
    <BrainsOptionsContext.Provider value={options}>
      {children}
    </BrainsOptionsContext.Provider>
  )
}

export function useBrainsOptions(): BrainsEntryOptions {
  const ctx = useContext(BrainsOptionsContext)
  if (!ctx) {
    throw new Error(
      "useBrainsOptions must be used inside a BrainsOptionsProvider",
    )
  }
  return ctx
}
