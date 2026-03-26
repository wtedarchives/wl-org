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
  yearDetailHref: string | null
  setYearBreadcrumb: (payload: {
    label: string | null
    detailHref: string | null
  }) => void
}

const YearBreadcrumbContext = createContext<
  YearBreadcrumbContextValue | undefined
>(undefined)

export function YearBreadcrumbProvider({ children }: { children: ReactNode }) {
  const [yearLabel, setYearLabelState] = useState<string | null>(null)
  const [yearDetailHref, setYearDetailHrefState] = useState<string | null>(null)
  const setYearBreadcrumb = useCallback(
    (payload: { label: string | null; detailHref: string | null }) => {
      setYearLabelState(payload.label)
      setYearDetailHrefState(payload.detailHref)
    },
    [],
  )
  return (
    <YearBreadcrumbContext.Provider
      value={{ yearLabel, yearDetailHref, setYearBreadcrumb }}
    >
      {children}
    </YearBreadcrumbContext.Provider>
  )
}

export function useYearBreadcrumb() {
  const ctx = useContext(YearBreadcrumbContext)
  return (
    ctx ?? {
      yearLabel: null,
      yearDetailHref: null,
      setYearBreadcrumb: () => {},
    }
  )
}
