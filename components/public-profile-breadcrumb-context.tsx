"use client"

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react"

type PublicProfileBreadcrumbContextValue = {
  publicProfileBreadcrumbLabel: string | null
  setPublicProfileBreadcrumbLabel: (label: string | null) => void
}

const PublicProfileBreadcrumbContext = createContext<
  PublicProfileBreadcrumbContextValue | undefined
>(undefined)

export function PublicProfileBreadcrumbProvider({
  children,
}: {
  children: ReactNode
}) {
  const [publicProfileBreadcrumbLabel, setPublicProfileBreadcrumbLabelState] =
    useState<string | null>(null)
  const setPublicProfileBreadcrumbLabel = useCallback(
    (label: string | null) => {
      setPublicProfileBreadcrumbLabelState(label)
    },
    []
  )
  return (
    <PublicProfileBreadcrumbContext.Provider
      value={{
        publicProfileBreadcrumbLabel,
        setPublicProfileBreadcrumbLabel,
      }}
    >
      {children}
    </PublicProfileBreadcrumbContext.Provider>
  )
}

export function usePublicProfileBreadcrumb() {
  const ctx = useContext(PublicProfileBreadcrumbContext)
  return (
    ctx ?? {
      publicProfileBreadcrumbLabel: null,
      setPublicProfileBreadcrumbLabel: () => {},
    }
  )
}
