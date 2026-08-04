"use client"

import { createContext, useContext } from "react"

/** Opens the site-wide archive search modal. */
export const WlHomeV2OpenSiteSearchContext = createContext<(() => void) | null>(
  null,
)

export function useWlHomeV2OpenSiteSearch() {
  return useContext(WlHomeV2OpenSiteSearchContext)
}
