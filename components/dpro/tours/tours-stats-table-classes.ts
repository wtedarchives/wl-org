import { cn } from "@/lib/utils"

/** WL + legacy: duration column `<td>` classnames — keep Longest Songs and Top Returning in lockstep. */
export function toursStatsDurationTdClassnames(
  wlHomeV2: boolean,
  mutedRow: string,
) {
  return cn(
    wlHomeV2 ?
      cn(
        "wl-home-v2-tours-stats-cell wl-home-v2-tours-stats-cell--duration text-center font-medium tabular-nums",
        mutedRow,
      )
    : cn(
        "py-1.5 text-center font-medium tabular-nums",
        mutedRow,
      ),
  )
}
