import * as Fs from 'fs-jetpack'
import { FSJetpack } from 'fs-jetpack/types'
import { createDynamicProvider, Nothing } from 'src'
import { DynamicProvider } from 'src/kont'

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
    register.before(() => {
      const path = params?.path ?? Fs.tmpDir().cwd()
      const fs = Fs.cwd(path)
      return {
        fs,
      }
    })
  )
