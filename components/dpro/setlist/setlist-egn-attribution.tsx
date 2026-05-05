"use client"

import Image from "next/image"

import { cn } from "@/lib/utils"

const EGN_BG = "#7291ca"
const EGN_BORDER = "#5a73a3"

export function SetlistEgnAttribution({ className }: { className?: string }) {
  return (
    <a
      href="https://elgoose.net"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Visit ElGoose.Net (opens in new tab)"
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-lg border p-3 text-white no-underline transition-opacity hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:gap-4 sm:p-4",
        className,
      )}
      style={{
        backgroundColor: EGN_BG,
        borderColor: EGN_BORDER,
      }}
    >
      <Image
        src="/EGN.jpg"
        alt=""
        width={52}
        height={52}
        unoptimized
        className="h-11 w-11 shrink-0 rounded-full object-cover sm:h-[52px] sm:w-[52px]"
      />
      <p className="min-w-0 font-mono text-sm font-medium leading-tight text-white">
        This setlist has data and information sourced from ElGoose.Net.
      </p>
    </a>
  )
}
