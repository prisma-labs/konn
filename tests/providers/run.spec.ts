import { kont } from '~/kont'
import { Providers } from '~/Providers'

/**
 * Test that expected types are exported
 */
type _Types = [Providers.Run.Needs, Providers.Run.Contributes, Providers.Run.Params]

const ctx = kont().useBeforeAll(Providers.Run.create()).done()

it('ctx has access to run commands', () => {
  expect(ctx.run('yarn --version')).toMatchObject({
    command: 'yarn --version',
    escapedCommand: 'yarn --version',
    exitCode: 0,
    failed: false,
    isCanceled: false,
    killed: false,
    stderr: '',
    stdout: '3.0.2',
    timedOut: false,
  })
})
