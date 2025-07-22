import type { LegendCategory, SimpleChartStatsItem } from '@chartlib/core/types'

export type ContinuousLineChartStat = {
  date: Date // TODO: string | Date
  description?: string
  dimension?: string
  moe?: string // NOTE: really a number, but no need to convert it
  value: string | number | undefined
}

export type LineChartStat = SimpleChartStatsItem & {
  date: Date
}

export type LineChartDataGroup = LegendCategory & {
  normalLine: string | null
  dashedLine: string | null
  items: Array<LineChartDataItem>
}

// stat item with positioning props
export type LineChartDataItem = LineChartStat & {
  xPosition: number
  yPosition: number
}
