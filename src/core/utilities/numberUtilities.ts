import { max, sample, sum } from 'simple-statistics'

/**
 * Guess how many significant digits are in the decimals.
 *
 * "0.0" -> 1
 * "0.985" -> 3
 *
 * @param {*} stringNumber (string representing a Number. ie: "1.1")
 */
export function getSignificantDecimals(stringNumber: string): number {
  try {
    const stringSplit = stringNumber.split('.')
    if (stringSplit.length <= 1) {
      return 0
    }
    // get decimal portion and return that length
    const decimals = stringSplit.pop()
    return decimals ? decimals.length : 0
  } catch (err) {
    return 0
  }
}

export function roundToPrecision(number: number, precision: number): number {
  const normalizer = Math.pow(10, precision)
  return Math.round(number * normalizer) / normalizer
}

export function determineDatasetDecimalPrecision(data: number[]): number {
  // Might as well use every item for really small datasets. Otherwise, use min/max plus a random sample.
  const randomSample = data.length > 8 ? sample(data, 8, Math.random) : data
  const decimalsInItems = randomSample.map((num) => getSignificantDecimals(num.toString()))
  return max(decimalsInItems)
}

export function aggregateMoes(data: Array<number>): number {
  const summedSquares = data.reduce((sum: number, num) => (sum += num ** 2), 0)

  return Math.sqrt(summedSquares)
}

export { sum }

// Calculates the greatest common factor/divisor between two WHOLE numbers.
// For an array of whole numbers, wrap this function in a reduce statement or use inside a for loop.
export function gcd(a: number, b: number): number {
  if (b <= 0 || isNaN(b)) return a
  return gcd(b, a % b)
}
