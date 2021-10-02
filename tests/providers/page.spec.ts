import { firefox } from 'playwright'
import { kont } from '~/kont'
import { Providers } from '~/Providers'

/**
 * Test that expected types are exported
 */
type _Types = [Providers.Page.Needs, Providers.Page.Contributes, Providers.Browser.Params]

describe(`ctx has access to page, creates chromium browser when no browser given in context`, () => {
  const ctx = kont().useBeforeAll(Providers.Page.create()).done()

  it(`test`, async () => {
    await ctx.page.goto(`https://prisma.io`)
    const title = await ctx.page.title()
    expect(await ctx.page.evaluate(() => navigator.userAgent)).toMatch(/HeadlessChrome/)
    expect(title).toMatchInlineSnapshot(`"Prisma - Next-generation Node.js and TypeScript ORM for Databases"`)
  })
})

describe(`ctx has access to page, uses browser in context if given`, () => {
  const ctx = kont()
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
