import * as Execa from 'execa'
import { provider } from '~/provider'
import { NeedsNothing } from '~/types'
import { timeout } from '~/utils'
import ono from '@jsdevtools/ono'

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
        preferLocal: true,
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

      //eslint-disable-next-line
      ;(childProcess as any).stdioHistory = [] as string[]

      if (params.attachTerminal || params.debug) {
        childProcess.stdout?.pipe(process.stdout)
        childProcess.stderr?.pipe(process.stderr)
      }

      //eslint-disable-next-line
      childProcess.stdout!.on('data', (data) => {
        //@ts-expect-error internal field
        //eslint-disable-next-line
        childProcess.stdioHistory.push(String(data).trim())
      })
      //eslint-disable-next-line
      childProcess.stderr!.on('data', (data) => {
        //@ts-expect-error internal field
        //eslint-disable-next-line
        childProcess.stdioHistory.push(String(data).trim())
      })

      if (params.start) {
        const limit = 10_000
        const start = params.start

        const result = await Promise.race([
          timeout(limit, { unref: true }),
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

        if (result?.timeout) {
          throw new Error(
            `Timed out (${limit} ms) while waiting for child process start signal ${String(start)}`
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
          const e = error as Execa.ExecaError
          if (e.exitCode !== 0) {
            // eslint-disable-next-line
            const history: string = (ctx.childProcess as any).stdioHistory.join('\n')
            throw ono(
              e,
              `The child process exited with non-zero exit code: ${e.exitCode}. Its stdio was:\n\n${history}`
            )
          }
        }
      }
    })
    .done()
