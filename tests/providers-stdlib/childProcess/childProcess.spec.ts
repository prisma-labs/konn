import * as Fs from 'fs-jetpack'
import { konn, providers } from '~/index'
import { Providers } from '~/Providers'
import { timeout } from '~/utils'
import { tests } from './__data__'

jest.setTimeout(30_000)

it('exports shorthand access', () => {
  expect(typeof providers.childProcess).toEqual('function')
})

it('exports longhand access', () => {
  expect(typeof Providers.ChildProcess.create).toEqual('function')
})

/**
 * Test that expected types are exported
 */
type _Types = [
  Providers.ChildProcess.Needs,
  Providers.ChildProcess.Contributes,
  Providers.ChildProcess.Params
]

describe('runs while fixture process is running', () => {
  const ctx = konn()
    .useBeforeAll(
      providers.childProcess({
        command: `ts-node ./tests/providers-stdlib/childProcess/__long_running.fixture.ts`,
        start: /ready/,
      })
    )
    .done()
  it('test', () => {
    const filePath = './tests/fixture-process-proof-file.txt'
    expect(Fs.exists(filePath)).toBeTruthy()
    Fs.remove(filePath)
  })
})

describe('long running node script without signal handling works', () => {
  const ctx = konn()
    .useBeforeAll(
      providers.childProcess({
        command: `ts-node ./tests/providers-stdlib/childProcess/__long_running_no_signal_handling.fixture.ts`,
        start: /ready/,
      })
    )
    .done()
  it('test', async () => {
    await timeout(100)
  })
})

describe('error', () => {
  Object.values(tests).map((_) => {
    it(_.replace(/_/g, ' '), () => {
      expect(
        Fs.read(`tests/providers-stdlib/childProcess/__${_}.log.ansi`, 'utf8')!
          .replace(/Time:.*/, 'Time: DYNAMIC NUMBER')
          .replace(/(^ *at ).*$/gm, '$1DYNAMIC STACK TRACE LINE')
          .replace(/(^ *\/).*$/gm, '$1DYNAMIC FILE PATH')
      ).toMatchSnapshot()
    })
  })
})
