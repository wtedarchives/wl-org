import type { Metadata } from "next"

import { WlHomeV2SocialRadioSchedulePageClient } from "@/components/wl-home-v2/wl-home-v2-social-radio-schedule-page-client"

export const metadata: Metadata = {
  title: "Social Radio Schedule",
}

export default function SocialRadioSchedulePage() {
  return <WlHomeV2SocialRadioSchedulePageClient />
}
