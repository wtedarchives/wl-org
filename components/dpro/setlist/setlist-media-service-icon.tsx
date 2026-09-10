import Image from "next/image"
import { Parallelogram, SpotifyLogo, YoutubeLogo } from "@phosphor-icons/react"

import {
  canonicalizeReleaseServiceKey,
  SERVICE_COLORS,
} from "@/components/dpro/setlist/setlist-media-section.model"

const SERVICE_IMAGE_SRC: Record<string, string> = {
  nugs: "/NugsColor.png",
  discogs: "/discogs.png",
  vinyl: "/vinyl.png",
  "internet archive": "/InternetArchive.png",
}

export function ReleaseServiceIcon({
  service,
  size = 14,
}: {
  service: string | null
  size?: number
}) {
  if (!service?.trim()) return null
  const key = canonicalizeReleaseServiceKey(service)
  const imageSrc = SERVICE_IMAGE_SRC[key]
  if (imageSrc) {
    return (
      <Image
        src={imageSrc}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-sm object-contain"
      />
    )
  }
  if (key === "youtube") {
    return (
      <YoutubeLogo
        className="shrink-0"
        size={size}
        weight="fill"
        style={{ color: SERVICE_COLORS.youtube }}
        aria-hidden
      />
    )
  }
  if (key === "spotify") {
    return (
      <SpotifyLogo
        className="shrink-0"
        size={size}
        weight="fill"
        style={{ color: SERVICE_COLORS.spotify }}
        aria-hidden
      />
    )
  }
  if (key === "bandcamp") {
    return (
      <Parallelogram
        className="shrink-0"
        size={size}
        weight="fill"
        style={{ color: SERVICE_COLORS.bandcamp }}
        aria-hidden
      />
    )
  }
  return null
}
