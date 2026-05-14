"use client"

import { useState, useEffect } from "react"
import { Pie, PieChart, Cell, Tooltip } from "recharts"
import { supabase } from "@/lib/supabase"

import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart"
import { WlWidgetPanelLoading } from "@/components/dpro/wl-widget-panel-loading"
import { cn } from "@/lib/utils"

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

type PieTooltipPayloadItem = {
  name?: string
  value?: number
  payload?: ChartDataItem
}

function GroupPieTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: PieTooltipPayloadItem[]
}) {
  if (!active || !payload?.length) {
    return null
  }
  const row = payload[0]
  const name = String(row.name ?? row.payload?.name ?? "")
  const value = typeof row.value === "number" ? row.value : 0
  const countLabel = value === 1 ? "1 show" : `${value} shows`

  return (
    <div className="wl-home-v2-profile-shows-group-ttpanel">
      <p className="wl-home-v2-profile-shows-group-ttpanel-name">{name}</p>
      <p className="wl-home-v2-profile-shows-group-ttpanel-count">{countLabel}</p>
    </div>
  )
}

export function AttendedByGroupChart({
  userId,
  isOwnProfile,
  username,
  refetchKey = 0,
}: AttendedByGroupChartProps) {
  const [chartData, setChartData] = useState<ChartDataItem[]>([])
  const [loading, setLoading] = useState(true)

  const panelPadClass = isOwnProfile
    ? "wl-home-v2-profile-shows-panel--own"
    : "wl-home-v2-profile-shows-panel--public"

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
            `,
            )
            .eq("user_id", userId)
            .range(page * pageSize, (page + 1) * pageSize - 1)

          if (error) throw error
          if (!data?.length) break

          allAttended.push(
            ...(data as unknown as { shows: { show_group: string } }[]),
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
    {} as ChartConfig,
  )

  if (loading) {
    const msg = isOwnProfile
      ? "Loading chart data…"
      : `Loading ${username ? `${username}'s` : "their"} chart data…`
    return <WlWidgetPanelLoading message={msg} />
  }

  if (!userId) {
    return (
      <div
        className={cn(
          "widget-panel wl-home-v2-profile-shows-group-chart",
          panelPadClass,
        )}
      >
        <div className="wp-head wl-home-v2-years-shows-wp-head">
          <span className="min-w-0 truncate">Shows by Group</span>
        </div>
        <div className="wl-home-v2-profile-shows-group-chart-empty">
          <p className="wl-home-v2-profile-shows-group-chart-empty-msg">
            Please log in to see this chart.
          </p>
        </div>
      </div>
    )
  }

  if (chartData.length === 0) {
    const emptyMsg = isOwnProfile
      ? "No attended shows found."
      : username
        ? `${username} hasn't attended any shows yet.`
        : "This user hasn't attended any shows yet."
    return (
      <div
        className={cn(
          "widget-panel wl-home-v2-profile-shows-group-chart",
          panelPadClass,
        )}
      >
        <div className="wp-head wl-home-v2-years-shows-wp-head">
          <span className="min-w-0 truncate">Shows by Group</span>
        </div>
        <div className="wl-home-v2-profile-shows-group-chart-empty">
          <p className="wl-home-v2-profile-shows-group-chart-empty-msg">
            {emptyMsg}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "widget-panel wl-home-v2-profile-shows-group-chart",
        panelPadClass,
      )}
    >
      <div className="wp-head wl-home-v2-years-shows-wp-head">
        <span className="min-w-0 truncate">Shows by Group</span>
      </div>
      <div className="wl-home-v2-profile-shows-group-chart-body">
        <ChartContainer
          config={chartConfig}
          className="wl-home-v2-profile-shows-group-chart-root"
        >
          <PieChart>
            <Tooltip
              cursor={false}
              isAnimationActive={false}
              content={(props) => (
                <GroupPieTooltip
                  active={props.active}
                  payload={props.payload as PieTooltipPayloadItem[] | undefined}
                />
              )}
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
        <div className="wl-home-v2-profile-shows-group-legend">
          {chartData.map((entry) => {
            const svgW = Math.min(240, 14 + entry.name.length * 6.75)
            return (
              <svg
                key={entry.name}
                role="img"
                aria-label={entry.name}
                className="wl-home-v2-profile-shows-group-legend-item"
                width={svgW}
                height={14}
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>{entry.name}</title>
                <rect x={0} y={3} width={8} height={8} rx={2} fill={entry.fill} />
                <text
                  x={12}
                  y={11}
                  fill={entry.fill}
                  fontSize={11}
                  fontWeight={600}
                >
                  {entry.name}
                </text>
              </svg>
            )
          })}
        </div>
      </div>
    </div>
  )
}
