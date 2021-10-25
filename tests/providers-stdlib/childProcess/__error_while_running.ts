import { konn, providers } from '~/index'
import { timeout } from '~/utils'

jest.setTimeout(20_000)

describe('error while running', () => {
  const ctx = konn()
    .useBeforeAll(
      providers.childProcess({
        command: `ts-node ./tests/providers-stdlib/childProcess/__error_while_running.fixture.ts`,
      })
    )
    .done()
  it('test', async () => {
    await timeout(200)
  })
})
