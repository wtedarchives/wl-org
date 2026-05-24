"use client"

import Image from "next/image"

import { cn } from "@/lib/utils"

import "./setlist-egn-attribution.css"

export function SetlistEgnAttribution({ className }: { className?: string }) {
  return (
    <a
      href="https://elgoose.net"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Visit ElGoose.Net (opens in new tab)"
      className={cn(
        "setlist-egn-attribution flex min-w-0 items-center gap-3 rounded-lg border p-3 text-white no-underline transition-opacity hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:gap-4 sm:p-4",
        className,
      )}
    >
      <Image
        src="/EGN.jpg"
        alt=""
        width={52}
        height={52}
        unoptimized
        className="h-11 w-11 shrink-0 rounded-full object-cover sm:h-[52px] sm:w-[52px]"
      />
      <p className="setlist-egn-attribution__text min-w-0 font-mono text-sm font-medium text-white">
        This setlist has data and information sourced from ElGoose.Net.
      </p>
    </a>
  )
}
