import { format as d3Format } from 'd3-format'
import { toString } from 'lodash-es'

import { getSignificantDecimals } from './numberUtilities'

/**
 * Master list of value filters.
 * @param value value to format
 * @param format how the value should be formatted
 */
export const formatNumber = (value: unknown, format?: string): string => {
  // TODO have api/search featuredresults response also use these updated format values
  if (format === 'commas') {
    format = 'number'
  } else if (format === 'commas,dollar' || format === 'commas, dollar') {
    format = 'dollar'
  }

  // handle values that haven't been assigned
  if (value === undefined || value === null) {
    return ''
  }

  if (format === 'none' && value !== undefined) {
    return toString(value)
  }

  // simply return booleans and non-numbers as is
  const asNumber: number = +value
  if (typeof value === 'boolean' || isNaN(asNumber)) {
    return toString(value)
  }

  // Classifies and returns a number's position as 1st, 2nd, 3rd, or higher
  if (format === 'ordinal') {
    const n = asNumber
    const j: number = n % 10
    const k: number = n % 100

    if (n === 1) {
      return ''
    } else if (j === 1 && k !== 11) {
      return n + 'st-'
    } else if (j === 2 && k !== 12) {
      return n + 'nd-'
    } else if (j === 3 && k !== 13) {
      return n + 'rd-'
    } else {
      return n + 'th-'
    }
  }

  switch (format) {
    // Returns value formatted as a dollar currency
    case 'DOL':
    case 'dollar':
      return d3Format('($,')(asNumber)

    // Returns value formatted as a percentage
    case 'PCT':
    case 'percent':
      return value + '%'

    case 'annotation':
      return value + ''

    // MOE is a case specifically for the gridOptionsSupport.ts file
    // MOE = margin of error
    case 'MOE': {
      const newValue = String(value)
      const sigDecimals = getSignificantDecimals(newValue)
      const formatted = d3Format(`,.${sigDecimals}f`)(asNumber)
      return `±${formatted}`
    }

    /* Returns number value as a string formatted with commas and decimal points
    ex. 1231234.56 => 1,231,234.56 */
    // Also add commas if incorrect or undefined format is provided
    case 'number':
    case 'NUM':
    default: {
      const newValue = String(value)
      const sigDecimals = getSignificantDecimals(newValue)
      return d3Format(`,.${sigDecimals}f`)(asNumber)
    }
  }
}

/**
 * Mimics main number formatter, but presents large numbers in SI notation.
 * e.g. 25M instead of 25,000,000
 * NOTE: doesn't work with strings (yet).
 * Important to maintain, this is used when building the chart X and Y axis tick values
 */
export function formatNumberCondensed(
  num: number,
  format: string | undefined,
  precision = 0
): string {
  const d3NumberFormat =
    num < 1 // NOTE: for chart scales with small max value (~1-5), ticks can have decimal values < 1
      ? `${num}` // We don't want to SI-prefix those values
      : d3Format('~s')(num).replace(/G/, 'B').replace(/k/, 'K')
  switch (format) {
    case 'NUM':
    case 'number':
      return precision === 0 ? d3NumberFormat : `${num}`
    case 'DOL':
    case 'dollar':
      return `$${d3NumberFormat}`
    case 'PCT':
    case 'percent':
    default:
      return formatNumber(num, format)
  }
}
