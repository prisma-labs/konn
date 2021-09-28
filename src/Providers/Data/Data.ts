import { ContextBase, Nothing, Provider, provider } from '../../'
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
// export const create = <D extends ContextBase>(data: D): Provider<Nothing, D> =>
//   provider((register) =>
//     register.name('Data').before((ctx) => {
//       dataLog.debug('will_add')
//       return data
//     })
//   )

export const create2 = <D extends ContextBase>(data: D): Provider<Nothing, D> =>
  provider()
    .name('Data')
    .before(() => {
      dataLog.debug('will_add')
      return data
    })
