/* eslint @typescript-eslint/no-unsafe-return: "off", @typescript-eslint/no-explicit-any: "off" */
import ono from '@jsdevtools/ono'
import { merge } from 'lodash'
import { MaybePromise } from './utils'

/**
 * A test context allows incrementally consumer test context providers that augment the test suite in a modular way.
 * Each test context provider may supply new values to the test context and integrate into Jest's before/after hooks.
 */
export interface TestContext<C1 extends ContextBase> {
  beforeEach<C2 extends ContextBase>(setup: Setup<C1, C2>): TestContext<MergeContextNeedsContributed<C1, C2>>
  beforeAll<C2 extends ContextBase>(setup: Setup<C1, C2>): TestContext<MergeContextNeedsContributed<C1, C2>>
  useBeforeEach<C2 extends ContextBase>(
    provider: DynamicProvider<C1, C2>
  ): TestContext<MergeContextNeedsContributed<C1, C2>>
  useBeforeAll<C2 extends ContextBase>(
    provider: DynamicProvider<C1, C2>
  ): TestContext<MergeContextNeedsContributed<C1, C2>>
  /**
   * Add a provider to this test context.
   *
   * A provider can augment the test suite in a modular way, supplying new context values and integrating into Jest's before/after hooks.
   */
  use<C2 extends ContextBase>(
    provider: ControlledProvider<C1, C2>
  ): TestContext<MergeContextNeedsContributed<C1, C2>>
  /**
   * Signal completion of incremental context building.
   */
  done(): C1
}

/**
 * Create a "dynamic" provider.
 *
 * Providers can contribute test context and integrate with Jest before/after lifecycle hooks.
 *
 * Dynamic providers are providers that are agnostic to if they are used in beforeAll or beforeEach Jest hooks. Consumers decide.
 */
export const createDynamicProvider = <
  ContextNeeded extends ContextBase,
  ContextContributed extends ContextBase
>(
  provider: DynamicProvider<ContextNeeded, ContextContributed>
): DynamicProvider<ContextNeeded, ContextContributed> => {
  return provider
}

export type DynamicProvider<ContextNeeded extends ContextBase, ContextContributed extends ContextBase> = {
  (register: DynamicRegister<ContextNeeded>):
    | DynamicRegister<ContextContributed>
    | DynamicRegisterAfterAfter<ContextContributed>
  providerName?: string
}

export type DynamicRegister<C1 extends ContextBase> = {
  /**
   * Name this provider.
   *
   * If not given, falls back to the function name.
   */
  name(name: string): DynamicRegisterAfterName<C1>
  before: <C2 extends ContextBase>(
    setup: Setup<C1, C2>
  ) => DynamicRegister<MergeContextNeedsContributed<C1, C2>>
  after: (setdown: Setdown<C1>) => DynamicRegisterAfterAfter<C1>
}

export type DynamicRegisterAfterAfter<C1 extends ContextBase> = {
  after: (setdown: Setdown<C1>) => DynamicRegisterAfterAfter<C1>
}

export type DynamicRegisterAfterName<C1 extends ContextBase> = {
  before: <C2 extends ContextBase>(
    setup: Setup<C1, C2>
  ) => DynamicRegister<MergeContextNeedsContributed<C1, C2>>
  after: (setdown: Setdown<C1>) => DynamicRegisterAfterAfter<C1>
}

/**
 * Create a "controlled" provider.
 *
 * Providers can contribute test context and integrate with Jest before/after lifecycle hooks.
 *
 * Controlled providers are providers that control which Jest hooks they use rather than the consumer.
 */
export const createControlledProvider = <C1 extends ContextBase, C2 extends ContextBase>(
  provider: ControlledProvider<C1, C2>
): ControlledProvider<C1, C2> => provider

/**
 * A provider can augment the test suite in a modular way, supplying new context values and integrating into Jest's before/after hooks.
 */
export type ControlledProvider<C1 extends ContextBase, C2 extends ContextBase> = (
  register: Register<C1>
) => Register<C2> | RegisterBeforeEach<C2>

export type Register<C1 extends ContextBase> = {
  beforeAll<C2 extends ContextBase>(setup: Setup<C1, C2>): Register<MergeContextNeedsContributed<C1, C2>>
  beforeAll$<C2 extends ContextBase>(
    provider: DynamicProvider<C1, C2>
  ): Register<MergeContextNeedsContributed<C1, C2>>
  afterAll(setdown: Setdown<C1>): Register<C1>
  beforeEach<C2 extends ContextBase>(
    setup: Setup<C1, C2>
  ): RegisterBeforeEach<MergeContextNeedsContributed<C1, C2>>
  beforeEach$<C2 extends ContextBase>(
    setup: DynamicProvider<C1, C2>
  ): RegisterBeforeEach<MergeContextNeedsContributed<C1, C2>>
  afterEach(setdown: Setdown<C1>): Register<C1>
}

export type RegisterBeforeEach<C1 extends ContextBase> = {
  beforeEach: <C2 extends ContextBase>(
    setup: Setup<C1, C2>
  ) => RegisterBeforeEach<MergeContextNeedsContributed<C1, C2>>
  afterEach: (setdown: Setdown<C1>) => RegisterBeforeEach<C1>
}

// contributor

export type Setup<C1 extends ContextBase, C2 extends ContextBase> = (
  upstreamContext: C1
) => MaybePromise<void | C2>

export type Setdown<C1 extends ContextBase = ContextBase> = (context: C1) => MaybePromise<void>

export type ContextBase = Record<string, unknown>

// Helpers

// prettier-ignore
type MergeContextNeedsContributed<Needs extends ContextBase, Contributed extends ContextBase> = Needs & Contributed

/**
 * Helpers for interacting with jest lifecycle.
 */

namespace HookNames {
  export type Setup = 'beforeAll' | 'beforeEach'
  export type Setdown = 'afterEach' | 'afterAll'
  export type All = Setdown | Setup
}

const jestHookLookup = {
  beforeAll: beforeAll,
  beforeEach: beforeEach,
  afterAll: afterAll,
  afterEach: afterEach,
}

const jestHookNamePairs = {
  beforeAll: 'afterAll',
  beforeEach: 'afterEach',
} as const

export type Nothing = ContextBase

/**
 * Create a new test context.
 *
 * A test context allows incrementally consumer test context providers that augment the test suite in a
 * modular way.
 * Each test context provider may supply new values to the test context and integrate into Jest's before/after
 * hooks.
 *
 * @example
 *
 *   const ctx = createTestContext().use(browserPage(user1)).done()
 *
 *   it('foobar', () => {
 *     ctx.page.goTo('...')
 *   })
 *
 */
export function create<C extends ContextBase = ContextBase>(): TestContext<C> {
  // @ts-expect-error Initialize...
  const currentContext: C = {}

  const runSetup = (params: {
    providerName: string
    jestHookName: HookNames.Setup
    hookProxy: Setup<C, ContextBase>
  }) => {
    const hook = jestHookLookup[params.jestHookName]

    hook(async () => {
      let contributedContext

      try {
        contributedContext = await params.hookProxy(currentContext)
      } catch (error) {
        throw ono(
          error as Error,
          `Test context "${params.providerName}" failed while running setup logic inside Jest "${params.jestHookName}":`
        )
      }

      merge(currentContext, contributedContext ?? {})
    })
  }

  const runSetdown = (params: {
    providerName: string
    jestHookName: HookNames.Setdown
    hookProxy: Setdown<C>
  }) => {
    const jestHook = jestHookLookup[params.jestHookName]
    jestHook(async () => {
      try {
        await params.hookProxy(currentContext)
      } catch (error) {
        throw ono(
          error as Error,
          `Test context "${params.providerName}" failed while running setdown logic inside Jest "${params.jestHookName}":`
        )
      }
    })
  }

  const runDynamicProvider = (jestHookName: HookNames.Setup, provider: DynamicProvider<C, ContextBase>) => {
    let providerName = getProviderName(provider)

    const register: DynamicRegister<C> = {
      name(name) {
        providerName = name
        return register as any
      },
      before(hookProxy) {
        runSetup({
          providerName,
          jestHookName,
          hookProxy,
        })
        return register as any
      },
      after(hookProxy) {
        runSetdown({
          providerName,
          jestHookName: jestHookNamePairs[jestHookName],
          hookProxy,
        })
        return register as any
      },
    }

    provider(register)
  }

  const runControlledProvider = (provider: ControlledProvider<C, ContextBase>) => {
    const providerName = getProviderName(provider)

    const register: Register<C> = {
      beforeAll(hookProxy) {
        runSetup({
          providerName,
          hookProxy,
          jestHookName: 'beforeAll',
        })
        return register as any
      },
      beforeAll$(provider) {
        runDynamicProvider('beforeAll', provider)
        return register as any
      },
      beforeEach(hookProxy) {
        runSetup({
          providerName,
          hookProxy,
          jestHookName: 'beforeEach',
        })
        return register as any
      },
      beforeEach$(provider) {
        runDynamicProvider('beforeAll', provider)
        return register as any
      },
      afterEach(hookProxy) {
        runSetdown({
          providerName,
          hookProxy,
          jestHookName: 'afterEach',
        })
        return register as any
      },
      afterAll(hookProxy) {
        runSetdown({
          providerName,
          hookProxy,
          jestHookName: 'afterAll',
        })
        return register as any
      },
    }

    provider(register)
  }

  const api: TestContext<C> = {
    use: (controlledProvider) => {
      runControlledProvider(controlledProvider)
      return api as any
    },

    useBeforeAll: (dynamicProvider) => {
      runDynamicProvider('beforeAll', dynamicProvider)
      return api as any
    },

    useBeforeEach: (dynamicProvider) => {
      runDynamicProvider('beforeEach', dynamicProvider)
      return api as any
    },

    beforeAll: (setup) => {
      runSetup({
        jestHookName: 'beforeAll',
        hookProxy: setup,
        providerName: 'INLINE',
      })
      return api as any
    },

    beforeEach: (setup) => {
      runSetup({
        jestHookName: 'beforeEach',
        hookProxy: setup,
        providerName: 'INLINE',
      })
      return api as any
    },

    done() {
      // TODO expose a proxy that gives useful feedback when accessed before tests have started.
      return currentContext
    },
  }

  return api
}

// eslint-disable-next-line
const getProviderName = (provider: Function): string => provider.name ?? '<Unnamed Provider>'
