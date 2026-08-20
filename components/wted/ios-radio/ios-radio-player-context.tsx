"use client"

import { createContext, useContext, type ReactNode } from "react"

import {
  useIosRadioPlayer,
  type IosRadioPlayerState,
} from "@/hooks/use-ios-radio-player"

const IosRadioPlayerContext = createContext<IosRadioPlayerState | null>(null)

export function IosRadioPlayerProvider({
  enabled = true,
  children,
}: {
  enabled?: boolean
  children: ReactNode
}) {
  const player = useIosRadioPlayer(enabled)
  return (
    <IosRadioPlayerContext.Provider value={player}>
      {children}
    </IosRadioPlayerContext.Provider>
  )
}

export function useIosRadioPlayerContext() {
  const ctx = useContext(IosRadioPlayerContext)
  if (!ctx) {
    throw new Error("useIosRadioPlayerContext requires IosRadioPlayerProvider")
  }
  return ctx
}
