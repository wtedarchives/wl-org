"use client"

import { createContext, useContext } from "react"

export const WlHomeV2OpenSettingsContext = createContext<(() => void) | null>(
  null,
)

export function useWlHomeV2OpenSettings() {
  return useContext(WlHomeV2OpenSettingsContext)
}
