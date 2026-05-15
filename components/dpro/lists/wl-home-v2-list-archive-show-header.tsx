"use client"

import {
  CategoryCompleteRotatingArtwork,
  CoverSongsRotatingArtwork,
  DripfieldRotatingArtwork,
} from "@/components/dpro/rotating-bandcamp-artwork"

export type WlHomeV2ListArchiveHeaderArtwork =
  | "cover-songs"
  | "category-complete"
  | "dripfield"
  | "none"

const rotatingArtClassName =
  "wl-home-v2-list-archive-header-rotating-art relative z-[3] float-right mb-2 ml-3 size-10 shrink-0 border-[rgb(49,51,49)]"

export function WlHomeV2ListArchiveShowHeader({
  listName,
  listDescription,
  artwork = "cover-songs",
}: {
  listName: string
  listDescription?: string | null
  artwork?: WlHomeV2ListArchiveHeaderArtwork
}) {
  const desc = listDescription?.trim() ?? ""

  const rotating =
    artwork === "none" ? null
    : artwork === "category-complete" ?
      <CategoryCompleteRotatingArtwork
        className={rotatingArtClassName}
        imageSizes="40px"
      />
    : artwork === "dripfield" ?
      <DripfieldRotatingArtwork
        className={rotatingArtClassName}
        imageSizes="40px"
      />
    : <CoverSongsRotatingArtwork
        className={rotatingArtClassName}
        imageSizes="40px"
      />

  return (
    <div className="show-header">
      <div className="left">
        <div className="wl-home-v2-list-archive-header-text-wrap">
          {rotating}
          <div className="show-header-title-row">
            <h1 className="show-header-heading">
              <span className="date">{listName}</span>
            </h1>
          </div>
          {desc ?
            <div className="venue wl-home-v2-list-header-desc">
              <span className="venue-subvenue-text">{desc}</span>
            </div>
          : null}
        </div>
      </div>
    </div>
  )
}
