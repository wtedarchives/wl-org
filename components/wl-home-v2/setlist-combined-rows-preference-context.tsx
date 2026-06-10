"use client"

import { createContext, useContext, type ReactNode } from "react"

import { useAuth } from "@/components/auth-context"
import { useSetlistCombinedRowsPreference } from "@/hooks/use-setlist-combined-rows-preference"

type SetlistCombinedRowsPreferenceContextValue = {
  /** When true, pair/reprise rows start expanded on each setlist load (default; condensed is opt-in). */
  expandCombinedOnLoad: boolean
  preferenceLoading: boolean
  preferenceSaving: boolean
  saveExpandCombinedOnLoad: (next: boolean) => Promise<boolean>
}

const SetlistCombinedRowsPreferenceContext =
  createContext<SetlistCombinedRowsPreferenceContextValue>({
    expandCombinedOnLoad: true,
    preferenceLoading: false,
    preferenceSaving: false,
    saveExpandCombinedOnLoad: async () => false,
  })

export function SetlistCombinedRowsPreferenceProvider({
  children,
}: {
  children: ReactNode
}) {
  const { session } = useAuth()
  const profileId = session?.profileId
  const {
    expandCombinedOnLoad,
    saveExpandCombinedOnLoad,
    loading,
    saving,
  } = useSetlistCombinedRowsPreference(profileId, session?.token)

  return (
    <SetlistCombinedRowsPreferenceContext.Provider
      value={{
        expandCombinedOnLoad,
        preferenceLoading: Boolean(profileId) && loading,
        preferenceSaving: saving,
        saveExpandCombinedOnLoad,
      }}
    >
      {children}
    </SetlistCombinedRowsPreferenceContext.Provider>
  )
}

export function useSetlistCombinedRowsPreferenceContext() {
  return useContext(SetlistCombinedRowsPreferenceContext)
}
