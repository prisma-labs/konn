import { Browser, BrowserType, chromium, LaunchOptions } from 'playwright'
import { NeedsNothing, provider, Provider } from '../../'

export type Needs = NeedsNothing

export type Params = {
  /**
   * @default
   */
  launchOptions?: LaunchOptions
  /**
   * @default chromium
   */
  browser?: BrowserType
}

export type Contributes = {
  browser: Browser
}

export const paramDefaults: Required<Params> = {
  browser: chromium,
  launchOptions: {},
}

/**
 * Contribute a browser instance.
 */
export const create = (params?: Params): Provider<Needs, Contributes> => {
  const config = {
    ...paramDefaults,
    ...params,
  }

  return provider<NeedsNothing, Contributes>()
    .name('browser')
    .before(async (_) => {
      const context = {
        browser: await config.browser.launch(config.launchOptions),
      }

      return context
    })
    .after(async (ctx) => {
      await ctx.browser?.close()
    })
    .done()
}
