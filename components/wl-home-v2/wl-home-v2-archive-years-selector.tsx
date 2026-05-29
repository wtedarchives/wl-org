"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Fragment, useLayoutEffect, useRef, useState } from "react"

import { NAV_YEARS } from "@/components/app-sidebar.constants"
import { getYearArchiveUrl } from "@/lib/year-archive-url"
import { cn } from "@/lib/utils"

function setsEqual(a: ReadonlySet<number>, b: ReadonlySet<number>): boolean {
  if (a.size !== b.size) return false
  for (const value of a) {
    if (!b.has(value)) return false
  }
  return true
}

function useHiddenYearSeparators(containerRef: React.RefObject<HTMLElement | null>) {
  const [hiddenSepIndices, setHiddenSepIndices] = useState<ReadonlySet<number>>(
    () => new Set(),
  )

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const update = () => {
      const links = container.querySelectorAll<HTMLElement>("[data-year-link]")
      const hidden = new Set<number>()
      for (let i = 0; i < links.length - 1; i++) {
        if (links[i].offsetTop !== links[i + 1].offsetTop) {
          hidden.add(i)
        }
      }
      setHiddenSepIndices((prev) => (setsEqual(prev, hidden) ? prev : hidden))
    }

    update()
    const resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(container)

    if (typeof document !== "undefined" && document.fonts?.ready) {
      void document.fonts.ready.then(update)
    }

    return () => resizeObserver.disconnect()
  }, [containerRef])

  return hiddenSepIndices
}

export function WlHomeV2ArchiveYearsSelector({
  className,
  onNavigate,
}: {
  className?: string
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentYearId = searchParams.get("id")?.trim() ?? ""
  const containerRef = useRef<HTMLDivElement>(null)
  const hiddenSepIndices = useHiddenYearSeparators(containerRef)

  return (
    <div
      ref={containerRef}
      className={cn(
        "wl-home-v2-archive-subnav-row wl-home-v2-archive-subnav-row--years",
        className,
      )}
    >
      {NAV_YEARS.map((year, index) => {
        const href = getYearArchiveUrl(year.year_id)
        const isActive =
          pathname === "/archive/years" && currentYearId === year.year_id
        const isLast = index === NAV_YEARS.length - 1

        return (
          <Fragment key={year.year_id}>
            <Link
              href={href}
              data-year-link
              className={cn(
                "wl-home-v2-archive-subnav-link wl-home-v2-archive-subnav-link--year",
                isActive && "wl-home-v2-archive-subnav-link--active",
              )}
              onClick={onNavigate}
            >
              {year.year}
            </Link>
            {!isLast ?
              <span
                className={cn(
                  "wl-home-v2-archive-subnav-sep",
                  hiddenSepIndices.has(index) &&
                    "wl-home-v2-archive-subnav-sep--hidden",
                )}
                aria-hidden
              >
                •
              </span>
            : null}
          </Fragment>
        )
      })}
    </div>
  )
}
