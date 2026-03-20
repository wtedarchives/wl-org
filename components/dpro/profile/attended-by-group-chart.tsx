"use client"

import { useState, useEffect } from "react"
import { Pie, PieChart, Cell } from "recharts"
import { supabase } from "@/lib/supabase"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"

const CHART_COLORS = [
  "var(--wl-green)",
  "var(--wl-orange)",
  "#3498DB",
  "#E74C3C",
  "#2ECC71",
  "#F39C12",
  "#9B59B6",
  "#34495E",
]

interface AttendedByGroupChartProps {
  userId: string | null
  isOwnProfile: boolean
  username?: string | null
  refetchKey?: number
}

interface ChartDataItem {
  name: string
  value: number
  fill: string
}

export function AttendedByGroupChart({
  userId,
  isOwnProfile,
  username,
  refetchKey = 0,
}: AttendedByGroupChartProps) {
  const [chartData, setChartData] = useState<ChartDataItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const client = supabase
    if (!client) {
      setLoading(false)
      return
    }

    let cancelled = false
    const allAttended: { shows: { show_group: string } }[] = []
    let page = 0
    const pageSize = 1000

    async function fetchData() {
      const sb = supabase
      if (!sb) return
      try {
        setLoading(true)

        while (true) {
          const { data, error } = await sb
            .from("user_attended_shows")
            .select(
              `
              shows!inner (
                show_group
              )
            `
            )
            .eq("user_id", userId)
            .range(page * pageSize, (page + 1) * pageSize - 1)

          if (error) throw error
          if (!data?.length) break

          allAttended.push(
            ...(data as unknown as { shows: { show_group: string } }[])
          )
          page++
          if (data.length < pageSize) break
        }

        const groupCounts: Record<string, number> = {}
        allAttended.forEach((item) => {
          const group = item.shows?.show_group
          if (group) {
            groupCounts[group] = (groupCounts[group] || 0) + 1
          }
        })

        const formatted = Object.entries(groupCounts)
          .map(([name, value], i) => ({
            name,
            value,
            fill: CHART_COLORS[i % CHART_COLORS.length],
          }))
          .sort((a, b) => b.value - a.value)

        if (!cancelled) {
          setChartData(formatted)
        }
      } catch (err) {
        console.error("Error fetching attended shows by group:", err)
        if (!cancelled) setChartData([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => {
      cancelled = true
    }
  }, [userId, refetchKey])

  const chartConfig: ChartConfig = chartData.reduce(
    (acc, item) => ({
      ...acc,
      [item.name]: {
        label: item.name,
        color: item.fill,
      },
    }),
    {} as ChartConfig
  )

  if (loading) {
    const msg = isOwnProfile
      ? "Loading chart data…"
      : `Loading ${username ? `${username}'s` : "their"} chart data…`
    return <LoadingPageCard message={msg} />
  }

  if (chartData.length === 0) {
    const emptyMsg = isOwnProfile
      ? "No attended shows found."
      : username
        ? `${username} hasn't attended any shows yet.`
        : "This user hasn't attended any shows yet."
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">{emptyMsg}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Shows by Group</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[240px] w-full max-w-[280px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  hideIndicator
                  formatter={(value, name) => {
                    const countLabel =
                      value === 1 ? "1 show" : `${value} shows`
                    return (
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold">{name}</span>
                        <span className="text-muted-foreground">
                          {countLabel}
                        </span>
                      </div>
                    )
                  }}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              strokeWidth={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-0.5">
          {chartData.map((entry) => (
            <div
              key={entry.name}
              className="flex items-center gap-1.5 text-xs"
            >
              <div
                className="size-2 shrink-0 rounded-[2px]"
                style={{ backgroundColor: entry.fill }}
              />
              <span style={{ color: entry.fill }}>{entry.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
