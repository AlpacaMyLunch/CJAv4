import * as React from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { cn } from "@/lib/utils"

// Chart color palette following shadcn/ui design system
const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))", 
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
  "hsl(var(--chart-7))",
  "hsl(var(--chart-8))",
  "hsl(var(--chart-9))",
  "hsl(var(--chart-10))",
]

export interface ChartData {
  name: string
  value: number
}

export interface ChartConfig {
  [key: string]: {
    label: string
    color?: string
  }
}

interface ChartContainerProps {
  config: ChartConfig
  children: React.ReactNode
  className?: string
}

export function ChartContainer({ children, className }: ChartContainerProps) {
  return (
    <div className={cn("w-full", className)} style={{
      "--chart-1": "220 70% 50%",
      "--chart-2": "160 60% 45%",
      "--chart-3": "30 80% 55%",
      "--chart-4": "280 65% 60%",
      "--chart-5": "340 75% 55%",
      "--chart-6": "200 80% 50%",
      "--chart-7": "120 70% 45%",
      "--chart-8": "60 85% 55%",
      "--chart-9": "260 60% 50%",
      "--chart-10": "20 70% 55%",
    } as React.CSSProperties}>
      {children}
    </div>
  )
}

interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    name: string
  }>
  label?: string
}

export function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid gap-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="h-2 w-2 rounded-full" 
                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
              />
              <span className="text-sm font-medium">{entry.name}:</span>
              <span className="text-sm text-muted-foreground">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

interface ChartLegendProps {
  payload?: Array<{
    value: string
    type: string
    color: string
  }>
}

export function ChartLegend({ payload }: ChartLegendProps) {
  if (!payload || payload.length === 0) return null
  
  return (
    <div className="flex flex-wrap justify-center gap-2 text-xs">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-1">
          <div 
            className="h-2 w-2 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

interface PieChartProps {
  data: ChartData[]
  config: ChartConfig
  className?: string
  dataKey?: string
}

export function PieChartComponent({ data, config, className, dataKey = "value" }: PieChartProps) {
  return (
    <ChartContainer config={config} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={60}
            fill="#8884d8"
            dataKey={dataKey}
            label={(entry) => `${entry.value}`}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
          <Legend content={<ChartLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}