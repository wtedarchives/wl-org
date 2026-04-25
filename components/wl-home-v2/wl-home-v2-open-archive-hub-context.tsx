"use client"

import { createContext, useContext } from "react"

/** Opens the WTED Archives hub modal without navigating (same as header "Archives"). */
export const WlHomeV2OpenArchiveHubContext = createContext<(() => void) | null>(
  null,
)

export function useWlHomeV2OpenArchiveHub() {
  return useContext(WlHomeV2OpenArchiveHubContext)
}
