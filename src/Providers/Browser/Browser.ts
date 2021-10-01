import { Browser, BrowserType, chromium, LaunchOptions } from 'playwright'
import { NeedsNothing, Provider, provider } from '../../'

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
    .before(async () => ({
      browser: await config.browser.launch(config.launchOptions),
    }))
    .after(async (ctx) => {
      await ctx.browser.close()
    })
    .done()
}
