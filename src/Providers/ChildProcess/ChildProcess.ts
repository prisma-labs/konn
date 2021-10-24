import * as Execa from 'execa'
import { provider } from '~/provider'
import { NeedsNothing } from '~/types'

export type Params = {
  /**
   * The command to run to spawn the child process. This value will be passed to [`Execa.command`]()
   */
  command: string
  start?: RegExp
  attachTerminal?: boolean
  debug?: string
  env?: Record<string, string>
}

export type Needs = NeedsNothing

export type Contributes = {
  childProcess: Execa.ExecaChildProcess
}

/**
 * Spawn a child process that is intended to live across the test lifecycle. An example would be launching a
 * Node.js HTTP server as a separate process to run some requests against in your tests.
 *
 * [Execa](https://github.com/sindresorhus/execa) is used for managing the child process.
 *
 * On teardown, the childprocess will be sent a SIGTERM. If the process does not exit after 2 seconds then it
 * will be force-killed.
 *
 * @param params  Your settings for this provider.
 */
export const create = (params: Params) =>
  provider<Needs, Contributes>()
    .name('childProcess')
    .before(async (_, utils) => {
      if (process.env.CI) {
        params.attachTerminal = params.attachTerminal ?? Boolean(process.env.CI)
      }

      const childProcess = Execa.command(params.command, {
        windowsHide: false,
        env: {
          ...(params.debug
            ? {
                DEBUG: params.debug,
                LOG_PRETTY: 'true',
              }
            : {}),
          ...(params.attachTerminal
            ? {
                LOG_PRETTY: 'true',
              }
            : {}),

          ...params.env,
        } as NodeJS.ProcessEnv,
      })

      childProcess.unref()

      // void childProcess.on('error', (error) => {
      //   throw ono(error, `Child process encountered an error`)
      // })

      if (params.attachTerminal || params.debug) {
        childProcess.stdout?.pipe(process.stdout)
        childProcess.stderr?.pipe(process.stderr)
      }

      if (params.start) {
        const limit = 10_000
        const start = params.start

        const result = await Promise.race([
          // timeout(limit),
          new Promise<null>((res) => {
            //eslint-disable-next-line
            function isReady(buffer: any) {
              utils.log.trace('process_data', {
                value: String(buffer),
              })

              const match = start.exec(String(buffer))

              if (match) {
                res(null)
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                childProcess.stdout!.off('data', isReady)
              }
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            childProcess.stdout!.on('data', isReady)
          }),
        ])

        // if (result?.timeout) {
        //   throw new Error(
        //     `Timed out (${limit} ms) while waiting for child process start signal ${String(start)}`
        //   )
        // }
      }

      return {
        childProcess,
      }
    })
    .after(async (ctx, utils) => {
      if (ctx.childProcess) {
        const childProcess = ctx.childProcess
        // childProcess.kill('SIGTERM', {
        //   forceKillAfterTimeout: 2_000,
        // })
        childProcess.cancel()
        const to = timeout(3_000)
        to.cancel()

        // const result = await Promise.race([
        //   timeout(3_000),
        //   childProcess,
        //   //   // childProcess.once('exit', (code, signal) => {
        //   //   //   utils.log.trace('process_close', {
        //   //   //     code,
        //   //   //     signal,
        //   //   //   })
        //   //   // }),
        //   //   // childProcess.once('close', (code, signal) => {
        //   //   //   utils.log.trace('process_close', {
        //   //   //     code,
        //   //   //     signal,
        //   //   //   })
        //   //   // }),
        // ])

        // if ('timeout' in result && result.timeout) {
        //   utils.log.warn('child_process_timeout_exit', {
        //     // message: `Will use unref on child process which may leave an orphan child process running.`,
        //   })
        //   // childProcess.unref()
        // }
      }
    })
    .done()

const timeout = (limit: number): Promise<{ timeout: boolean }> & { cancel(): void } => {
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
  })
  //eslint-disable-next-line
  ;(p as any).cancel = () => {
    if (timeout_) clearTimeout(timeout_)
    if (res_) res_({ timeout: false })
  }
  //eslint-disable-next-line
  return p as any
}
