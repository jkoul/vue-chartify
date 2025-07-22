import type { ContinuousLineChartStat, LineChartStat } from '@chartlib/chartTypes/line/types'
import type { LinearScale, TimeScale } from '@chartlib/core/types/d3Types'

import { area, line } from 'd3-shape'

export function generateLine(
  data: Array<LineChartStat | ContinuousLineChartStat>,
  xScale: TimeScale,
  yScale: LinearScale
): string | null {
  return line<LineChartStat | ContinuousLineChartStat>()
    .defined((d) => d.value !== undefined)
    .y((d) => yScale(+d.value!))
    .x((d) => xScale(d.date))(data)
}

export function generateArea(
  data: Array<LineChartStat>,
  xScale: TimeScale,
  yScale: LinearScale
): string | null {
  return (
    area<LineChartStat>()
      // .defined((d) => d.value !== undefined)
      .y0(yScale(0))
      .y1((d) => yScale(+d.value!))
      .x((d) => xScale(d.date))(data)
  )
}
