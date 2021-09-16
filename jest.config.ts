import type { InitialOptionsTsJest } from 'ts-jest/dist/types'

const config: InitialOptionsTsJest = {
  preset: 'ts-jest',
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
    'jest-watch-select-projects',
    'jest-watch-suspend',
  ],
  globals: {
    'ts-jest': {
      diagnostics: Boolean(process.env.CI),
      compiler: 'ttypescript',
    },
  },
}

export default config
