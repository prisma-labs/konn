import { konn } from '~/index'
import { Providers } from '~/Providers'

jest.setTimeout(20_000)

describe('process bad exit', () => {
  const ctx = konn()
    .useBeforeAll(
      Providers.ChildProcess.create({
        command: `ts-node ./tests/providers-stdlib/childProcess/__fail_on_exit.fixture.ts`,
        start: /ready/,
      })
    )
    .done()

  it('test', async () => {})
})
