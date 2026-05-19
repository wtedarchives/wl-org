import type { Metadata } from "next"

import { WlHomeV2 } from "@/components/wl-home-v2"

export const metadata: Metadata = {
  title: "Radio schedule image (temp)",
}

/**
 * Temporary entry point: opens the schedule PNG modal on load and bypasses the admin gate for it.
 * Remove before ship — see `RADIO_SCHEDULE_SHARE_TEMP_BYPASS_PATH` in `components/wl-home-v2/index.tsx`.
 */
export default function RadioScheduleTempPage() {
  return <WlHomeV2 />
}
