import * as Fs from 'fs-jetpack'
import { FSJetpack } from 'fs-jetpack/types'
import { Nothing, provider, Provider } from '../../'
import { dirLog } from './dirLog'

export type Params = {
  path: string
}

export type Contributes = {
  fs: FSJetpack
}

/**
 * Create a Dir provider.
 */
export const create = (params?: Params): Provider<Nothing, Contributes> =>
  provider()
    .name('Dir')
    .before(() => {
      dirLog.debug(`will_setup`, { params })

      const path = params?.path ?? Fs.tmpDir().cwd()
      const fs = Fs.cwd(path)

      dirLog.debug(`did_setup`, { cwd: fs.cwd() })

      return {
        fs,
      }
    })
    .done()
