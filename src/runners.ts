import ono from '@jsdevtools/ono'
import { merge } from 'lodash'
import { HookNames, jestHookLookup } from './jest'
import { ContextBase, Setdown, Setup } from './types'

export const runSetup = (params: {
  currentContext: ContextBase
  providerName: string
  jestHookName: HookNames.Setup
  setup: Setup<ContextBase, ContextBase>
}): void => {
  const hook = jestHookLookup[params.jestHookName]

  hook(async () => {
    let contributedContext

    try {
      contributedContext = await params.setup(params.currentContext)
    } catch (error) {
      throw ono(
        error as Error,
        `Test context "${params.providerName}" failed while running setup logic inside Jest "${params.jestHookName}":`
      )
    }

    merge(params.currentContext, contributedContext ?? {})
  })
}

export const runSetdown = (params: {
  currentContext: ContextBase
  providerName: string
  jestHookName: HookNames.Setdown
  setdown: Setdown<ContextBase>
}): void => {
  const jestHook = jestHookLookup[params.jestHookName]

  jestHook(async () => {
    try {
      await params.setdown(params.currentContext)
    } catch (error) {
      throw ono(
        error as Error,
        `Test context "${params.providerName}" failed while running setdown logic inside Jest "${params.jestHookName}":`
      )
    }
  })
}
