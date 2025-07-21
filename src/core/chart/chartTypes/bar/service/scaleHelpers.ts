import { getContinuousDomain } from '@chartlib/service/scaleHelpers'

/* Compute line chart scale domains from data */

const hasNegativeValues = (values: Array<number>): boolean => {
  return values.some((num) => num < 0)
}

const hasPositiveValues = (values: Array<number>): boolean => {
  return values.some((num) => num > 0)
}

export const isDiverging = (values: Array<number>): boolean => {
  return hasNegativeValues(values) && hasPositiveValues(values)
}

export const getValueDomain = (values: Array<number>, format?: string): [number, number] => {
  return getContinuousDomain(values, format, true) // always start or end at 0 if not diverging
}
