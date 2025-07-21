import { utcFormat } from 'd3-time-format'

import { gcd } from './numberUtilities'

/* Utility functions for an ARRAY of date items */

export type TimeIncrement = `${number}year` | 'year' | 'quarter' | 'month' | 'day'

function isMultiYear(string: string) {
  const firstChar = string.charAt(0)
  return !isNaN(+firstChar)
}
/**
 *
 * @param dates array of JS Date objects
 * @returns the MINIMUM span between dates in the array
 * supports multi-year, year, quarter, month, day.
 * week increments not yet supported
 */
export function computeTimeIncrement(dates: Array<Date>): TimeIncrement {
  // NOTE: when dealing with multi-year gaps, the final increment essentially needs to be the greatest common divisor of the year gaps between two consecutive points. Or else the chart will break.
  let yearIncrement = 9999
  let increment: TimeIncrement = 'year'
  for (let i = 0; i < dates.length; i++) {
    if (i === dates.length - 1) break
    const now = dates[i]
    const next = dates[i + 1]

    if (yearIncrement > 1) {
      const yearDiff = next.getFullYear() - now.getFullYear()
      if (yearDiff === 1) {
        yearIncrement = 1
      } else if (yearDiff % yearIncrement > 0) {
        yearIncrement = yearIncrement === 9999 ? yearDiff : gcd(yearIncrement, yearDiff)
      }
    }

    const nowMonth = now.getMonth()
    const nextMonth = next.getMonth()

    if (nowMonth !== nextMonth) {
      yearIncrement = 0
      // never go backward from month to quarter
      if (increment !== 'month') {
        const isQuarters = nowMonth % 3 === nextMonth % 3
        increment = isQuarters ? 'quarter' : 'month'
      } else {
        increment = 'month'
      }
    }

    if (now.getDate() !== next.getDate()) {
      // TODO/jdk: handle weeks?
      increment = 'day'
      // we don't get more granular than day, so we're done
      break
    }
  }

  return yearIncrement > 1 ? `${yearIncrement}year` : increment
}

/**
 * Simple sort of JS Date objects using Date.getTime()
 *
 * @param dates array of JS Date objects
 * @returns a de-duped array of JS Date objects
 */
export function sortDates(dates: Date[]): Date[] {
  return dates.sort((a, z) => a.getTime() - z.getTime())
}

/**
 * Removes duplicate dates from the array. Dates have to be compared by their string representation instead of normal equality methods ex. date === date.
 * @param dates array of JS Date objects
 * @returns a de-duped array of JS Date objects
 */
export function getUniqueDates(dates: Date[]): Date[] {
  const uniqDates: Date[] = []
  const uniqDateStrings: string[] = []

  dates.forEach((date) => {
    const dateString = date.toString()

    if (!uniqDateStrings.includes(dateString)) {
      uniqDates.push(date)
      uniqDateStrings.push(dateString)
    }
  })

  return uniqDates
}

/* Utility functions for a SINGLE date item */

/**
 * Gets the desired month/day/year of a date
 *
 * @param date a JS Date object
 * @param increment
 * @returns the value of the desired date component
 */
export function getRelevantDateComponent(date: Date, increment?: TimeIncrement): number {
  // use year for multi-year increments
  if (increment && isMultiYear(increment)) {
    return date.getFullYear()
  }

  switch (increment) {
    case 'year':
      return date.getFullYear()
    case 'month':
    case 'quarter':
      return date.getMonth()
    case 'day':
      return date.getDate()
    default:
      return date.getTime()
  }
}

/**
 * Check equality of dates. Can't do date1 === date2.
 */
export const areDatesEqual = (date1: Date, date2: Date): boolean => {
  return date1.getTime() === date2.getTime()
}

/**
 * Given a time period/increment, is date #2 the "next one" after date #1?
 *
 * @param date1 a JS Date object
 * @param date2 another JS Date object
 * @param increment the time increment (usually 'year' or 'month')
 */
export const areDatesConsecutive = (
  date1: Date,
  date2: Date,
  increment: TimeIncrement,
): boolean => {
  return date2.getTime() === addIncrementToDate(date1, increment).getTime()
}

/**
 * Adds a defined time period/increment to a JS date
 *
 * NOTE: if no increment provided, adds a millisecond
 *
 * @param date a JS date object
 * @param increment the time increment (usually 'year' or 'month')
 */
export function addIncrementToDate(date: Date, increment?: TimeIncrement): Date {
  const theNextOne = getRelevantDateComponent(date, increment) + 1

  if (increment && isMultiYear(increment)) {
    const yearGap = +increment.split('year')[0]
    return new Date(date.getFullYear() + yearGap, date.getMonth())
  }

  switch (increment) {
    case 'year':
      return new Date(theNextOne, date.getMonth())
    case 'month':
      return new Date(date.getFullYear(), theNextOne)
    case 'quarter':
      return new Date(date.getFullYear(), theNextOne + 2) // add 3 months
    case 'day':
      return new Date(date.getFullYear(), date.getMonth(), theNextOne)
    default:
      return new Date(theNextOne)
  }
}

/**
 * Converts a month number (0-11) to a full month name/label
 *
 * @param month a month number, starting at 0. Generally drawn from Date().getMonth()
 * @returns a month name (e.g. 'January' for 0)
 */
export function getMonthNameFromMonthNumber(month: string | number, short?: boolean): string {
  // since month starts at 0, +month here is actually one month too late...
  // ...but date starts at 1, so setting the date as 0 gets us to the last day of the month we really want.
  const date = new Date(2023, +month, 0)
  return getMonthNameFromDate(date, short)
}

/**
 * Gets a month name/label from a JS date
 *
 * @param date a JS Date object
 * @returns a month name (e.g. 'January')
 */
export function getMonthNameFromDate(date: Date, short?: boolean): string {
  return date.toLocaleString('en-US', { month: short ? 'short' : 'long' })
}

export function getMidpointOfDateRange(start: Date, end: Date): Date {
  // unfortunately, we can't take the exact midpoint in milliseconds, or else this would be far easier
  const startYear = start.getFullYear()
  const endYear = end.getFullYear()
  if (endYear > startYear) {
    const range = endYear - startYear
    const rangeIsOdd = range % 2 // NOTE: implied that 0 is falsy and 1 is truthy
    const midpointYear = Math.floor((startYear + endYear) / 2)
    const monthToUse = rangeIsOdd ? 6 : 0 // midpoint may be July. that's fine for our purposes as long as the ranges in the time series are of consistent lengths
    return new Date(midpointYear, monthToUse)
  }

  // TODO/jdk: accommodate more increment types. This is close enough for now.
  const exactMidpoint = (start.getTime() + end.getTime()) / 2
  return new Date(exactMidpoint)
}

/**
 * Make time period values play nicely in line charts.
 *
 * @param code a code for time dimension, as provided by API
 * @returns a Date object corresponding to that time period
 *
 * NOTE: always take the starting point for consistency,
 * since some time periods (mainly months) are of different sizes
 */
export function getDateFromTimeValue(code: string): Date {
  const [year, month, day] = code.split('-')
  if (month?.length === 4 && year.length === 4) {
    // SPECIAL CASE - it's a RANGE of years (eg ACS 5-Year Comparison Profiles). Take the midpoint.
    const startYear = new Date(+year, 0)
    const endYear = new Date(+month, 0)
    return getMidpointOfDateRange(startYear, endYear)
  } else if (!month) {
    // it's a plain old year (2023)
    return new Date(+year, 0)
  } else if (!day && isNaN(+month)) {
    // assume it's a quarter (2023-Q3).
    // 🤞 there are no other strange formats(like, say, week) in the part after year
    const quarter = month.slice(-1)
    const startMonth = (+quarter - 1) * 3
    return new Date(+year, startMonth)
  } else if (!day) {
    // it's a month (2023-08)
    return new Date(+year, +month - 1)
  } else {
    // it's a day (2023-08-15)
    return new Date(+year, +month, +day)
  }
}

export function getPrettyTimeLabel(date: Date, increment: TimeIncrement, long = false): string {
  if (isMultiYear(increment)) return utcFormat('%Y')(date)

  switch (increment) {
    case 'year':
      return utcFormat('%Y')(date)
    case 'quarter': {
      const formatted = utcFormat('%q %Y')(date)
      return `Q${formatted}`
    }
    case 'month': {
      const format = long ? '%B %Y' : "%b '%y"
      return utcFormat(format)(date)
    }
    default:
      // day
      return utcFormat('%b %d, %y')(date)
  }
}

// rollup of getDateFromTimeValue and getPrettyTimeLabel, circumventing need for time increment
export function getPrettyTimeLabelFromCode(code: string): string {
  const [year, month, day] = code.split('-')
  if (!month)
    return code // it's a plain old year (2023)
  else if (!day && isNaN(+month)) {
    // assume it's a quarter (2023-Q3).
    // 🤞 there are no other strange formats(like, say, week) in the part after year
    return `${month} ${year}`
  } else if (!day) {
    // it's a month (2023-08)
    return `${getMonthNameFromMonthNumber(month)} ${year}`
  } else {
    // it's a day (2023-08-15)
    return `${getMonthNameFromMonthNumber(month, true)} ${day}, ${year}`
  }
}
