import * as Fs from 'fs-jetpack'
import { konn, providers } from '~/index'
import { Providers } from '~/Providers'

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
        attachTerminal: true,
      })
    )
    .done()
  it('test', () => {
    const filePath = './tests/fixture-process-proof-file.txt'
    expect(Fs.exists(filePath)).toBeTruthy()
    Fs.remove(filePath)
  })
})

describe('error', () => {
  ;[`while running`, `on exit`].map((_) => {
    it(_, () => {
      expect(
        Fs.read(
          `tests/providers-stdlib/childProcess/__error_${_.replace(/ /, '_')}.log.ansi`,
          'utf8'
        )!.replace(/Time:.*/, 'Time: REDACTED')
      ).toMatchSnapshot()
    })
  })
})
