"use client"

import { useMemo } from "react"
import { Label, Pie, PieChart } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import { PLACEMENT_COLORS } from "@/lib/song-performance-utils"
import type { PlacementStat } from "@/types/song"

function placementToKey(placement: string): string {
  return placement.replace(/\s+/g, "_").toLowerCase()
}

interface SongPlacementPillProps {
  placementStats: PlacementStat[]
}

export function SongPlacementPill({ placementStats }: SongPlacementPillProps) {
  const { chartData, chartConfig, totalPerformances, sortedStats } =
    useMemo(() => {
      if (!placementStats?.length) {
        return {
          chartData: [] as Array<{ name: string; value: number; fill: string }>,
          chartConfig: {} as ChartConfig,
          totalPerformances: 0,
          sortedStats: [] as PlacementStat[],
        }
      }

      const sorted = [...placementStats].sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) return a.order - b.order
        if (a.order !== undefined) return -1
        if (b.order !== undefined) return 1
        return a.placement.localeCompare(b.placement)
      })

      const total = placementStats.reduce((sum, s) => sum + s.count, 0)
      const data = sorted.map((s) => {
        const key = placementToKey(s.placement)
        return {
          name: s.placement,
          value: s.count,
          fill: `var(--color-${key})`,
        }
      })
      const config: ChartConfig = {}
      sorted.forEach((s) => {
        const key = placementToKey(s.placement)
        config[key] = {
          label: s.placement,
          color: PLACEMENT_COLORS[s.placement] ?? "#000000",
        }
      })

      return {
        chartData: data,
        chartConfig: config,
        totalPerformances: total,
        sortedStats: sorted,
      }
    }, [placementStats])

  if (!placementStats?.length || totalPerformances === 0) return null

  return (
    <div className="space-y-3 w-full min-w-0 flex flex-col items-center">
      <ChartContainer
        config={chartConfig}
        className="w-full max-w-[200px] aspect-square min-w-0"
      >
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={({ active }) =>
              active ? (
                <div className="grid min-w-[200px] gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
                  {sortedStats.map((stat) => (
                    <div
                      key={stat.placement}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="size-2.5 rounded-sm shrink-0"
                          style={{
                            backgroundColor:
                              PLACEMENT_COLORS[stat.placement] ?? "#000000",
                          }}
                        />
                        <span className="text-muted-foreground">
                          {stat.placement}
                        </span>
                      </div>
                      <span className="font-medium tabular-nums text-foreground">
                        {stat.count} ({stat.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              ) : null
            }
          />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            strokeWidth={2}
          >
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy as number) - 12}
                        className="fill-foreground text-2xl font-bold"
                      >
                        {totalPerformances.toLocaleString()}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy as number) + 12}
                        className="fill-muted-foreground text-xs"
                      >
                        Performances
                      </tspan>
                    </text>
                  )
                }
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>
    </div>
  )
}
