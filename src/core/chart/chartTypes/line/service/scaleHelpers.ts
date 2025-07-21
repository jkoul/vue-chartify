import { getContinuousDomain } from '@chartlib/service/scaleHelpers'

/* Compute line chart scale domains from data */

export { getContinuousDomain as getYDomain }

/* Get min/max times for scale based on Date objects */
export function getXDomain(dates: Array<Date>, addPadding = true): [number, number] {
  const min = dates[0]
  const max = dates[dates.length - 1]

  // manually pad the domain with, essentially, half a tick
  const padding = addPadding ? computeXDomainPadding(dates) : 0
  return [min.getTime() - padding, max.getTime() + padding]
}
/**
 * calculates half of the minimum distance between any two data points (in Unix time format)
 *
 * @param dates - the dates in the chart data
 * @returns a number, representing a time value in milliseconds
 */
function computeXDomainPadding(dates: Array<Date>): number {
  // start with a random number (~30,000 years) definitely larger than anything we'd get in practice
  let minIncrement = Math.pow(10, 15)

  // then reset it based on actual time periods in the data
  for (let i = 0; i < dates.length; i++) {
    if (i === dates.length - 1) break

    const now = dates[i].getTime()
    const next = dates[i + 1].getTime()
    const thisIncrement = next - now

    if (thisIncrement < minIncrement) {
      minIncrement = thisIncrement
    }
  }

  return minIncrement / 2
}
