"use client"

import React, { useEffect, useState } from "react"

const ROTATE_INTERVAL_MS = 5000

export function AutoCarousel({
  children,
  intervalMs = ROTATE_INTERVAL_MS,
  className,
}: {
  children: React.ReactNode
  intervalMs?: number
  className?: string
}) {
  const [index, setIndex] = useState(0)
  const items = React.Children.toArray(children).filter(Boolean)
  const count = items.length

  useEffect(() => {
    if (count <= 1) return
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % count)
    }, intervalMs)
    return () => clearInterval(id)
  }, [count, intervalMs])

  if (count === 0) return null
  const safeIndex = count > 1 ? index % count : 0

  return (
    <div className={className}>
      <div className="grid min-h-0">
        {items.map((item, i) => (
          <div
            key={i}
            className={`col-start-1 row-start-1 min-h-0 transition-opacity duration-300 ${
              i === safeIndex
                ? "opacity-100 z-10"
                : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            {item}
          </div>
        ))}
      </div>
      {count > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === safeIndex
                  ? "w-4 bg-wl-white/80"
                  : "w-1.5 bg-wl-white/40 hover:bg-wl-white/60"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
