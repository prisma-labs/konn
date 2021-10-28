import { konn } from '~/index'
import { Providers } from '~/Providers'
import { tests } from './__data__'

jest.setTimeout(20_000)

describe(tests.error_on_exit.replace('_', ' '), () => {
  const ctx = konn()
    .useBeforeAll(
      Providers.ChildProcess.create({
        command: `ts-node ./tests/providers-stdlib/childProcess/__${tests.error_on_exit}.fixture.ts`,
        start: /ready/,
      })
    )
    .done()

  it('test', async () => {})
})
