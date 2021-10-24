import * as Fs from 'fs-jetpack'
import { konn, providers } from '~/index'
import { Providers } from '~/Providers'

jest.setTimeout(20_000)

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

describe('__fixture_process__', () => {
  const ctx = konn()
    .useBeforeAll(
      providers.childProcess({
        command: `yarn`,
        args: [`ts-node`, `./tests/__fixture_process__.ts`],
        start: /ready/,
        debug: '*',
      })
    )
    .done()

  it('runs while fixture process is running', () => {
    const filePath = './tests/fixture-process-proof-file.txt'
    expect(Fs.exists(filePath)).toBeTruthy()
    Fs.remove(filePath)
  })
})

/**
 * This should fail, but there is no way to tell jest that a hook failure is expected.
 */
// describe.skip('__fixture_process_bad_exit__', () => {
//   const ctx = konn()
//     .useBeforeAll(
//       Providers.ChildProcess.create({
//         command: `yarn ts-node ./tests/__fixture_process_bad_exit__.ts`,
//         start: /ready/,
//         attachTerminal: false,
//       })
//     )
//     .done()

//   it('fails', () => {})
// })
