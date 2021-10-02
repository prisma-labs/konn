import { Browser, BrowserContext, BrowserContextOptions, chromium, Page } from 'playwright'
import { Provider } from '~/provider'
import { provider } from '../..'
import { pageLog } from './pageLog'

export type Needs = {
  browser?: Browser
}

export type Params = {
  browserContextOptions?: BrowserContextOptions
}

export type Contributes = {
  page: Page
  browserContext: BrowserContext
}

export const paramDefaults: Required<Params> = {
  browserContextOptions: {},
}

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
        pageLog.trace('setup_browser', { reason: 'not given in params' })
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
