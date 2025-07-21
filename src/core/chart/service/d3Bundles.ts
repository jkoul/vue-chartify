import { bin, groups, map, max, min, range, sum } from 'd3-array'
import { axisBottom, axisLeft } from 'd3-axis'
import { format, formatPrefix } from 'd3-format'
import { scaleBand, scaleLinear, scaleThreshold, scaleTime } from 'd3-scale'
import { select } from 'd3-selection'
import { area, line } from 'd3-shape'

// Default of everything, or choose more tailored modules below
export default {
  min,
  max,
  range,
  sum,
  bin,
  scaleLinear,
  scaleBand,
  scaleThreshold,
  scaleTime,
  axisBottom,
  axisLeft,
  select,
  area,
  line,
  format,
  formatPrefix,
  map,
  groups
}

// Basic bar chart, as seen on profile pages
export const horizontalBarChart = {
  min,
  max,
  sum,
  scaleLinear,
  scaleBand,
  axisBottom,
  format,
  formatPrefix,
  groups
}

export const columnChart = {
  max,
  sum,
  scaleLinear,
  scaleBand,
  groups
}

// Basic line chart, as seen on profile pages
export const lineChart = {
  min,
  max,
  scaleLinear,
  scaleTime,
  axisBottom,
  line,
  format,
  groups
}

export const areaChart = {
  area,
  scaleLinear,
  scaleTime,
  axisBottom,
  format
  // TODO: add methods to support stacking
}

// Histogram, as seen in map page Classes panel
export const histogram = {
  scaleLinear,
  scaleThreshold,
  max,
  axisLeft,
  format,
  range,
  bin
}
