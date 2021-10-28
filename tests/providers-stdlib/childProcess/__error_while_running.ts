import { konn, providers } from '~/index'
import { timeout } from '~/utils'
import { tests } from './__data__'

jest.setTimeout(20_000)

describe(tests.error_while_running.replace('_', ' '), () => {
  const ctx = konn()
    .useBeforeAll(
      providers.childProcess({
        command: `ts-node ./tests/providers-stdlib/childProcess/__${tests.error_while_running}.fixture.ts`,
      })
    )
    .done()

  it('test', async () => {
    await timeout(1000)
  })
})
