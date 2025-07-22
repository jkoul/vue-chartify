// broad-use utility converting string to machine-readable id
export const stringToElementID = (string: string): string =>
  string.toLowerCase().replace(/\W/g, '-')
