"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import { WlWidgetPanelLoading } from "@/components/dpro/wl-widget-panel-loading"
import { useOverviewChartData } from "@/hooks/use-overview-chart-data"

import "./overview-chart.css"

interface OverviewChartProps {
  userId: string | null
  isOwnProfile: boolean
  username?: string | null
}

/** Recharts tooltip payload shape we need (avoids generic Formatter conflicts on TooltipProps). */
type OverviewTooltipPayload = {
  type?: string
  color?: string
  name?: string | number
  value?: number | string | Array<number | string>
  dataKey?: string | number
  hide?: boolean
}

/** Custom tooltip — single source of layout/styles in `overview-chart.css`; no shadcn chart tooltip. */
function OverviewChartTooltipBody({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: OverviewTooltipPayload[]
  label?: string | number
}) {
  if (!active || !payload?.length) {
    return null
  }

  const rows = payload.filter(
    (p) => p.type !== "none" && p.value != null && p.hide !== true,
  )

  if (!rows.length) {
    return null
  }

  return (
    <div className="wl-home-v2-profile-overview-chart-ttpanel">
      <div className="wl-home-v2-profile-overview-chart-ttpanel-head">
        {label}
      </div>
      <ul className="wl-home-v2-profile-overview-chart-ttpanel-rows">
        {rows.map((entry, index) => {
          const key = `${String(entry.dataKey ?? entry.name ?? "row")}-${index}`
          const fill = entry.color ?? "rgba(255, 255, 255, 0.4)"
          const display =
            typeof entry.value === "number" ?
              entry.value.toLocaleString()
            : Array.isArray(entry.value) ?
              entry.value.join(", ")
            : String(entry.value ?? "")

          return (
            <li key={key} className="wl-home-v2-profile-overview-chart-ttpanel-row">
              <span className="wl-home-v2-profile-overview-chart-ttpanel-row-left">
                <svg
                  className="wl-home-v2-profile-overview-chart-ttpanel-swatch"
                  width={8}
                  height={8}
                  viewBox="0 0 8 8"
                  aria-hidden
                >
                  <rect width="8" height="8" rx="2" fill={fill} />
                </svg>
                <span className="wl-home-v2-profile-overview-chart-ttpanel-name">
                  {entry.name}
                </span>
              </span>
              <span className="wl-home-v2-profile-overview-chart-ttpanel-value">
                {display}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const chartConfig = {
  gooseCount: {
    label: "Goose",
    color: "var(--wl-green)",
  },
  otherCount: {
    label: "Other",
    color: "var(--wl-orange)",
  },
} satisfies ChartConfig

export function OverviewChart({
  userId,
  isOwnProfile,
  username,
}: OverviewChartProps) {
  const { data, loading } = useOverviewChartData(userId)

  if (loading) {
    const msg = isOwnProfile
      ? "Loading your shows data…"
      : `Loading ${username ? `${username}'s` : "their"} shows data…`
    return <WlWidgetPanelLoading message={msg} />
  }

  if (data.length === 0) {
    return (
      <div
        className="widget-panel wl-home-v2-profile-overview-chart-shell"
      >
        <div className="wl-home-v2-profile-overview-chart-empty">
          <p className="wl-home-v2-profile-overview-chart-empty-msg">
            {isOwnProfile
              ? "No show data available. Start adding shows you've attended!"
              : `${username ? `${username} hasn't` : "This user hasn't"} added any attended shows yet.`}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="widget-panel wl-home-v2-profile-overview-chart-shell">
      <div className="wp-head wl-home-v2-years-shows-wp-head">
        <span className="min-w-0 truncate">Shows Per Year</span>
      </div>
      <ChartContainer
        config={chartConfig}
        className="wl-home-v2-profile-overview-chart-root"
      >
        <AreaChart
          accessibilityLayer
          data={data}
          margin={{ left: -30, right: 24, bottom: 8 }}
        >
          <defs>
            <linearGradient id="fillGoose" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-gooseCount)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="var(--color-gooseCount)"
                stopOpacity={0.15}
              />
            </linearGradient>
            <linearGradient id="fillOther" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-otherCount)"
                stopOpacity={0.6}
              />
              <stop
                offset="95%"
                stopColor="var(--color-otherCount)"
                stopOpacity={0.1}
              />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgb(44, 46, 45)" />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fill: "rgba(255, 255, 255, 0.55)" }}
          />
          <XAxis
            dataKey="year"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval={0}
            tick={{ fill: "rgba(255, 255, 255, 0.55)" }}
          />
          <ChartTooltip
            cursor={false}
            isAnimationActive={false}
            wrapperStyle={{
              padding: 0,
              margin: 0,
              background: "transparent",
              border: "none",
              boxShadow: "none",
            }}
            content={(props) => (
              <OverviewChartTooltipBody
                active={props.active}
                label={props.label}
                payload={props.payload as OverviewTooltipPayload[] | undefined}
              />
            )}
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Area
            dataKey="gooseCount"
            name="Goose"
            type="linear"
            fill="url(#fillGoose)"
            stroke="var(--color-gooseCount)"
            strokeWidth={2}
          />
          <Area
            dataKey="otherCount"
            name="Other"
            type="linear"
            fill="url(#fillOther)"
            stroke="var(--color-otherCount)"
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  )
}
