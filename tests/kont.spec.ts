import * as n from 'nexus'
import { konn, providers } from '../src'

console.log(n)

describe('default context is an empty object', () => {
  const ctx = konn().done()
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
