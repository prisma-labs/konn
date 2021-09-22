import * as Fs from 'fs-jetpack'
import { FSJetpack } from 'fs-jetpack/types'
import { createDynamicProvider, DynamicProvider, Nothing } from '../../kont'
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
export const create = (params?: Params): DynamicProvider<Nothing, Contributes> =>
  createDynamicProvider((register) =>
    register.name('Dir').before(() => {
      dirLog.debug(`will_setup`, { params })

      const path = params?.path ?? Fs.tmpDir().cwd()
      const fs = Fs.cwd(path)

      dirLog.debug(`did_setup`, { cwd: fs.cwd() })

      return {
        fs,
      }
    })
  )
