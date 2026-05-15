"use client"

import { useEffect, useState } from "react"

/**
 * False on SSR and on the first client render so markup matches the static snapshot;
 * true after mount when browser URL, search params, and auth from storage are reliable.
 */
export function useClientMounted(): boolean {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}
