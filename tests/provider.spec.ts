import { constant, noop } from 'lodash'
import { kont, provider } from '../src'
import { data1, Data1 } from './__data__'

it('can create a provider', () => {
  const p = provider()
  expect(typeof p.name).toEqual('function')
  expect(typeof p.before).toEqual('function')
  expect(typeof p.after).toEqual('function')
  expect(typeof p.name).toEqual('function')
})

it('chaining order has constraints', () => {
  provider().name('x').before(constant(data1)).after(noop).done()
  provider().name('x').before(constant(data1)).done()
  provider().name('x').done()
  provider().done()
  provider().after(noop).done()
  provider().name('x').after(noop).done()
  //@ts-expect-error
  provider().before(constant(data1)).name('x').done()
  //@ts-expect-error
  provider().before(constant(data1)).before(constant(data1))
  //@ts-expect-error
  provider().after(noop).before(constant(data1))
  //@ts-expect-error
  provider().before(noop).before(noop)
  //@ts-expect-error
  expect(() => provider().done().after(noop)).toThrowError()
})

it('before-context available to afters ', () => {
  provider()
    .before(constant(data1))
    .after((ctx) => {
      ctx.a.b.toFixed() // typechecks
    })
})

it('explicit Contributes generic forces before return type', () => {
  provider<{}, { a: { b: number } }>()
    .before(constant(data1))
    .after((ctx) => {
      ctx.a.b.toFixed() // typechecks
    })
  provider<{}, { a: { b: number } }>()
    // @ts-expect-error
    .before(constant({ a: 1 }))
})

it('explicit Needs generic types before & after parameters', () => {
  provider<{ a: { b: number } }, {}>()
    .before((ctx) => {
      ctx.a.b.toFixed() // typechecks
    })
    .after((ctx) => {
      ctx.a.b.toFixed() // typechecks
    })
})

it('explicit "Needs" generic makes immediate "done" or "after" is a type error', () => {
  // @ts-expect-error
  // builder normally returns a provider, but here its `never`,
  // so function .name access should be an error.
  provider<{}, Data1>().done().name
  // @ts-expect-error
  provider<{}, Data1>().after(noop)
})

it('"Needs" generic is by default {} not allowing any ctx access', () => {
  provider()
    .before((ctx) => {
      // @ts-expect-error
      ctx.a
    })
    .after((ctx) => {
      // @ts-expect-error
      ctx.a
    })
})

it('afters cannot return context ', () => {
  provider()
    // @ts-expect-error
    .after(() => {
      return data1
    })
})

describe('provider has access to provider utils', () => {
  describe('beforeEach', () => {
    const p = provider()
      .name('p')
      .before((_, utils) => {
        expect(utils.hook).toEqual('each')
        expect(utils.name).toEqual('p')
        expect(typeof utils.log.info).toEqual('function')
      })
      .after((_, utils) => {
        expect(utils.hook).toEqual('each')
        expect(utils.name).toEqual('p')
        expect(typeof utils.log.info).toEqual('function')
      })
      .done()
    kont().useBeforeEach(p)
    it('test', noop)
  })

  describe('beforeAll', () => {
    const p = provider()
      .name('p')
      .before((_, utils) => {
        expect(utils.hook).toEqual('all')
        expect(utils.name).toEqual('p')
        expect(typeof utils.log.info).toEqual('function')
      })
      .after((_, utils) => {
        expect(utils.hook).toEqual('all')
        expect(utils.name).toEqual('p')
        expect(typeof utils.log.info).toEqual('function')
      })
      .done()
    kont().useBeforeAll(p)
    it('test', noop)
  })
})
