import { range } from 'lodash-es'

interface Range {
  label: string
  value: number
}

// standard deviations of a dataset falling inside a min/max
export function calculateDeviationsInRange(mean: number, bound: number, step: number): Range[] {
  const isNegative = mean > bound
  const rawDeviations = range(mean, bound, isNegative ? -step : step)
  const withLabels = rawDeviations.map((value, i) => ({
    label: `${isNegative ? '-' : ''}${i}σ`,
    value
  }))
  const withoutMean = withLabels.slice(1)
  return isNegative ? withoutMean.reverse() : withoutMean
}
