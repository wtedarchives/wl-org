"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export function useYearsData() {
  const [years, setYears] = useState<string[]>([])
  const [yearFilter, setYearFilter] = useState("")

  useEffect(() => {
    const client = supabase
    if (!client) return

    client
      .from("years")
      .select("year")
      .order("year", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching years:", error)
          return
        }
        if (data?.length) {
          const list = data.map((r) => r.year)
          setYears(list)
          setYearFilter((prev) => prev || list[0])
        }
      })
  }, [])

  return { years, yearFilter, setYearFilter }
}
