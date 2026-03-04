"use client"

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react"

type YearBreadcrumbContextValue = {
  yearLabel: string | null
  setYearLabel: (label: string | null) => void
}

const YearBreadcrumbContext = createContext<
  YearBreadcrumbContextValue | undefined
>(undefined)

export function YearBreadcrumbProvider({ children }: { children: ReactNode }) {
  const [yearLabel, setYearLabelState] = useState<string | null>(null)
  const setYearLabel = useCallback((label: string | null) => {
    setYearLabelState(label)
  }, [])
  return (
    <YearBreadcrumbContext.Provider value={{ yearLabel, setYearLabel }}>
      {children}
    </YearBreadcrumbContext.Provider>
  )
}

export function useYearBreadcrumb() {
  const ctx = useContext(YearBreadcrumbContext)
  return ctx ?? { yearLabel: null, setYearLabel: () => {} }
}
