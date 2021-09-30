import { kont } from '../src'

describe('default context is an empty object', () => {
  const ctx = kont().done()
  it('test', () => {
    // @ts-expect-error
    ctx.a
    expect(ctx).toEqual({})
  })
})
