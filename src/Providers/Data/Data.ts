import { Nothing } from 'src'
import { ContextBase, createDynamicProvider, DynamicProvider } from '../../kont'
import { dataLog } from './dataLog'

/**
 * Convenience for loading static data into the context.
 *
 * @example
 *
 *   ctx = kont()
 *     .useBeforeAll(Providers.Data.create({ one: 1 }))
 *     .done()
 *
 *   it('foobar', () => {
 *     expect(ctx.one).toEqual(1)
 *   })
 *
 */
export const create = <D extends ContextBase>(data: D): DynamicProvider<Nothing, D> =>
  createDynamicProvider((register) =>
    register.name('Data').before(() => {
      dataLog.debug('will_add')
      return data
    })
  )
