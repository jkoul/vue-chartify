import type { Axis, AxisDomain, AxisScale } from 'd3-axis'
import type { NumberValue, ScaleBand, ScaleLinear, ScaleTime } from 'd3-scale'

export type Scale = LinearScale | TimeScale | CategoricalScale

export type LinearScale = ScaleLinear<number, number, never>
export type TimeScale = ScaleTime<number, number, never>
export type CategoricalScale = ScaleBand<string>

// note: this type is a temporary bandaid to get the scales and axes to line up
export type ScaleForAxis = AxisScale<AxisDomain>

export type ChartAxis = Axis<AxisDomain> | Axis<NumberValue>
