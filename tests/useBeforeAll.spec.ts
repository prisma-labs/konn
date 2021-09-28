import { constant, noop } from 'lodash'
import { ContextBase, NoContext } from 'src/types'
import { kont, provider } from '../src'

const data1 = { a: { b: 2 } }

describe('can use a noop provider', () => {
  const ctx = kont().useBeforeAll(provider()).done()
  it('test', () => {
    // @ts-expect-error
    ctx.a
    expect(ctx).toEqual({})
  })
})

describe('can use provider explicitly expecting data', () => {
  const p = () =>
    provider<typeof data1, NoContext>().before((ctx) => {
      expect(ctx.a.b).toEqual(2)
    })
  kont().beforeAll(constant(data1)).useBeforeAll(p())
  it('test', noop)
})

describe('static error if provider context needs not met b/c given data different', () => {
  const p = () =>
    provider<typeof data1, NoContext>().before((ctx) => {
      expect(ctx.a).toEqual(undefined)
    })
  kont()
    .beforeAll(constant({ z: 9 }))
    // @ts-expect-error
    .useBeforeAll(p())
  it('test', noop)
})

describe('static error if provider context needs not met b/c given data different', () => {
  const p1 = () => provider()
  const p2 = provider().before(() => {})
  const p3 = provider().before(() => {
    return { a: 1 }
  })
  kont()
    .beforeAll(constant({ z: 9 }))
    .useBeforeAll(p3)

  it('test', noop)
})

// describe('static error if provider context needs not met b/c no data', () => {
//   const p = () =>
//     provider<typeof data1, NoContext>().before((ctx) => {
//       expect(ctx.a).toEqual(undefined)
//     })
//   // @ts-expect-error
//   kont().useBeforeAll(p())
//   it('test', noop)
// })

const b: { a: 1 } = {} as any
const a: ContextBase = b
