import execa from 'execa'
import { log } from 'floggy'
import * as Fs from 'fs-jetpack'
import { tests } from '../tests/providers-stdlib/childProcess/__data__'

log.settings({
  pretty: true,
})

void main()

async function main() {
  for (const test of Object.values(tests)) {
    log.info('generate', { test })

    const result = (await execa.command(`jest --testRegex '.*childProcess/__${test}.ts'`, {
      timeout: 20_000,
      all: true,
      reject: false,
      preferLocal: true,
    })) as execa.ExecaSyncReturnValue<string> & { all: string }

    Fs.write(`tests/providers-stdlib/childProcess/__${test}.log.ansi`, result.all)
  }

  log.info('done')
}
