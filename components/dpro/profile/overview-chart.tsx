"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { useOverviewChartData } from "@/hooks/use-overview-chart-data"

interface OverviewChartProps {
  userId: string | null
  isOwnProfile: boolean
  username?: string | null
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
    return <LoadingPageCard message={msg} />
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">
            {isOwnProfile
              ? "No show data available. Start adding shows you've attended!"
              : `${username ? `${username} hasn't` : "This user hasn't"} added any attended shows yet.`}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-visible space-y-4">
      <CardHeader>
        <CardTitle>Shows Per Year</CardTitle>
      </CardHeader>
      <CardContent className="overflow-visible px-6">
        <ChartContainer config={chartConfig} className="h-[280px] w-full overflow-visible">
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
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fill: "var(--muted-foreground)" }}
            />
            <XAxis
              dataKey="year"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
              tick={{ fill: "var(--muted-foreground)" }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(value) => `Year: ${value}`}
                  className="border-border bg-card text-card-foreground"
                />
              }
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
      </CardContent>
    </Card>
  )
}
