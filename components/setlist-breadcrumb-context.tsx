"use client"

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react"

export type BreadcrumbItem = { label: string; href: string }

type SetlistBreadcrumbContextValue = {
  setlistBreadcrumbs: BreadcrumbItem[] | null
  setSetlistBreadcrumbs: (items: BreadcrumbItem[] | null) => void
}

const SetlistBreadcrumbContext = createContext<
  SetlistBreadcrumbContextValue | undefined
>(undefined)

export function SetlistBreadcrumbProvider({ children }: { children: ReactNode }) {
  const [setlistBreadcrumbs, setSetlistBreadcrumbsState] = useState<
    BreadcrumbItem[] | null
  >(null)
  const setSetlistBreadcrumbs = useCallback((items: BreadcrumbItem[] | null) => {
    setSetlistBreadcrumbsState(items)
  }, [])
  return (
    <SetlistBreadcrumbContext.Provider
      value={{ setlistBreadcrumbs, setSetlistBreadcrumbs }}
    >
      {children}
    </SetlistBreadcrumbContext.Provider>
  )
}

export function useSetlistBreadcrumb() {
  const ctx = useContext(SetlistBreadcrumbContext)
  return (
    ctx ?? {
      setlistBreadcrumbs: null,
      setSetlistBreadcrumbs: () => {},
    }
  )
}
