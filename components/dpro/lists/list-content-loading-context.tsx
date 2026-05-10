"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react"

interface ListContentLoadingContextValue {
  setLoading: (loading: boolean) => void
  setProgress: (progress: number) => void
  loading: boolean
  progress: number
}

const ListContentLoadingContext =
  createContext<ListContentLoadingContextValue | null>(null)

export function ListContentLoadingProvider({
  children,
  initialLoading = true,
}: {
  children: ReactNode
  initialLoading?: boolean
}) {
  const [loading, setLoadingState] = useState(initialLoading)
  const [progress, setProgressState] = useState(0)

  const setLoading = useCallback((value: boolean) => {
    setLoadingState(value)
    if (value) setProgressState(0)
  }, [])

  const setProgress = useCallback((value: number) => {
    setProgressState(Math.min(100, Math.max(0, value)))
  }, [])

  const value = useMemo(
    () => ({ setLoading, setProgress, loading, progress }),
    [setLoading, setProgress, loading, progress],
  )

  return (
    <ListContentLoadingContext.Provider value={value}>
      {children}
    </ListContentLoadingContext.Provider>
  )
}

export function useListContentLoading() {
  const ctx = useContext(ListContentLoadingContext)
  return ctx
}
