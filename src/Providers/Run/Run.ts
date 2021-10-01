import * as Execa from 'execa'
import { provider, Provider } from '../../'
import { Dir } from '../Dir'
import { runLog } from './runLog'

export type Params = {
  /**
   * Which package manager should `runPackageScript` use?
   *
   * @default `'npm'`
   */
  packageManager?: 'npm' | 'yarn' | 'pnpm'
  /**
   * Enable debug mode.
   *
   * When debug mode is enabled then commands will attach to the parent process stdio. This can be helpful
   * when trying to see what a child process is doing via its emitted logs, errors, etc.
   *
   * @default false
   */
  debug?: boolean
}

export type Needs = Partial<Dir.Contributes>

export type Contributes = {
  run(command: string, options?: Execa.SyncOptions): Execa.ExecaSyncReturnValue
  runPackageScript(command: string, options?: Execa.SyncOptions): Execa.ExecaSyncReturnValue
  runAsync(command: string, options?: Execa.SyncOptions): Execa.ExecaChildProcess
  runOrThrow(command: string, options?: Execa.SyncOptions): Execa.ExecaSyncReturnValue
  runOrThrowPackageScript(command: string, options?: Execa.SyncOptions): Execa.ExecaSyncReturnValue
}

/**
 * Create a Run provider.
 *
 * Run provider makes it easy to run child processes.
 *
 * It uses [Execa](https://github.com/sindresorhus/execa) under the hood.
 *
 * If upstream includes `Dir` provider then is used to get the default CWD for commands.
 */
export const create = (params?: Params): Provider<Needs, Contributes> =>
  provider<Needs, Contributes>()
    .name('Run')
    .before((ctx) => {
      const cwd = ctx.fs?.cwd() ?? process.cwd()
      const packageManager = params?.packageManager ?? 'npm'
      const stdio = params?.debug ? 'inherit' : undefined

      const api: Contributes = {
        run(command, options) {
          runLog.trace(`will_run`, { command })
          return Execa.commandSync(command, {
            stdio,
            cwd,
            ...options,
            reject: false,
          })
        },
        runPackageScript(command, options) {
          runLog.trace(`will_run`, { command })
          return Execa.commandSync(`${packageManager} run --silent ${command}`, {
            cwd,
            stdio,
            ...options,
            reject: false,
          })
        },
        runOrThrow(command, options) {
          runLog.trace(`will_run`, { command })
          return Execa.commandSync(command, {
            cwd,
            stdio,
            ...options,
          })
        },
        runOrThrowPackageScript(command, options) {
          runLog.trace(`will_run`, { command })
          return Execa.commandSync(`${packageManager} run --silent ${command}`, {
            cwd,
            stdio,
            ...options,
          })
        },
        runAsync(command, options) {
          runLog.trace(`will_run`, { command })
          return Execa.command(command, {
            cwd,
            stdio,
            ...options,
          })
        },
      }

      return api
    })
    .done()
