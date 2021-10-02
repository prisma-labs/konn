export type MaybePromise<T> = T | Promise<T>

export const floggySlugify = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/ |-/g, '_')
    .replace(/[^a-z]*/g, '')
}
