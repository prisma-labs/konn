import * as Execa from 'execa'
import { createDynamicProvider, DynamicProvider } from '../../kont'
import { Dir } from '../Dir'

export type Params = {
  /**
   * Which package manager should `runPackageScript` use?
   *
   * @default `'npm'`
   */
  packageManager?: 'npm' | 'yarn' | 'pnpm'
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
export const create = (params?: Params): DynamicProvider<Needs, Contributes> =>
  createDynamicProvider<Needs, Contributes>((register) =>
    register.before((ctx) => {
      const cwd = ctx.fs?.cwd() ?? process.cwd()
      const packageManager = params?.packageManager ?? 'npm'
      const api: Contributes = {
        run(command, options) {
          // console.log(`${command} ...`)
          return Execa.commandSync(command, {
            cwd,
            ...options,
            reject: false,
          })
        },
        runPackageScript(command, options) {
          // console.log(`${command} ...`)
          return Execa.commandSync(`${packageManager} run --silent ${command}`, {
            cwd,
            ...options,
            reject: false,
          })
        },
        runOrThrow(command, options) {
          // console.log(`${command} ...`)
          return Execa.commandSync(command, {
            cwd,
            ...options,
          })
        },
        runOrThrowPackageScript(command, options) {
          // console.log(`${command} ...`)
          return Execa.commandSync(`${packageManager} run --silent ${command}`, {
            cwd,
            ...options,
          })
        },
        runAsync(command, options) {
          // console.log(`${command} ...`)
          return Execa.command(command, {
            cwd,
            ...options,
          })
        },
      }

      return api
    })
  )
