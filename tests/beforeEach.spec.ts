import { constant } from 'lodash'
import { kont } from '../src'

const data1 = { a: { b: 1 } }
const data2 = { z: { y: 99 } }

describe('beforeEach can return nothing which forwards the context', () => {
  const ctx = kont()
    .beforeEach(constant(data1))
    .beforeEach(() => {})
    .done()
  it('test', () => {
    expect(ctx.a.b).toEqual(1)
  })
})

describe('beforeEach can return data which gets deeply merged into the context', () => {
  const ctx = kont()
    .beforeEach(() => data1)
    .beforeEach(() => data2)
    .done()
  it('test', () => {
    expect(ctx.a.b).toEqual(1)
    expect(ctx.z.y).toEqual(99)
  })
})

describe('beforeEach can return nothing in the middle of a chain', () => {
  const ctx = kont()
    .beforeEach(() => data1)
    .beforeEach(() => {})
    .beforeEach(() => data2)
    .done()
  it('test', () => {
    expect(ctx.a.b).toEqual(1)
    expect(ctx.z.y).toEqual(99)
  })
})

describe('default context is an empty object', () => {
  const ctx = kont()
    .beforeEach((ctx) => {
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
