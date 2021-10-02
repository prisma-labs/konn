import ono from '@jsdevtools/ono'
import { merge } from 'lodash'
import { HookNames, jestHookLookup, jestHookToPhase } from './jest'
import { kontLog } from './log'
import { ContextBase, Setdown, Setup } from './types'
import { floggySlugify } from './utils'

export const runSetup = (params: {
  currentContext: ContextBase
  providerName: string
  jestHookName: HookNames.Setup
  setup: Setup<ContextBase, ContextBase>
}): void => {
  const jestHook = jestHookLookup[params.jestHookName]
  const log = kontLog.child(floggySlugify(params.providerName))

  jestHook(async () => {
    log.trace('will_setup', {
      currentContext: params.currentContext,
      jestHook: params.jestHookName,
    })

    let contributedContext

    try {
      contributedContext = await params.setup(params.currentContext, {
        log,
        name: params.providerName,
        hook: jestHookToPhase[params.jestHookName],
      })
    } catch (error) {
      throw ono(
        error as Error,
        `Test context "${params.providerName}" failed while running setup logic inside Jest "${params.jestHookName}":`
      )
    }

    merge(params.currentContext, contributedContext ?? {})

    log.trace('did_setup', { contributedContext })
  })
}

export const runSetdown = (params: {
  currentContext: ContextBase
  providerName: string
  jestHookName: HookNames.Setdown
  setdown: Setdown<ContextBase>
}): void => {
  const jestHook = jestHookLookup[params.jestHookName]
  const log = kontLog.child(floggySlugify(params.providerName))

  jestHook(async () => {
    log.trace('will_setdown', {
      currentContext: params.currentContext,
      jestHook: params.jestHookName,
    })

    try {
      await params.setdown(params.currentContext, {
        log,
        name: params.providerName,
        hook: jestHookToPhase[params.jestHookName],
      })
    } catch (error) {
      throw ono(
        error as Error,
        `Test context "${params.providerName}" failed while running setdown logic inside Jest "${params.jestHookName}":`
      )
    }

    log.trace('did_setdown')
  })
}
