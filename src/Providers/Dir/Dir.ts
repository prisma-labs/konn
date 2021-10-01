import * as Fs from 'fs-jetpack'
import { FSJetpack } from 'fs-jetpack/types'
import { NeedsNothing } from '~/types'
import { provider, Provider } from '../../'
import { dirLog } from './dirLog'

export type Needs = NeedsNothing

export type Params = {
  /**
   * Where should the directory be created? When `null` a dynamic tmp directory will be gotten from the
   * operating system.
   *
   * @default null
   */
  path?: string | null
  /**
   * Should the directory be deleted after the test completes?
   *
   * @default false
   */
  cleanup?: boolean
}

export type Contributes = {
  fs: FSJetpack
}

export const paramDefaults: Required<Params> = {
  path: null,
  cleanup: false,
}

/**
 * Create a Dir provider.
 */
export const create = (params?: Params): Provider<Needs, Contributes> => {
  const config = {
    ...paramDefaults,
    ...params,
  }

  return provider()
    .name('Dir')
    .before(() => {
      dirLog.trace(`will_setup`, { params })

      const path = config.path ?? Fs.tmpDir().cwd()
      const fs = Fs.cwd(path)
      const context = {
        fs,
      }

      dirLog.trace(`did_setup`, { cwd: fs.cwd() })

      return context
    })
    .after((ctx) => {
      dirLog.trace(`will_setdown`, { params })

      if (config.cleanup) {
        ctx.fs.remove(ctx.fs.cwd())
      }

      dirLog.trace(`did_setdown`)
    })
    .done()
}
