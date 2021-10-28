import { casesHandled } from 'floggy/dist-cjs/utils'
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
      const stdio = Fs.read(`tests/providers-stdlib/childProcess/__${_}.log.ansi`, 'utf8')!
      expect(stdio).toMatch(/Test Suites: \d failed, \d total/)
      switch (_) {
        case 'error_on_exit':
          expect(stdio).toMatch(/Error: Something bad happened while reacting to sigterm/)
          break
        case 'error_on_spawn':
          expect(stdio).toMatch(/Error while attempting to spawn: spawn this-will-fail-on-spawn ENOENT/)
          break
        case 'start_timeout':
          expect(stdio).toMatch(
            /Timed out \(500 ms\) while waiting for child process start signal \/ready\/. While waiting, saw this stdout and stderr output from the process:/
          )
          // TODO
          // In CI this does not work on macOS for some reason...
          // There, it shows the message: N/A -- THERE WAS NO STDOUT/STDERR FROM THE CHILD PROCESS!
          // expect(stdio).toMatch(/-+\n *1 \(stdout\)\n *2 \(stdout\)\n *3 \(stderr\)\n *-+/)
          break
        case 'error_while_running':
          expect(stdio).toMatch(/Error: Something went wrong while running./)
          break
        default:
          casesHandled(_)
      }
    })
  })
})
