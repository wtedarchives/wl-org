"use client"

import { createContext, useContext } from "react"

import type { BrainsShowRef } from "@/types/brains"

export interface BrainsWorkValue {
  /** The show being edited. Null while nothing is selected. */
  showId: string | null
  /** Identity fields for the context header. */
  show: BrainsShowRef | null
  /**
   * True when writes will be refused — the window closed while the page was open,
   * or nothing is selected yet. Leaf controls read this instead of receiving a
   * prop through four levels of table markup.
   */
  readOnly: boolean
  /** Live assignment backing this session, null for admins (who need none). */
  assignmentId: string | null
  /** Re-ask the server for windows, e.g. after a 403 that looks like expiry. */
  refreshAccess: () => void
}

const BrainsWorkContext = createContext<BrainsWorkValue | null>(null)

export const BrainsWorkProvider = BrainsWorkContext.Provider

/**
 * The current brains working context.
 *
 * Throws outside a provider on purpose: a setlist control that renders without
 * knowing whether it is read-only is a bug, and failing loudly in development
 * beats silently allowing a write the server will reject.
 */
export function useBrainsWork(): BrainsWorkValue {
  const ctx = useContext(BrainsWorkContext)
  if (!ctx) {
    throw new Error("useBrainsWork must be used inside a BrainsWorkProvider")
  }
  return ctx
}
