"use client"

import Image from "next/image"

import { Button } from "@/components/ui/button"

export function SetlistCommunityForumButton({
  href,
}: {
  href: string | null | undefined
}) {
  if (!href) return null

  return (
    <Button
      type="button"
      variant="outline"
      className="h-auto w-full touch-manipulation justify-center gap-2 border-wl-green/60 !bg-wl-dark-green py-1 text-sm font-medium text-foreground transition-colors duration-200 ease-out hover:border-wl-orange hover:bg-wl-orange hover:text-white"
      onClick={() => window.open(href, "_blank", "noopener,noreferrer")}
    >
      <Image
        src="/WL.png"
        alt=""
        width={20}
        height={20}
        className="size-5 shrink-0"
      />
      <span className="text-balance text-center leading-tight tracking-tight font-bold text-[0.82rem]">
        Chat in the Wysteria Lane Community
      </span>
    </Button>
  )
}
