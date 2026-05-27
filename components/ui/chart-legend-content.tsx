"use client"

import * as RechartsPrimitive from "recharts"

import { getPayloadConfigFromPayload } from "@/components/ui/chart-payload-config"
import type { ChartConfig } from "@/components/ui/chart-types"
import { cn } from "@/lib/utils"

function ChartLegendColorSwatch({ color }: { color: string | undefined }) {
  const fill = color ?? "currentColor"
  return (
    <svg
      className="h-2 w-2 shrink-0"
      width={8}
      height={8}
      viewBox="0 0 8 8"
      aria-hidden
    >
      <rect width="8" height="8" rx="2" fill={fill} />
    </svg>
  )
}

export function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = "bottom",
  nameKey,
  config,
}: React.ComponentProps<"div"> &
  Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
    hideIcon?: boolean
    nameKey?: string
    config: ChartConfig
  }) {
  if (!payload?.length) {
    return null
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className,
      )}
    >
      {payload
        .filter((item) => item.type !== "none")
        .map((item) => {
          const key = `${nameKey || item.dataKey || "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)

          return (
            <div
              key={item.value}
              className={cn(
                "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground",
              )}
            >
              {itemConfig?.icon && !hideIcon ?
                <itemConfig.icon />
              : <ChartLegendColorSwatch color={item.color} />}
              {itemConfig?.label}
            </div>
          )
        })}
    </div>
  )
}
