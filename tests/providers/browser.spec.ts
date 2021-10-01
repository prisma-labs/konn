import { kont } from '~/kont'
import { Providers } from '~/Providers'

const ctx = kont().useBeforeAll(Providers.Browser.create()).done()

it('ctx has access to browser', () => {
  expect(typeof ctx.browser.newPage).toBe('function')
})
