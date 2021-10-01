import { kont } from '~/kont'
import { Providers } from '~/Providers'

/**
 * Test that expected types are exported
 */
type _Types = [Providers.Dir.Needs, Providers.Dir.Contributes, Providers.Browser.Params]

const ctx = kont().useBeforeAll(Providers.Dir.create()).done()

it('ctx has access to browser', () => {
  expect(ctx.fs.cwd()).not.toEqual(process.cwd())
})
