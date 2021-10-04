# kont

[![trunk](https://github.com/prisma-labs/kont/actions/workflows/trunk.yml/badge.svg)](https://github.com/prisma-labs/kont/actions/workflows/trunk.yml)

<!-- toc -->

- [Installation](#installation)
- [Features](#features)
- [Example](#example)
- [Introduction](#introduction)
- [Guide](#guide)
  - [Context Builder VS Provider Builder APIs](#context-builder-vs-provider-builder-apis)
  - [Inline Hooks](#inline-hooks)
  - [Providers](#providers)
  - [Standard Providers](#standard-providers)
- [Reference Docs](#reference-docs)

<!-- tocstop -->

## Installation

```
npm add --dev kont
```

## Features

- Typesafe Jest lifecycle hooks
- "Providers" – Typesafe modular reusable lifecycle hooks
- Builtin providers:
  - `Dir` Get a temp/given directory and instance of [`fs-jetpack`](https://github.com/szwacz/fs-jetpack) pointing to it.
  - `Browser` Get a [Playwright](https://playwright.dev/) [browser](https://playwright.dev/docs/api/class-browser).
  - `Page` Get a [Playwright](https://playwright.dev/) [page](https://playwright.dev/docs/api/class-page).
  - `Run` Handy child-process methods powered by [Execa](https://github.com/sindresorhus/execa). If `Dir` in upstream context then used for default [CWD](https://github.com/sindresorhus/execa#cwd).

## Example

```ts
import { kont, providers } from 'kont'

const ctx = kont()
  .beforeAll(() => ({ foo: 2 }))
  .useBeforeAll(providers.browser())
  .useBeforeEach(providers.page())
  .useBeforeEach(providers.dir())
  .beforeEach((ctx) => ({ bar: ctx.foo + 1 }))
  .afterEach((ctx) => {
    // ...
  })
  .afterAll((ctx) => {
    // ...
  })
  .done()

it('...', async () => {
  expect(ctx.foo).toEqual(1)
  expect(ctx.bar).toEqual(2)

  ctx.fs
  // ...

  ctx.page
  // ...

  const result = ctx.run('whatever')
  // ...

  const page2 = await ctx.browser.newPage()
  // ...
})
```

## Introduction

Kont is a library for building contextual data for Jest tests (Kont is only lightly coupled to Jest and could support more things in the future). On the one hand it makes it easy to modularize test resources into reusable abstractions, but it turns out to often just be a better way in general to deal with Jest lifecycle hooks.

In this brief introduction we're going to show you how to go from this:

```ts
import { chromium } from 'playwright'

let browser

beforeAll(async () => {
  browser = await chromium.launch()
})

afterAll(async () => {
  await browser?.close()
})

test('...', async () => {
  const page = await browser.newPage()
  // ...
})
```

To this:

```ts
import { browser } from './providers/browser'
import { kont } from 'kont'

const ctx = kont().useBeforeAll(browser()).done()

test('...', async () => {
  const page = await ctx.browser.newPage()
  // ...
})
```

Let's begin. What are some problems with the initial code?

1. Writing: Boilerplate to setup a test value.
1. Reading: Low signal to noise ratio. The test is the signal. The boilerplate is the noise.
1. Mental overhead caused by indirection between where `browser` is defined, set, used.
1. Mental overhead caused by tracking the input/output (arguments/return) pipeline implied, (as opposed to encoded natively with functions).
1. Cannot trivially modularize setup/setdown code because `let` binding creates tight coupling.

How can we improve using Kont? We'll start by using its inline hooks.

```ts
import { chromium } from 'playwright'
import { kont } from 'kont'

const ctx = kont()
  .beforeAll(async () => {
    return {
      browser: await chromium.launch(),
    }
  })
  .afterAll(async (ctx) => {
    await ctx.browser.close()
  })
  .done()

test('...', async () => {
  const page = await ctx.browser.newPage()
  // ...
})
```

Now we have a clear input/output flow. We also have weaker coupling between the test and steup/teardown logic which we'll now take advantage of to reduce the boilerplate. We'll use Kont's "providers" feature to modularize the setup/teardown in another module.

```ts
// tests/providers/browser.ts

import { chromium, LaunchOptions } from 'playwright'
import { kont, provider } from 'kont'

export const browser = (params: LaunchOptions) =>
  // 1
  provider()
    // 2
    .before(async () => {
      return {
        browser: await chromium.launch(params),
      }
    })
    .after(async (ctx) => {
      await ctx.browser.close()
    })
    .done()
```

```ts
// tests/foo.test.ts

import { browser } from './providers/browser'
import { kont, provider } from 'kont'

const ctx = kont().useBeforeAll(browser()).done()
//                 3

test('...', async () => {
  const page = await ctx.browser.newPage()
  // ...
})
```

Steps Taken:

1. We use Kont's dedicated provider API to create our own provider, very similar to the inline API.
1. We tap into lifecycle hooks. Note we don't commit here to whether this is before each or all tests.
1. We consume the provider using Kont's `useBeforeAll` method.

This concludes the introduction. There is more to Kont than this. For example, below are some examples of Kont's typesafety. Happy coding!

```ts
const ctx = kont()
  .useBeforeAll(() => ({
    one: 1,
  }))
  .useBeforeEach(() => ({
    two: 2,
  }))
  .useBeforeEach((ctx) => ({
    // typesafe
    three: ctx.one + ctx.two,
  }))
  .done()

it('...', () => {
  // typesafe
  expect([ctx.one, ctx.two, ctx.three]).toEqual([1, 2, 3])
})
```

```ts
kont()
  .useBeforeEach(() => ({
    foo: true,
  }))
  .useBeforeAll((ctx) => ctx.foo /* <-- correctly seen as a static type error */)
```

## Guide

### Context Builder VS Provider Builder APIs

Kont has two primary APIs. A context builder and a provider builer.

The context builder is the primary use-case of Kont for day to day work.

The provider builder API is for library authors and your own project needs when you've found patterns you want to factor out.

It is expected that any sizable test suite is going to be a mix of generic community/standard Kont providers and tailored ones you have written just for your project.

Context Builder API:

```ts
import { kont } from 'kont'

const ctx = kont()
  .beforeEach(/* ... */)
  .afterEach(/* ... */)
  .useBeforeAll(/* ... */)
  .useBeforeEach(/* ... */)
  .done()
```

Provider Builder API:

```ts
import { provider } from 'kont'

export const foo = () => provider().name('foo').before(/* ... */).after(/* ... */).done()
```

### Inline Hooks

In Jest you have these hooks:

```ts
beforeAll(/* ... */)
beforeEach(/* ... */)
afterEach(/* ... */)
afterAll(/* ... */)
```

In Kont the above maps to:

```ts
kont().beforeAll(/* ... */).beforeEach(/* ... */).afterEach(/* ... */).afterAll(/* ... */)
```

In Kont you must signal an end with `.done()` to access the context that tests will use.

```ts
const ctx1 = kont().beforeEach(/* ... */)
const ctx2 = kont().beforeEach(/* ... */).done()

it('...', () => {
  ctx1 // This is still the context builder API!
  ctx2 // Actual context, good to go
})
```

In Kont each setup/setdown function receives context, and setup functions _can_ return additional context.

```ts
kont()
  .beforeAll((ctx) => {
    return {
      a: 1,
    }
  })
  .beforeEach((ctx) => {
    ctx.a
    return {
      b: 2,
    }
  })
  .afterEach((ctx) => {
    ctx.a
    ctx.b
  })
  .afterAll(() => {
    ctx.a
    ctx.b
  })
```

Kont statically types that setup functions in before-all hooks cannot see context contributed by setup functions in before-each hooks.

```ts
kont()
  .beforeEach((ctx) => {
    return {
      b: 2,
    }
  })
  .beforeAll((ctx) => {
    ctx.b // static type error
  })
  .done()
```

### Providers

Kont providers are a way to modularize repetitive setup/setdown logic.

Create them using the provider builder API.

Idiomatic Kont providers do two things:

1. Are wrapped in constructors as usually a provider will have options that can be configured, but even when not, to keep things consistent, it is best practice to do so.

2. Are named. This runtime information improves error messages and log output.

> For static typing reasons provider definitions must end with `.done()` which return apparently a plain function. This is a static "lie" to work around [TypeScript variance control limitatons](https://github.com/microsoft/TypeScript/issues/10717). In actuality, at runtime, something else is being returned and in fact `.done()` is basically a no-op function. Its a small price to pay for the type safety you get with Kont.

```ts
import { provider } from 'kont'

export const foo = () => provider().name('foo').before(/*...*/).after(/*...*/).done()
```

Providers do not control if they will run before all tests, or before each test. This happens instead when providers are used in the context builder API.

```ts
kont().useBeforeAll(someProvider()).useBeforeEach(someOtherProvider()).done()
```

Providers can statically declare what their _upstream context requirements_ are and Kont context builder API ensures that consumers have to honour it or else get a static type error.

```ts
type Needs = {
  toto: boolean
}

const foo = () => provider<Needs>().name('foo').before(/*...*/).after(/*...*/).done()

// ERROR: static type error, no upstream context with `toto: boolean`
kont().useBeforeAll(foo()).done()

// Ok!
kont()
  .beforeAll(() => ({ toto: true }))
  .useBeforeAll(foo())
  .done()
```

Kont's typings are smart enough to correctly handle lifecycle hook order, so this as an error for example:

```ts
// Error! Foo provider is in an before-all-hook which cannot see the context from before-each hooks
kont()
  .beforeEach(() => ({ toto: true }))
  .useBeforeAll(foo())
  .done()
```

### Standard Providers

Kont ships with standard providers for basic things like managing a temp directory or using a Playwright browser.

For in-depth usage details refer to each one's JSDoc.

- `Dir` Get a temp/given directory and instance of [`fs-jetpack`](https://github.com/szwacz/fs-jetpack) pointing to it.
- `Browser` Get a [Playwright](https://playwright.dev/) [browser](https://playwright.dev/docs/api/class-browser).
- `Page` Get a [Playwright](https://playwright.dev/) [page](https://playwright.dev/docs/api/class-page).
- `Run` Handy child-process methods powered by [Execa](https://github.com/sindresorhus/execa). If `Dir` in upstream context then used for default [CWD](https://github.com/sindresorhus/execa#cwd).

## Reference Docs

[Read reference docs on Paka](http://paka.dev/npm/kont)
