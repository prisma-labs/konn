import { constant, noop } from 'lodash'
import { konn } from '../../src'
import { data1, data2 } from '../__data__'

describe('cannot return anything', () => {
  konn()
    .beforeAll(constant(data1))
    // Statically forbidden
    // @ts-expect-error
    .afterAll(constant(data2))
    .afterAll((ctx) => {
      // No runtime effect
      // @ts-expect-error
      expect(ctx.z).toBe(undefined)
    })
    .done()
  it('test', noop)
})

describe(`has access to upstream "all" & "each" context with partial typing`, () => {
  konn()
    .beforeAll(constant(data1))
    .beforeEach(constant(data2))
    .afterAll((ctx) => {
      // data1 from "all"
      ctx.a?.b
      ctx.a?.b.toFixed()
      // @ts-expect-error is partial
      ctx.a.b
      // data2 from "each"
      ctx.z?.y
      ctx.z?.y.toFixed()
      // @ts-expect-error is partial
      ctx.z.y
      expect(ctx).toMatchObject({
        a: {
          b: 2,
        },
        z: {
          y: 99,
        },
      })
    })
    .done()
  it('test', noop)
})

describe('can be chained with more "before" hooks but does not have access to them statically', () => {
  konn()
    .beforeAll(constant(data1))
    .afterAll((ctx) => {
      // data1 from "all"
      ctx.a?.b
      ctx.a?.b.toFixed()
      // @ts-expect-error is partial
      ctx.a.b
      // @ts-expect-error cannot see data2 from "each"
      ctx.z
      expect(ctx).toMatchObject({
        a: {
          b: 2,
        },
        // Note: technically available at runtime though
        z: {
          y: 99,
        },
      })
    })
    .beforeEach(constant(data2))
    .done()
  it('test', noop)
})
