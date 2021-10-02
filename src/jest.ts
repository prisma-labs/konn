export const jestHookLookup = {
  beforeAll: beforeAll,
  beforeEach: beforeEach,
  afterAll: afterAll,
  afterEach: afterEach,
}

export const jestHookNamePairs = {
  beforeAll: 'afterAll',
  beforeEach: 'afterEach',
} as const

/**
 * Helpers for interacting with jest lifecycle.
 */

export namespace HookNames {
  export type Setup = 'beforeAll' | 'beforeEach'
  export type Setdown = 'afterEach' | 'afterAll'
  export type All = Setdown | Setup
}

export type HookPhaseNames = 'each' | 'all'

export const jestHookToPhase = {
  beforeAll: 'all',
  beforeEach: 'each',
  afterAll: 'all',
  afterEach: 'each',
} as const
