"use client"

import { createContext, useContext } from "react"

/** Opens the WL Home v2 sign-in modal (same as My Show Stats / header Sign In). */
export const WlHomeV2OpenLoginContext = createContext<(() => void) | null>(
  null,
)

export function useWlHomeV2OpenLogin() {
  return useContext(WlHomeV2OpenLoginContext)
}
