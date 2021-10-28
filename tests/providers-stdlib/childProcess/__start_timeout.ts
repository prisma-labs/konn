import { konn } from '~/index'
import { Providers } from '~/Providers'
import { tests } from './__data__'

jest.setTimeout(20_000)

describe(tests.start_timeout.replace('_', ' '), () => {
  const ctx = konn()
    .useBeforeAll(
      Providers.ChildProcess.create({
        command: `ts-node ./tests/providers-stdlib/childProcess/__${tests.start_timeout}.fixture.ts`,
        start: {
          when: /ready/,
          timeout: 500,
        },
      })
    )
    .done()

  it('test', async () => {})
})
