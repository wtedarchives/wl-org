"use client"

import { useCustomIosRadioPlayer } from "@/components/persistent-radio"
import { WlHomeV2 } from "@/components/wl-home-v2"
import { IosNowPlaying } from "@/components/wted/ios-radio/ios-now-playing"

export function WlHomeV2ListenView() {
  const useCustomPlayer = useCustomIosRadioPlayer()

  return (
    <WlHomeV2>
      {useCustomPlayer ? <IosNowPlaying /> : null}
    </WlHomeV2>
  )
}
