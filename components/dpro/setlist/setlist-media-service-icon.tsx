import Image from "next/image"
import { Parallelogram, SpotifyLogo, YoutubeLogo } from "@phosphor-icons/react"

import { SERVICE_COLORS } from "@/components/dpro/setlist/setlist-media-section.model"

export function ReleaseServiceIcon({ service }: { service: string | null }) {
  if (!service?.trim()) return null
  const key = service.toLowerCase().trim()
  if (key === "nugs") {
    return (
      <Image
        src="/NugsColor.png"
        alt=""
        width={14}
        height={14}
        className="shrink-0 rounded-sm object-contain"
      />
    )
  }
  if (key === "discogs") {
    return (
      <Image
        src="/discogs.png"
        alt=""
        width={14}
        height={14}
        className="shrink-0 rounded-sm object-contain"
      />
    )
  }
  if (key === "youtube") {
    return (
      <YoutubeLogo
        className="shrink-0"
        size={14}
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
        size={14}
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
        size={14}
        weight="fill"
        style={{ color: SERVICE_COLORS.bandcamp }}
        aria-hidden
      />
    )
  }
  return null
}
