"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import type { ShowRelease } from "@/hooks/use-setlist-releases"

interface SetlistReleaseContainerProps {
  releases: ShowRelease[]
  onReleaseHover?: (releaseId: string | null) => void
}

export function SetlistReleaseContainer({
  releases,
  onReleaseHover,
}: SetlistReleaseContainerProps) {
  if (releases.length === 0) return null

  return (
    <Card className="border-border/60 bg-card/80 py-0">
      <CardContent className="p-3">
        <p className="text-xs font-medium text-foreground mb-2">Releases</p>
        <ul className="space-y-2">
          {releases.map((r) => (
            <li
              key={r.release_id}
              className="flex items-center gap-2"
              onMouseEnter={() => onReleaseHover?.(r.release_id)}
              onMouseLeave={() => onReleaseHover?.(null)}
            >
              {r.release_artwork && (
                <div className="relative size-10 shrink-0 overflow-hidden rounded border border-border">
                  <Image
                    src={r.release_artwork}
                    alt=""
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="text-xs font-medium text-foreground line-clamp-1">
                  {r.release_displayname ?? r.release_id}
                </span>
                {r.release_link && (
                  <a
                    href={r.release_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-muted-foreground hover:underline block truncate"
                  >
                    {r.release_service ?? "Listen"}
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
