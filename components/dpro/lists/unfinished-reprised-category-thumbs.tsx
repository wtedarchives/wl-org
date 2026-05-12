"use client"

import { useState } from "react"

export function UnfinishedReprisedCategoryThumb({ src }: { src: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return (
    <span className="inline-flex shrink-0 items-center !pr-2">
      <img
        src={src}
        alt=""
        className="size-5 shrink-0 rounded border border-[rgb(63,65,64)] object-cover"
        onError={() => setFailed(true)}
      />
    </span>
  )
}

export function UnfinishedLegacyListCategoryThumb({ src }: { src: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return (
    <img
      src={src}
      alt=""
      width={20}
      height={20}
      className="mx-auto size-5 shrink-0 aspect-square rounded object-cover border border-border"
      onError={() => setFailed(true)}
    />
  )
}
