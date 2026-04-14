"use client"

import { useCallback, useEffect, useState } from "react"

/**
 * Becomes `true` the first time the element intersects the viewport (plus `rootMargin`),
 * then stays `true` so content is not torn down when the user scrolls away.
 */
export function useOnceInView(rootMargin = "200px 0px") {
  const [active, setActive] = useState(false)
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const setRef = useCallback((node: HTMLDivElement | null) => {
    setElement(node)
  }, [])

  useEffect(() => {
    if (active || !element) return

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setActive(true)
        }
      },
      { root: null, rootMargin, threshold: 0 },
    )
    obs.observe(element)
    return () => obs.disconnect()
  }, [element, active, rootMargin])

  return { ref: setRef, active }
}
