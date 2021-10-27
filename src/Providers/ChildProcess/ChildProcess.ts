import ono from '@jsdevtools/ono'
import endent from 'endent'
import * as Execa from 'execa'
import { provider } from '~/provider'
import { NeedsNothing } from '~/types'
import { timeout } from '~/utils'

export type Params = {
  /**
   * The command to run to spawn the child process. This value will be passed to [`Execa.command`]()
   */
  command: string
  /**
   * Wait for this pattern of text to be output by the process on stdout. When enabled, will timeout after 4
   * seconds if no output has matched the pattern. Use long form to configure timeout.
   *
   * @default undefined
   */
  start?:
    | RegExp
    | {
        /**
         * Wait for this pattern of text to be output by the process on stdout.
         */
        when: RegExp
        /**
         * How long to wait in milliseconds for pattern before timing out.
         *
         * @default 4_000
         */
        timeout?: number
      }
  /**
   * Pipe the stderr and stdout from the child process to this (aka. parent) process.
   *
   * When `debug` is used the this is automatically forced true.
   *
   * @default boolean  `true` if process.env.CI is truthy otherwise `false`.
   */
  attach?: boolean
  /**
   * Set the DEBUG environment variable in the child process. Useful if something like `floggy` or `debug` is used by code running in the child process.
   *
   * When set, `attach` is forced to `true`.
   */
  debug?: string
  /**
   * Arbitrary environment variables to add to the child process.
   */
  env?: Record<string, string>
}

export type Needs = NeedsNothing

export type Contributes = {
  childProcess: Execa.ExecaChildProcess
}

type ChildProcessInternal = Execa.ExecaChildProcess & {
  _: {
    stdioHistory: string[]
  }
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
      const startConfig = processParamStart(params)
      if (process.env.CI) {
        params.attach = params.attach ?? Boolean(process.env.CI)
      }

      const childProcess = Execa.command(params.command, {
        preferLocal: true,
        env: {
          ...(params.debug
            ? {
                DEBUG: params.debug,
                LOG_PRETTY: 'true',
              }
            : {}),
          ...(params.attach
            ? {
                LOG_PRETTY: 'true',
              }
            : {}),

          ...params.env,
        } as NodeJS.ProcessEnv,
      })

      const childProcessInternal = childProcess as ChildProcessInternal

      childProcessInternal._ = {
        stdioHistory: [] as string[],
      }

      if (params.attach || params.debug) {
        childProcess.stdout?.pipe(process.stdout)
        childProcess.stderr?.pipe(process.stderr)
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      childProcess.stdout!.on('data', (data) => {
        childProcessInternal._.stdioHistory.push(String(data).trim())
      })
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      childProcess.stderr!.on('data', (data) => {
        childProcessInternal._.stdioHistory.push(String(data).trim())
      })

      const maybeError = await Promise.race([
        new Promise<null>((res) => {
          void childProcess.once('spawn', () => res(null))
        }),
        new Promise<Error>((res) => {
          void childProcess.once('error', (error) => res(error))
        }),
      ])

      if (maybeError) {
        throw maybeError
      }

      if (startConfig) {
        const result = await Promise.race([
          timeout(startConfig.timeout, { unref: true }),
          new Promise<null>((res) => {
            //eslint-disable-next-line
            function isReady(buffer: any) {
              utils.log.trace('process_data', {
                value: String(buffer),
              })

              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              const match = startConfig!.when.exec(String(buffer))

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

        if (result?.timeout) {
          childProcess.kill('SIGTERM', {
            forceKillAfterTimeout: 2_000,
          })
          try {
            await childProcess
          } catch (e) {
            // silence errors
          }
          throw new Error(
            // prettier-ignore
            endent`
              Timed out (${startConfig.timeout} ms) while waiting for child process start signal ${String(startConfig.when)}. While waiting, saw this stdout and stderr output from the process:
            
              ${renderStdioHistory(childProcess as ChildProcessInternal)}
            `
          )
        }
      }

      return {
        childProcess,
      }
    })
    .after(async (ctx, utils) => {
      if (ctx.childProcess) {
        ctx.childProcess.kill('SIGTERM', {
          forceKillAfterTimeout: 2_000,
        })
        try {
          await ctx.childProcess
        } catch (error) {
          const execaError = error as Execa.ExecaError

          if (execaError.signal === 'SIGKILL') {
            utils.log.warn('sigkill', {
              message: `SIGKILL was sent to child process because it did not respond to SIGTERM within 2 seconds.`,
            })
          }

          // When Execa sends SIGKILL after timeout there is no exit code.
          if (execaError.exitCode && execaError.exitCode !== 0) {
            throw ono(
              execaError,
              // prettier-ignore
              endent`
                The child process exited with non-zero exit code: ${execaError.exitCode}. Its combined stderr and stdout output was:
              
                ${renderStdioHistory(ctx.childProcess as ChildProcessInternal)}
              `
            )
          }
        }
      }
    })
    .done()

const renderStdioHistory = (childProcess: ChildProcessInternal): string => {
  if (childProcess._.stdioHistory.length === 0) {
    return `N/A -- THERE WAS NO STDOUT/STDERR FROM THE CHILD PROCESS!`
  }

  return childProcess._.stdioHistory.join('\n')
}

const processParamStart = (params: Params): undefined | { timeout: number; when: RegExp } => {
  const defaultTimeout = 4_000
  if (!params.start) return undefined
  if (params.start instanceof RegExp) return { timeout: defaultTimeout, when: params.start }
  return {
    timeout: defaultTimeout,
    ...params.start,
  }
}
