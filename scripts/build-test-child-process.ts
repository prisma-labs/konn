import execa from 'execa'
import { log } from 'floggy'
import { tests } from '../tests/providers-stdlib/childProcess/__data__'

Object.values(tests).forEach((test) => {
  log.info('generate', { test })
  execa.commandSync(
    `jest --testRegex '.*childProcess/__${test}.ts' 2>tests/providers-stdlib/childProcess/__${test}.log.err.ansi 1>tests/providers-stdlib/childProcess/__${test}.log.out.ansi`,
    {
      reject: false,
      preferLocal: true,
      shell: true,
    }
  )
})

log.info('done')
