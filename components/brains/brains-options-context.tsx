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
 * The setlist editor and the three add forms all need the song and personnel
 * lists — the editor to pick from, the add forms to check for duplicates. Sharing
 * one fetch keeps that to a single load of ~1.3k songs instead of two, and means an
 * added song is immediately selectable everywhere after one `refresh()`.
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
