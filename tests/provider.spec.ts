import { constant } from 'lodash'
import { provider } from '../src'

const data1 = { a: { b: 1 } }

it('can create a provider', () => {
  const p = provider()
  expect(typeof p.after).toEqual('function')
  expect(typeof p.before).toEqual('function')
  expect(typeof p.name).toEqual('function')
})

it('before-context available to downstream befores ', () => {
  provider()
    .before(constant(data1))
    .before((ctx) => {
      ctx.a.b
    })
})

it('before-context available to afters ', () => {
  provider()
    .before(constant(data1))
    .after((ctx) => {
      ctx.a.b
    })
})

it('afters cannot return context ', () => {
  provider()
    // @ts-expect-error
    .after(async () => {
      return data1
    })
})
