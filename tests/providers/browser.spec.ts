import { kont } from '~/kont'
import { Providers } from '~/Providers'

/**
 * Test that expected types are exported
 */
type _Types = [Providers.Browser.Needs, Providers.Browser.Contributes, Providers.Browser.Params]

const ctx = kont().useBeforeAll(Providers.Browser.create()).done()

it('ctx has access to browser', () => {
  expect(typeof ctx.browser.newPage).toBe('function')
})
