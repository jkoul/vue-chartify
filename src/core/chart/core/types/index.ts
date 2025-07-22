export * from './d3Types'

export interface ChartConfig {
  containerWidth: number
  containerHeight: number
  chartWidth: number
  chartHeight: number
  margin: ChartMargin
  scrollWidth?: number
  scrollHeight?: number
}

export interface ChartMargin {
  left: number
  right: number
  top: number
  bottom: number
}

export interface SimpleChartStatsItem {
  description: string
  value: string | number
  moe?: string // supports margin of error display
  dimension?: string // supports clustered bar/column charts or multi-line charts
  statSignificance?: string | null
}

// NOTE: currently only used in manual breaks panel. Could be useful more generally in the future.
export interface DataSummaryStatistics {
  min: number
  max: number
  mean: number
  stDev: number
  skew: number | null
  kurtosis: number | null
}

export interface HistogramBin {
  size: number
  x: number
  width: number
  color: string
}

export type ChartTooltipItem = SimpleChartStatsItem & {
  tooltipPosition: TooltipPosition
  color?: string
}

export interface TooltipPosition {
  x: number
  y: number
  rightX: number
}

export type LegendCategory = {
  label: string | undefined
  color: string
  highlightColor?: string
}
