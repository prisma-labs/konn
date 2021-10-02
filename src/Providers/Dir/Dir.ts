import * as Fs from 'fs-jetpack'
import { FSJetpack } from 'fs-jetpack/types'
import { NeedsNothing } from '~/types'
import { provider, Provider } from '../../'

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
      const path = config.path ?? Fs.tmpDir().cwd()
      const fs = Fs.cwd(path)
      const context = {
        fs,
      }

      return context
    })
    .after((ctx) => {
      if (config.cleanup) {
        ctx.fs.remove(ctx.fs.cwd())
      }
    })
    .done()
}
