import { constant, merge, noop } from 'lodash'
import { Providers } from '~/Providers'
import { kont, provider } from '../src'
import { data1, deepData1, deepData2 } from './__data__'

describe('static type error when provier passed to inline hooks', () => {
  // @ts-expect-error
  kont().beforeAll(Providers.Dir.create())
  // This test is skipped since if it runs it will lead to a runtime error given the above bad usage.
  it.skip('test', noop)
})

describe('beforeEach context is available to downstream beforeEach & test but NOT beforeAll', () => {
  const ctx = kont()
    .beforeEach(constant(data1))
    .beforeEach((ctx) => ({ b2: ctx.a.b }))
    // @ts-expect-error
    .beforeAll((ctx) => ({ b1: ctx.a }))
    .done()
  it('test', () => {
    expect(ctx.a.b).toBe(2)
    expect(ctx.b1).toBe(undefined)
    expect(ctx.b2).toBe(2)
  })
})

describe('beforeAll context is available to downstream beforeAll & beforeEach & test', () => {
  const ctx = kont()
    .beforeAll(constant(data1))
    .beforeAll((ctx) => ({ b1: ctx.a.b }))
    .beforeEach((ctx) => ({ b2: ctx.a.b }))
    .done()
  it('test', () => {
    expect(ctx.a.b).toBe(2)
    expect(ctx.b1).toBe(2)
    expect(ctx.b2).toBe(2)
  })
})

describe('deep merges', () => {
  const p1 = provider().before(constant(deepData1)).done()
  const p2 = provider().before(constant(deepData2)).done()
  const ctx = kont()
    .useBeforeAll(p1)
    .useBeforeEach(p2)
    .beforeAll(constant({ inline: { a: 1 } }))
    .beforeEach(constant({ inline: { b: 2 } }))
    .done()
  it('test', () => {
    expect(ctx).toMatchObject(merge(deepData1, deepData2, { inline: { a: 1, b: 2 } }))
  })
})
