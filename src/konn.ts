/* eslint @typescript-eslint/no-unsafe-return: "off", @typescript-eslint/no-explicit-any: "off" */
import { Provider, ProviderInternal } from './provider'
import { runSetdown, runSetup } from './runners'
import { ContextBase, MergeC, NoContext, Setdown, Setup } from './types'

/**
 * A test context allows incrementally consumer test context providers that augment the test suite in a modular way.
 * Each test context provider may supply new values to the test context and integrate into Jest's before/after hooks.
 */
// prettier-ignore
export interface Kont<BAC1 extends ContextBase, BEC1 extends ContextBase> {
  // Inline Hooks

  beforeAll    <BAC2 extends ContextBase>(setup: Setup<BAC1, BAC2>):              Kont<NoContext extends BAC2 ? BAC1 : MergeC<BAC1,BAC2>, NoContext extends BAC2 ? BEC1 : MergeC<BEC1,BAC2>>
  beforeEach   <BEC2 extends ContextBase>(setup: Setup<BEC1, BEC2>):              Kont<BAC1,                                              NoContext extends BEC2 ? BEC1 : MergeC<BEC1,BEC2>>

  afterAll                               (setdown: Setdown<MergeC<BAC1,BEC1>>):   Kont<BAC1, BEC1>
  afterEach                              (setdown: Setdown<MergeC<BAC1,BEC1>>):   Kont<BAC1, BEC1>

  // Providers

  useBeforeAll <BAC2 extends ContextBase>(provider: Provider<BAC1, BAC2>):        Kont<NoContext extends BAC2 ? BAC1 : MergeC<BAC1,BAC2>, NoContext extends BAC2 ? BEC1 : MergeC<BEC1,BAC2>>
  useBeforeEach<BEC2 extends ContextBase>(provider: Provider<BEC1, BEC2>):        Kont<BAC1,                                              NoContext extends BEC2 ? BEC1 : MergeC<BEC1,BEC2>>

  /**
   * Signal completion of incremental context building.
   */
  done(): MergeC<BAC1,BEC1>
}

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
export function konn<C extends ContextBase = NoContext, C2 extends ContextBase = NoContext>(): Kont<C, C2> {
  const currentContext: ContextBase = {}

  const api: Kont<ContextBase, ContextBase> = {
    // @ts-expect-error Accessing internal API
    useBeforeAll(provider: ProviderInternal) {
      provider.use({
        currentContext,
        jestHookName: 'beforeAll',
      })
      return api as any
    },
    // @ts-expect-error Accessing internal API
    useBeforeEach(provider: ProviderInternal) {
      provider.use({
        currentContext,
        jestHookName: 'beforeEach',
      })
      return api as any
    },

    beforeAll(setup) {
      runSetup({
        currentContext,
        providerName: 'INLINE',
        jestHookName: 'beforeAll',
        setup,
      })
      return api as any
    },

    beforeEach(setup) {
      runSetup({
        currentContext,
        providerName: 'INLINE',
        jestHookName: 'beforeEach',
        setup,
      })
      return api as any
    },

    afterAll(setdown) {
      runSetdown({
        currentContext,
        providerName: `INLINE`,
        jestHookName: 'afterAll',
        setdown,
      })
      return api as any
    },

    afterEach(setdown) {
      runSetdown({
        currentContext,
        providerName: `INLINE`,
        jestHookName: 'afterEach',
        setdown,
      })
      return api as any
    },

    done() {
      // TODO expose a proxy that gives useful feedback when accessed before tests have started.
      return currentContext
    },
  }

  return api as any
}
