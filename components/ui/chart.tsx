"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { ChartLegendContent } from "@/components/ui/chart-legend-content"
import { ChartStyle } from "@/components/ui/chart-style"
import { ChartTooltipContent } from "@/components/ui/chart-tooltip-content"
import {
  type ChartConfig,
  type ChartContextProps,
} from "@/components/ui/chart-types"
import { cn } from "@/lib/utils"

export type { ChartConfig } from "@/components/ui/chart-types"

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"]
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

function ChartTooltipContentWithContext(
  props: Omit<React.ComponentProps<typeof ChartTooltipContent>, "config">,
) {
  const { config } = useChart()
  return <ChartTooltipContent {...props} config={config} />
}

const ChartLegend = RechartsPrimitive.Legend

function ChartLegendContentWithContext(
  props: Omit<React.ComponentProps<typeof ChartLegendContent>, "config">,
) {
  const { config } = useChart()
  return <ChartLegendContent {...props} config={config} />
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContentWithContext as ChartTooltipContent,
  ChartLegend,
  ChartLegendContentWithContext as ChartLegendContent,
  ChartStyle,
}
