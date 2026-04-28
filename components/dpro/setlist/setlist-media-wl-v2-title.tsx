import { Fragment } from "react"

const MEDIA_TITLE_SEGUE_ARROW = "\u2192"

/** WL v2: tighter title line-height + `→` matches setlist `.song-cell .segue`. */
export function WlHomeV2MediaReleaseTitle({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  if (!text.includes(MEDIA_TITLE_SEGUE_ARROW)) {
    return <p className={className}>{text}</p>
  }
  const segments = text.split(MEDIA_TITLE_SEGUE_ARROW)
  return (
    <p className={className}>
      {segments.map((seg, i) => (
        <Fragment key={i}>
          {seg}
          {i < segments.length - 1 ?
            <span className="wl-home-v2-setlist-media-title-segue">
              {MEDIA_TITLE_SEGUE_ARROW}
            </span>
          : null}
        </Fragment>
      ))}
    </p>
  )
}
