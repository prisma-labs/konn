import { constant, merge, noop } from 'lodash'
import { NoContext } from 'src/types'
import { kont, provider } from '../../src'
import { data1, Data1, data2, deepData1, deepData2 } from '../__data__'

describe('can use a noop provider', () => {
  const ctx = kont().useBeforeAll(provider().done()).done()
  it('test', () => {
    // @ts-expect-error
    ctx.a
    expect(ctx).toEqual({})
  })
})

describe('can use provider explicitly expecting data', () => {
  const p = () =>
    provider<Data1, NoContext>()
      .before((ctx) => {
        expect(ctx.a.b).toEqual(2)
      })
      .done()
  kont().beforeAll(constant(data1)).useBeforeAll(p())
  it('test', noop)
})

describe('upstream providers can satisfy requirements of downstream providers', () => {
  const p1 = provider<{}, Data1>().before(constant(data1)).done()
  const p2 = provider<Data1, {}>().before(noop).done()
  kont().useBeforeAll(p1).useBeforeAll(p2)

  it('test', noop)
})

describe('can use multiple providers in a single call', () => {
  const p1 = provider<{}, NoContext>().before(noop).done()
  const p2 = provider<{}, NoContext>().before(noop).done()
  kont().useBeforeAll(p1, p2).done()

  it('test', noop)
})

describe('static error if provider context needs not met b/c given data different', () => {
  const p = () =>
    provider<Data1, NoContext>()
      .before((ctx) => {
        // static error, thus the runtime undefined violated the data requirement
        expect(ctx.a).toEqual(undefined)
      })
      .done()
  kont()
    .beforeAll(constant(data2))
    // @ts-expect-error
    .useBeforeAll(p())
  it('test', noop)
})

describe('static error if provider context needs not met b/c no data', () => {
  const p = provider<Data1, NoContext>()
    .before((ctx) => {
      expect(ctx.a).toEqual(undefined)
    })
    .done()
  // @ts-expect-error
  kont().useBeforeAll(p)
  it('test', noop)
})

describe('after context is partial', () => {
  const p = provider()
    .before(constant(data1))
    .after((ctx) => {
      ctx.a
      ctx.a?.b.toFixed()
      // @ts-expect-error
      ctx.a.b.toFixed()
    })
    .done()
  kont().useBeforeAll(p).done()
  it('test', noop)
})

describe('deep merges', () => {
  const p1 = provider().before(constant(deepData1)).done()
  const p2 = provider().before(constant(deepData2)).done()
  const ctx = kont().useBeforeAll(p1).useBeforeAll(p2).done()
  it('test', () => {
    expect(ctx).toMatchObject(merge(deepData1, deepData2))
  })
})
