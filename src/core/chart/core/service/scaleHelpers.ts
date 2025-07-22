export function getContinuousDomain(
  values: Array<number>,
  format?: string,
  clamp = false
): [number, number] {
  /* setup */
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)

  // special rule for cases where all values are 0....chart breaks if min & max are the same
  if (minValue === 0 && maxValue === 0) {
    return format === 'percent' || format === 'PCT' ? [0, 100] : [0, 1]
  }

  const magnitude = Math.max(...values.map((val) => Math.abs(val)))

  // Enforce 0-100 "raw" domain for %, otherwise fit to data
  const scaleDigits =
    format === 'percent' || format === 'PCT' ? 2 : Math.ceil(Math.log10(magnitude))
  // rounded max value based on scale digits
  const rawDomainMax = Math.pow(10, scaleDigits)
  // NOTE: All mentions of "raw" domain below mean [0, rawDomainMax]

  // pad min/max by rounding to nearest 5% of raw domain
  const roundToNextTick = (val: number, roundUp: boolean) => {
    const tickPrecision = rawDomainMax * 0.05
    const roundedVal = roundUp ? Math.ceil(val / tickPrecision) : Math.floor(val / tickPrecision)
    return roundedVal * tickPrecision
  }

  /* domain maximum */

  // take the larger of (to maximize top padding): */
  const paddedMax = Math.max(
    // the 5% (of raw domain) tick above the top of the line
    roundToNextTick(maxValue, true),
    // 2% (of raw domain) cushion above the top of the line
    maxValue + rawDomainMax * 0.02
  )

  /* domain minimum */
  // take the smaller of (to maximize bottom padding):
  const paddedMin = Math.min(
    // the 5% (of raw domain) tick below the bottom of the line
    roundToNextTick(minValue, false),
    // 2% (of raw domain) cushion below the bottom of the line
    minValue - rawDomainMax * 0.02
  )

  // clamp at zero when values are all positive or negative
  const finalMin = minValue >= 0 ? (clamp ? 0 : Math.max(paddedMin, 0)) : paddedMin
  const finalMax = maxValue <= 0 ? (clamp ? 0 : Math.min(paddedMax, 0)) : paddedMax

  return [finalMin, finalMax]
}
