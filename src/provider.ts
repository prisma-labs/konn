import { HookNames, jestHookNamePairs } from './jest'
import { runSetdown, runSetup } from './runners'
import { ContextBase, MergeC, NoContext, Setdown, Setup } from './types'

// prettier-ignore
export type Provider<Needs extends ContextBase, Contributes extends ContextBase> = {
  // name(providerName: string):                                     Provider<Needs, Contributes>
  before<C2 extends ContextBase>(setup: Setup<Needs, C2>):        Provider<Needs, NoContext extends C2 ? Contributes :  MergeC<Contributes, C2>>
  // before<C2 extends ContextBase>(setup: Setup<Needs, C2>):           Provider<Needs, NoContext extends C2 ? Contributes : MergeC<Contributes,C2>> // Provider<NoContext extends C2 ? Needs : MergeC<Needs,C2>,   NoContext extends C2 ? Contributes : MergeC<Contributes,C2>>
  // after(setdown: Setdown<Needs>):                                 Provider<Needs, Contributes>
  (r: Needs): Provider<Needs,Contributes>
}

export type ProviderInternal = Provider<ContextBase, ContextBase> & {
  use(params: { jestHookName: HookNames.Setup; currentContext: ContextBase }): void
  state: {
    name: string
    setups: Setup<ContextBase, ContextBase>[]
    setdowns: Setdown<ContextBase>[]
  }
}

/**
 * Create a "dynamic" provider.
 *
 * Providers can contribute test context and integrate with Jest before/after lifecycle hooks.
 *
 * Dynamic providers are providers that are agnostic to if they are used in beforeAll or beforeEach Jest hooks. Consumers decide.
 */
export const provider = <
  Needs extends ContextBase = ContextBase,
  Contributes extends ContextBase = NoContext
>(): Provider<Needs, Contributes> => {
  const state: ProviderInternal['state'] = {
    name: '<anonymous>',
    setups: [],
    setdowns: [],
  }

  const api: ProviderInternal = {
    state,
    use(params) {
      state.setups.forEach((setup) => {
        runSetup({
          currentContext: params.currentContext,
          providerName: state.name,
          jestHookName: params.jestHookName,
          setup,
        })
      })

      state.setdowns.forEach((setdown) => {
        runSetdown({
          currentContext: params.currentContext,
          providerName: state.name,
          jestHookName: jestHookNamePairs[params.jestHookName],
          setdown,
        })
      })
    },
    name(providerName) {
      state.name = providerName
      return api
    },
    after(setdown) {
      state.setdowns.push(setdown)
      return api
    },
    // @ts-ignore
    before(setup) {
      state.setups.push(setup)
      return api
    },
  }

  return api as Provider<Needs, Contributes>
}
