"use client"

import { createContext, useContext, useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"

export type YearLink = {
  year: string
  year_id: string
}

type YearsContextValue = {
  years: YearLink[]
  loading: boolean
}

const YearsContext = createContext<YearsContextValue | undefined>(undefined)

export function YearsProvider({ children }: { children: React.ReactNode }) {
  const [years, setYears] = useState<YearLink[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadYears = async () => {
      if (!supabase) {
        setLoading(false)
        return
      }
      try {
        const { data, error } = await supabase
          .from("years")
          .select("year, year_id")
          .order("year", { ascending: true })

        if (error) {
          // eslint-disable-next-line no-console
          console.error("Error loading years:", error)
          setLoading(false)
          return
        }

        if (data) {
          const processed = data.filter(
            (y): y is { year: string; year_id: string } =>
              typeof (y as any).year === "string" &&
              typeof (y as any).year_id === "string"
          )
          setYears(processed)
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Unexpected error loading years:", err)
      } finally {
        setLoading(false)
      }
    }

    loadYears()
  }, [])

  return (
    <YearsContext.Provider value={{ years, loading }}>
      {children}
    </YearsContext.Provider>
  )
}

export function useYears() {
  const ctx = useContext(YearsContext)
  if (!ctx) {
    throw new Error("useYears must be used within a YearsProvider")
  }
  return ctx
}

