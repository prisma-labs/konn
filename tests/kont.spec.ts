import { kont, providers } from '../src'

describe('default context is an empty object', () => {
  const ctx = kont().done()
  it('test', () => {
    // @ts-expect-error
    ctx.a
    expect(ctx).toEqual({})
  })
})

it('can access providers from main module', () => {
  expect(providers).toMatchInlineSnapshot(`
Object {
  "browser": [Function],
  "dir": [Function],
  "page": [Function],
  "run": [Function],
}
`)
})
