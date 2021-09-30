/* eslint @typescript-eslint/ban-types: "off" */
import { MaybePromise } from './utils'

export type Setup<C1 extends ContextBase, C2 extends ContextBase> = (context: C1) => MaybePromise<void | C2>

export type Setdown<C1 extends ContextBase = ContextBase> = (context: C1) => MaybePromise<void>

export type ContextBase = Record<string, unknown>

export type MergeC<C1 extends ContextBase, C2 extends ContextBase> = C1 & C2

export type Nothing = ContextBase

export type NoContext = {}

export type NeedsNothing = {}
