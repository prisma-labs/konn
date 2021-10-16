/* eslint @typescript-eslint/no-unsafe-return: "off", @typescript-eslint/no-explicit-any: "off" */
import { HookNames, jestHookNamePairs } from './jest'
import { runSetdown, runSetup } from './runners'
import { ContextBase, MergeC, NoContext, Setdown, Setup } from './types'

/**
 * @param contextNeeds  The context that this provider needs.
 * @param konn          This is just a superficial branding to prevent konn providers from being statically
 *                      accepted into inline hook positions.
 *
 *                      For example this should be a static type error:
 *
 *                      ```
 *                      konn().beforeAll(someProvider())
 *                      ```
 *
 *                      Correct code is:
 *
 *                      ```
 *                      konn().useBeforeAll(someProvider())
 *                      ```
 * @remarks The separation of provider from provider builder is an incidental complexity caused by this
 *          TS issue: https://github.com/microsoft/TypeScript/issues/10717
 *
 *          We wish that we could only have builder and it would be called just "provider".
 *
 *          The gist of the problem is that provider builder cannot give contravariance where we need it.
 *
 *          We want a provider to declare its context needs which are contravariant to the context it is
 *          inserted into. That is, the context that surrounds a provider should be a super-type
 *          relationship. However the only way to achieve this is by having the generic passed down from
 *          the konn context to a function parameter, which is not what provider builder is. Hence
 *          separated provider and the .done() api to get to it from builder.
 */
export type Provider<Needs, Contributes> = (contextNeeds: Needs, konn: true) => Contributes

export type ProviderInternal = {
  use(params: { jestHookName: HookNames.Setup; currentContext: ContextBase }): void
  state: {
    name: string
    setups: Setup<ContextBase, ContextBase>[]
    setdowns: Setdown<ContextBase>[]
  }
}

// prettier-ignore
export type ProviderBuilder<Needs extends ContextBase, Contributes extends ContextBase> = NoContext extends Contributes ? {
  name(providerName: string):                                     ProviderBuilderAfterName<Needs, Contributes>
  before<C2 extends Contributes>(setup: Setup<Needs, C2>):        ProviderBuilderAfterBefore<Needs, NoContext extends C2 ? NoContext : C2>
  after(setdown: Setdown<Needs>):                                 ProviderBuilderAfterAfter<Needs, Contributes>
  done():                                                         Provider<Needs, Contributes>
} : {
  // If contribtues is expected then it can never be correct to run "done" or "after" here.
  name(providerName: string):                                     ProviderBuilderAfterName<Needs, Contributes>
  before<C2 extends Contributes>(setup: Setup<Needs, C2>):        ProviderBuilderAfterBefore<Needs, NoContext extends C2 ? NoContext : C2>
  /**
   * Context contribution is expected so you cannot call `after` method before `before` method.
   * 
   * @deprecated
   */
  after(): never
  /**
   * Context contribution is expected so you cannot call `done` method before `before` method.
   * 
   * @deprecated
   */
  done(): never
}

// prettier-ignore
export type ProviderBuilderAfterName<Needs extends ContextBase, Contributes extends ContextBase> = {
  before<C2 extends ContextBase>(setup: Setup<Needs, C2>):        ProviderBuilderAfterBefore<Needs, NoContext extends C2 ? Contributes : MergeC<Contributes, C2>>
  after(setdown: Setdown<Needs>):                                 ProviderBuilderAfterAfter<Needs, Contributes>
  done():                                                         Provider<Needs, Contributes>
}

// prettier-ignore
export type ProviderBuilderAfterBefore<Needs extends ContextBase, Contributes extends ContextBase> = {
  after(setdown: Setdown<MergeC<Needs,Contributes>>):             ProviderBuilderAfterAfter<Needs, Contributes>
  done():                                                         Provider<Needs, Contributes>
}

// prettier-ignore
export type ProviderBuilderAfterAfter<Needs extends ContextBase, Contributes extends ContextBase> = {
  done():                                                         Provider<Needs, Contributes>
}

export type ProviderBuilderInternal = Omit<ProviderBuilder<ContextBase, ContextBase>, 'done'> & {
  done(): ProviderInternal
}

/**
 * Create a "dynamic" provider.
 *
 * Providers can contribute test context and integrate with Jest before/after lifecycle hooks.
 *
 * Dynamic providers are providers that are agnostic to if they are used in beforeAll or beforeEach Jest hooks. Consumers decide.
 */
export const provider = <
  Needs extends ContextBase = NoContext,
  Contributes extends ContextBase = NoContext
>(): ProviderBuilder<Needs, Contributes> => {
  const state: ProviderInternal['state'] = {
    name: '<anonymous>',
    setups: [],
    setdowns: [],
  }

  const api: ProviderBuilderInternal = {
    done() {
      return {
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
      }
    },

    name(providerName) {
      state.name = providerName
      return api as any
    },
    after(setdown) {
      state.setdowns.push(setdown)
      return api as any
    },
    before(setup) {
      state.setups.push(setup)
      return api as any
    },
  }

  return api as any as ProviderBuilder<Needs, Contributes>
}
