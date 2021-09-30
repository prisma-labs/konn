import { constant, noop } from 'lodash'
import { NoContext } from 'src/types'
import { kont, provider } from '../src'
import { Data1, data1, data2 } from './__data__'

describe('can use a noop provider', () => {
  const ctx = kont().useBeforeEach(provider().done()).done()
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
  kont().beforeEach(constant(data1)).useBeforeEach(p())
  it('test', noop)
})

describe('upstream providers can satisfy requirements of downstream providers', () => {
  const p1 = provider<{}, Data1>().before(constant(data1)).done()
  const p2 = provider<Data1, {}>().before(noop).done()
  kont().useBeforeEach(p1).useBeforeEach(p2)

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
    .beforeEach(constant(data2))
    // @ts-expect-error
    .useBeforeEach(p())
  it('test', noop)
})

describe('static error if provider context needs not met b/c no data', () => {
  const p = provider<Data1, NoContext>()
    .before((ctx) => {
      expect(ctx.a).toEqual(undefined)
    })
    .done()
  // @ts-expect-error
  kont().useBeforeEach(p)
  it('test', noop)
})
