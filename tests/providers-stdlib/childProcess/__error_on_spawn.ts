import { noop } from 'lodash'
import { konn } from '~/index'
import { Providers } from '~/Providers'
import { tests } from './__data__'

jest.setTimeout(20_000)

describe(tests.error_on_spawn.replace('_', ' '), () => {
  const ctx = konn()
    .useBeforeAll(
      Providers.ChildProcess.create({
        command: `this-will-fail-on-spawn`,
      })
    )
    .done()

  it('test', noop)
})
