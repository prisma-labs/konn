import { firefox } from 'playwright'
import { konn } from '~/konn'
import { Providers } from '~/Providers'

jest.setTimeout(60_000)

/**
 * Test that expected types are exported
 */
type _Types = [Providers.Page.Needs, Providers.Page.Contributes, Providers.Browser.Params]

describe(`when browser not in context, chromium browser created and used`, () => {
  const ctx = konn().useBeforeAll(Providers.Page.create()).done()

  it(`test`, async () => {
    await ctx.page.goto(`https://prisma.io`)
    const title = await ctx.page.title()
    expect(await ctx.page.evaluate(() => navigator.userAgent)).toMatch(/HeadlessChrome/)
    expect(title).toMatchInlineSnapshot(`"Prisma - Next-generation Node.js and TypeScript ORM for Databases"`)
  })
})

describe(`when browser in context, is used`, () => {
  const ctx = konn()
    .useBeforeAll(Providers.Browser.create({ browser: firefox }))
    .useBeforeAll(Providers.Page.create())
    .done()

  it(`test`, async () => {
    await ctx.page.goto(`https://prisma.io`)
    const title = await ctx.page.title()
    expect(await ctx.page.evaluate(() => navigator.userAgent)).not.toMatch(/HeadlessChrome/)
    expect(title).toMatchInlineSnapshot(`"Prisma - Next-generation Node.js and TypeScript ORM for Databases"`)
  })
})
