import type { Metadata } from "next"

import { WlHomeV2ScheduleImagePageClient } from "@/components/wl-home-v2/wl-home-v2-schedule-image-page-client"

export const metadata: Metadata = {
  title: "Schedule Image",
  robots: { index: false, follow: false },
}

/** Admin (and allowlisted) tool: renders a downloadable 9∶16 schedule story. */
export default function RadioScheduleImagePage() {
  return <WlHomeV2ScheduleImagePageClient />
}
