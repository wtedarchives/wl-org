"use client"

import Image from "next/image"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

export function ColumnBanner({
  src,
  alt,
  label,
  description,
  href,
  dim = false,
  mutedBg = false,
  rightContent,
  logoSrc,
}: {
  src: string
  alt: string
  label: string
  description?: string
  href?: string
  dim?: boolean
  mutedBg?: boolean
  rightContent?: React.ReactNode
  logoSrc?: string
}) {
  const brightnessClasses = dim
    ? "brightness-[0.55] group-hover:brightness-[0.75]"
    : mutedBg
      ? "brightness-[0.7] group-hover:brightness-[0.85]"
      : "brightness-90 group-hover:brightness-95"

  const wrapperClassName =
    "group relative flex w-full overflow-hidden rounded-xl border border-wl-dark-grey/50 bg-[#313a34] transition-all duration-200"

  const textOverlay = (
    <div className="relative flex w-full flex-col items-center justify-center gap-0.5 px-4 py-6">
      {logoSrc ? (
        <Image
          src={logoSrc}
          alt=""
          width={64}
          height={64}
          className="h-14 w-auto object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] sm:h-16"
        />
      ) : null}
      <span className="text-center text-xl font-semibold leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] sm:text-2xl">
        {label}
      </span>
      {description ? (
        <span className="mt-1.5 flex items-center gap-1.5 text-center text-sm font-medium leading-tight text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] sm:text-base">
          {description}
          <ExternalLink className="size-4 shrink-0" aria-hidden />
        </span>
      ) : null}
    </div>
  )

  if (rightContent) {
    const isExternal = href?.startsWith("http")
    return (
      <div className={`${wrapperClassName} flex-col xl:flex-row`}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 1024px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className={`object-cover grayscale transition-all duration-300 ease-out group-hover:scale-105 group-hover:blur-[1px] group-hover:grayscale-0 ${brightnessClasses}`}
          unoptimized
        />
        {href ? (
          <Link
            href={href}
            className="relative z-10 flex min-w-0 flex-1 items-center justify-center"
            {...(isExternal && { target: "_blank", rel: "noopener noreferrer" })}
          >
            {textOverlay}
          </Link>
        ) : (
          <div className="relative z-10 flex min-w-0 flex-1 items-center justify-center">
            {textOverlay}
          </div>
        )}
        <div className="relative z-10 flex w-full shrink-0 flex-row flex-wrap items-stretch justify-center gap-3 border-t border-wl-dark-grey/50 px-4 py-4 xl:w-fit xl:flex-col xl:border-l xl:border-t-0">
          {rightContent}
        </div>
      </div>
    )
  }

  const content = (
    <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 1024px) 100vw, (max-width: 1280px) 50vw, 33vw"
        className={`object-cover grayscale transition-all duration-300 ease-out group-hover:scale-105 group-hover:blur-[1px] group-hover:grayscale-0 ${brightnessClasses}`}
        unoptimized
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 px-4">
        {logoSrc ? (
          <Image
            src={logoSrc}
            alt=""
            width={64}
            height={64}
            className="h-14 w-auto object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] sm:h-16"
          />
        ) : null}
        <span className="text-center text-xl font-semibold leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] sm:text-2xl">
          {label}
        </span>
        {description ? (
          <span className="mt-1.5 flex items-center gap-1.5 text-center text-sm font-medium leading-tight text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] sm:text-base">
            {description}
            <ExternalLink className="size-4 shrink-0" aria-hidden />
          </span>
        ) : null}
      </div>
    </div>
  )

  if (href) {
    const isExternal = href.startsWith("http")
    return (
      <Link
        href={href}
        className={`${wrapperClassName} h-full min-h-0 flex-col`}
        {...(isExternal && { target: "_blank", rel: "noopener noreferrer" })}
      >
        {content}
      </Link>
    )
  }

  return (
    <div className={`${wrapperClassName} h-full min-h-0 flex-col`}>
      {content}
    </div>
  )
}
