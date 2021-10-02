/* eslint @typescript-eslint/ban-types: "off" */
import { Logger } from 'floggy'
import { HookPhaseNames } from './jest'
import { MaybePromise } from './utils'

export type ProviderUtils = {
  /**
   * A {@link Logger} instance from [Floggy](https://paka.dev/npm/floggy) scoped to this provider.
   */
  log: Logger
  /**
   * The name of this provider.
   */
  name: string
  /**
   * A provider can be used by consumers before all tests or before each test.
   *
   * This value indicates which it is currently for this instance of the provider.
   */
  hook: HookPhaseNames
}

export type Setup<C1 extends ContextBase, C2 extends ContextBase> = (
  context: C1,
  utils: ProviderUtils
) => MaybePromise<void | C2>

export type Setdown<C1 extends ContextBase = ContextBase> = (
  context: C1,
  utils: ProviderUtils
) => MaybePromise<void>

export type ContextBase = Record<string, unknown>

export type MergeC<C1 extends ContextBase, C2 extends ContextBase> = C1 & C2

export type Nothing = ContextBase

export type NoContext = {}

export type NeedsNothing = {}
