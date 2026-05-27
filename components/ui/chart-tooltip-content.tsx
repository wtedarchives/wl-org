"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { getPayloadConfigFromPayload } from "@/components/ui/chart-payload-config"
import type { ChartConfig } from "@/components/ui/chart-types"
import { cn } from "@/lib/utils"

function ChartTooltipIndicatorDot({ fill }: { fill: string }) {
  return (
    <svg
      className="shrink-0"
      width={10}
      height={10}
      viewBox="0 0 10 10"
      aria-hidden
    >
      <rect x="1" y="1" width="8" height="8" rx="2" fill={fill} />
    </svg>
  )
}

function ChartTooltipIndicatorLine({ fill }: { fill: string }) {
  return (
    <svg
      className="w-1 shrink-0"
      width={4}
      height={10}
      viewBox="0 0 4 10"
      aria-hidden
    >
      <rect width="4" height="10" rx="1" fill={fill} />
    </svg>
  )
}

function ChartTooltipIndicatorDashed({
  fill,
  nestLabel,
}: {
  fill: string
  nestLabel: boolean
}) {
  return (
    <svg
      className={cn("w-0 shrink-0", nestLabel && "my-0.5")}
      width={6}
      height={10}
      viewBox="0 0 6 10"
      aria-hidden
    >
      <line
        x1="3"
        y1="0"
        x2="3"
        y2="10"
        stroke={fill}
        strokeWidth={1.5}
        strokeDasharray="3 2"
      />
    </svg>
  )
}

export function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
  config,
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
  React.ComponentProps<"div"> & {
    hideLabel?: boolean
    hideIndicator?: boolean
    indicator?: "line" | "dot" | "dashed"
    nameKey?: string
    labelKey?: string
    config: ChartConfig
  }) {
  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null
    }

    const [item] = payload
    const key = `${labelKey || item?.dataKey || item?.name || "value"}`
    const itemConfig = getPayloadConfigFromPayload(config, item, key)
    const value =
      !labelKey && typeof label === "string"
        ? config[label as keyof typeof config]?.label || label
        : itemConfig?.label

    if (labelFormatter) {
      return (
        <div className={cn("font-medium", labelClassName)}>
          {labelFormatter(value, payload)}
        </div>
      )
    }

    if (!value) {
      return null
    }

    return <div className={cn("font-medium", labelClassName)}>{value}</div>
  }, [
    label,
    labelFormatter,
    payload,
    hideLabel,
    labelClassName,
    config,
    labelKey,
  ])

  if (!active || !payload?.length) {
    return null
  }

  const nestLabel = payload.length === 1 && indicator !== "dot"

  return (
    <div
      className={cn(
        "grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs/relaxed shadow-xl",
        className,
      )}
    >
      {!nestLabel ? tooltipLabel : null}
      <div className="grid gap-1.5">
        {payload
          .filter((item) => item.type !== "none")
          .map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color || item.payload.fill || item.color

            return (
              <div
                key={item.dataKey}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center",
                )}
              >
                {formatter && item?.value !== undefined && item.name ?
                  formatter(item.value, item.name, item, index, item.payload)
                : <>
                    {itemConfig?.icon ?
                      <itemConfig.icon />
                    : !hideIndicator && (
                        <>
                          {indicator === "dot" && (
                            <ChartTooltipIndicatorDot
                              fill={String(indicatorColor ?? "currentColor")}
                            />
                          )}
                          {indicator === "line" && (
                            <ChartTooltipIndicatorLine
                              fill={String(indicatorColor ?? "currentColor")}
                            />
                          )}
                          {indicator === "dashed" && (
                            <ChartTooltipIndicatorDashed
                              fill={String(indicatorColor ?? "currentColor")}
                              nestLabel={nestLabel}
                            />
                          )}
                        </>
                      )
                    }
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center",
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">
                          {itemConfig?.label || item.name}
                        </span>
                      </div>
                      {item.value && (
                        <span className="font-mono font-medium text-foreground tabular-nums">
                          {item.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </>
                }
              </div>
            )
          })}
      </div>
    </div>
  )
}
