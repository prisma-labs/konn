import { Browser, BrowserType, chromium, LaunchOptions } from 'playwright'
import { NeedsNothing, Provider, provider } from '../../'
import { browserLog } from './browserLog'

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
    .before(async () => {
      browserLog.debug('will_setup')

      const context = {
        browser: await config.browser.launch(config.launchOptions),
      }

      browserLog.debug('did_setup')

      return context
    })
    .after(async (ctx) => {
      browserLog.debug('will_setdown')
      await ctx.browser.close()
      browserLog.debug('did_setdown')
    })
    .done()
}
