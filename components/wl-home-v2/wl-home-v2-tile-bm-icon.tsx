import Image from "next/image"

type WlHomeV2TileBmIconProps = {
  defaultSrc: string
  bmYellowSrc: string
  bmPinkSrc: string
  width?: number
  height?: number
}

export function WlHomeV2TileBmIcon({
  defaultSrc,
  bmYellowSrc,
  bmPinkSrc,
  width = 110,
  height = 110,
}: WlHomeV2TileBmIconProps) {
  return (
    <>
      <Image
        src={defaultSrc}
        alt=""
        width={width}
        height={height}
        className="tile-icon-img tile-icon-img--default"
      />
      <Image
        src={bmYellowSrc}
        alt=""
        width={width}
        height={height}
        className="tile-icon-img tile-icon-img--bm-default"
      />
      <Image
        src={bmPinkSrc}
        alt=""
        width={width}
        height={height}
        className="tile-icon-img tile-icon-img--bm-hover"
      />
    </>
  )
}
