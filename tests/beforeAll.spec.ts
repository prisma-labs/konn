import { constant } from 'lodash'
import { kont } from '../src'
import { data1, data2 } from './__data__'

describe('beforeAll can return nothing which forwards the context', () => {
  const ctx = kont()
    .beforeAll(constant(data1))
    .beforeAll(() => {})
    .done()
  it('test', () => {
    expect(ctx.a.b).toEqual(2)
  })
})

describe('beforeAll can return data which gets deeply merged into the context', () => {
  const ctx = kont()
    .beforeAll(() => data1)
    .beforeAll(() => data2)
    .done()
  it('test', () => {
    expect(ctx.a.b).toEqual(2)
    expect(ctx.z.y).toEqual(99)
  })
})

describe('beforeAll can return nothing in the middle of a chain', () => {
  const ctx = kont()
    .beforeAll(() => data1)
    .beforeAll(() => {})
    .beforeAll(() => data2)
    .done()
  it('test', () => {
    expect(ctx.a.b).toEqual(2)
    expect(ctx.z.y).toEqual(99)
  })
})

describe('default context is an empty object', () => {
  const ctx = kont()
    .beforeAll((ctx) => {
      // @ts-expect-error
      ctx.a
    })
    .done()
  it('test', () => {
    // @ts-expect-error
    ctx.a
    expect(ctx).toEqual({})
  })
})
