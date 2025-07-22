import type { SimpleChartStatsItem } from '@chartlib/core/types'

export type BarChartDataItem = SimpleChartStatsItem & {
  height: number
  xPosition: number
  yPosition: number
  barWidth: number
  color: string
  isNegative?: boolean
}

export type ColumnChartDataItem = SimpleChartStatsItem & {
  barWidth: number
  barHeight: number
  xPosition: number
  yPosition: number
  labelPosition: {
    x: number
    y: number
  }
  color: string
}

export type DataGroup = {
  label: string
  items: Array<SimpleChartStatsItem>
  total: number
}

export interface BarChartItemGroup {
  label: string
  items: Array<BarChartDataItem>
  labelYPosition: number
  total: number
}

export interface ColumnChartItemGroup {
  label: string
  items: Array<ColumnChartDataItem>
  labelXPosition: number
  total: number
  labelYPosition: number
}

export type ItemColor = {
  label: string
  color: string
}
