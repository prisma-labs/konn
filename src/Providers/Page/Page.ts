import { Browser, BrowserContext, BrowserContextOptions, chromium, Page } from 'playwright'
import { Provider } from '~/provider'
import { provider } from '../..'
import { pageLog } from './pageLog'

jest.setTimeout(10_000)

/**
 * Context data that Page provder needs.
 */
export type Needs = {
  /**
   * Browser to use to create the page. If not given a chromium browser will be automatically created and used.
   */
  browser?: Browser
}

/**
 * Page provider's options.
 */
export type Params = {
  browserContextOptions?: BrowserContextOptions
}

/**
 * Context data that Page provider contributes.
 */
export type Contributes = {
  page: Page
  browserContext: BrowserContext
}

export const paramDefaults: Required<Params> = {
  browserContextOptions: {},
}

/**
 * Add a Playwright page to the context (`.page`).
 *
 * If the context has a browser (`.browser`) then it will be used to create the page.
 * Otherwise a chromium browser will be automatically created and used.
 */
export const create = (params?: Params): Provider<Needs, Contributes> => {
  const optionalResources: {
    browser?: Browser
  } = {}

  const config = {
    ...paramDefaults,
    ...params,
  }

  return provider<Needs, Contributes>()
    .name('page')
    .before(async (ctx) => {
      pageLog.trace('will_setup')

      let browser
      if (ctx.browser) {
        browser = ctx.browser
      } else {
        pageLog.trace('setup_browser', { reason: 'not present in upstream conrtext' })
        browser = await chromium.launch()
        optionalResources.browser = browser
      }

      pageLog.trace('setup_context')
      const browserContext = await browser.newContext(config.browserContextOptions)

      pageLog.trace('setup_page')
      const page = await browserContext.newPage()

      const context = {
        page,
        browserContext,
      }

      pageLog.trace('did_setup')

      return context
    })
    .after(async (ctx) => {
      pageLog.trace('will_setdown')
      await optionalResources.browser?.close()
      // TODO not guaranteed to be here, think about type safety design... failure scenarios, ...
      // This is based on real world errors, but needs minimal repro to understand better
      await ctx.browserContext.close()
      await ctx.page.close()
      pageLog.trace('did_setdown')
    })
    .done()
}
