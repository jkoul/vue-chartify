import type { SimpleChartStatsItem } from '@chartlib/core/types'

export type PyramidChartStat = SimpleChartStatsItem & {
  geoId?: string
}

// in-component data item as passed into the template, includes positioning props
export interface ChartDataItem extends PyramidChartStat {
  yPosition: number
  barHeight: number
  xPosition: number
  barWidth: number
  labelXPosition: number
  smallBar: boolean
}
