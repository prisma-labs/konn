import { noop } from 'lodash'
import { konn } from '~/konn'
import { Providers } from '~/Providers'

/**
 * Test that expected types are exported
 */
type _Types = [Providers.Dir.Needs, Providers.Dir.Contributes, Providers.Browser.Params]

describe(`ctx has access to fs-jetpack pointed at created directory`, () => {
  const ctx = konn().useBeforeAll(Providers.Dir.create()).done()

  it(`test`, () => {
    expect(ctx.fs.cwd()).not.toEqual(process.cwd())
  })
})

describe('can cleanup dir after test', () => {
  const ctx = konn()
    .useBeforeAll(Providers.Dir.create({ cleanup: true }))
    .done()

  it('test', noop)

  afterAll(() => {
    expect(ctx.fs.exists(ctx.fs.cwd())).toBe(false)
  })
})
