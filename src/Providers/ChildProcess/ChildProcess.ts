import * as Execa from 'execa'
import { provider } from '~/provider'
import { NeedsNothing } from '~/types'

export type Params = {
  /**
   * The command to run to spawn the child process. This value will be passed to [`Execa.command`]()
   */
  command: string
  start?: RegExp
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
      const childProcess = Execa.command(params.command)

      if (params.start) {
        const start = params.start
        await new Promise((res) => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          childProcess.stdout!.on('data', (buffer) => {
            utils.log.trace('process_data', {
              value: String(buffer).trim(),
            })
            if (start.exec(String(buffer).trim())) {
              res(null)
            }
          })
        })
      }

      return {
        childProcess,
      }
    })
    .after(async (ctx, utils) => {
      if (ctx.childProcess) {
        const childProcess = ctx.childProcess
        childProcess.kill('SIGTERM', {
          forceKillAfterTimeout: 2_000,
        })

        let timeout

        await Promise.race([
          new Promise((res) => {
            timeout = setTimeout(res, 3_000)
          }),
          new Promise((_, rej) => {
            void childProcess.once('error', (err) => {
              rej(err)
            })
          }),
          childProcess.once('close', (code, signal) => {
            utils.log.trace('process_close', {
              code,
              signal,
            })
          }),
        ])

        clearTimeout(timeout)
      }
    })
    .done()
