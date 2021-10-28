export type MaybePromise<T> = T | Promise<T>

export const floggySlugify = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/ |-/g, '_')
    .replace(/[^a-z]*/g, '')
}

export const timeout = (
  limit: number,
  options?: { unref?: boolean }
): Promise<{ timeout: boolean }> & { cancel(): void } => {
  let timeout_: NodeJS.Timeout | undefined
  let res_:
    | undefined
    | ((
        value:
          | {
              timeout: boolean
            }
          | PromiseLike<{
              timeout: boolean
            }>
      ) => void)
  const p = new Promise<{ timeout: boolean }>((res) => {
    res_ = res
    timeout_ = setTimeout(
      () =>
        res({
          timeout: true,
        }),
      limit
    )
    if (options?.unref) {
      timeout_.unref()
    }
  })
  //eslint-disable-next-line
  ;(p as any).cancel = () => {
    if (timeout_) clearTimeout(timeout_)
    if (res_) res_({ timeout: false })
  }
  //eslint-disable-next-line
  return p as any
}
