# konn

[![trunk](https://github.com/prisma-labs/konn/actions/workflows/trunk.yml/badge.svg)](https://github.com/prisma-labs/konn/actions/workflows/trunk.yml)

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
- [Q & A](#q--a)
  - [How does context merge?](#how-does-context-merge)
- [Reference Docs](#reference-docs)

<!-- tocstop -->

## Installation

```
npm add --dev konn
```

## Features

- Typesafe Jest lifecycle hooks
- "Providers" – Typesafe modular reusable lifecycle hooks
- Builtin providers:
  - `Dir` Get a temp/given directory and instance of [`fs-jetpack`](https://github.com/szwacz/fs-jetpack) pointing to it.
  - `Browser` Get a [Playwright](https://playwright.dev/) [browser](https://playwright.dev/docs/api/class-browser).
  - `Page` Get a [Playwright](https://playwright.dev/) [page](https://playwright.dev/docs/api/class-page).
  - `Run` Handy child-process methods powered by [Execa](https://github.com/sindresorhus/execa). If `Dir` in upstream context then used for default [CWD](https://github.com/sindresorhus/execa#cwd).
  - `ChildProcess` Easily run a child-process over the test lifecycle, e.g. a Node.js HTTP server in another process for your tests.

## Example

```ts
import { konn, providers } from 'konn'

const ctx = konn()
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

Konn is a library for building contextual data for Jest tests (Konn is only lightly coupled to Jest and could support more things in the future). On the one hand it makes it easy to modularize test resources into reusable abstractions, but it turns out to often just be a better way in general to deal with Jest lifecycle hooks.

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
import { konn } from 'konn'

const ctx = konn().useBeforeAll(browser()).done()

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

How can we improve using Konn? We'll start by using its inline hooks.

```ts
import { chromium } from 'playwright'
import { konn } from 'konn'

const ctx = konn()
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

Now we have a clear input/output flow. We also have weaker coupling between the test and steup/teardown logic which we'll now take advantage of to reduce the boilerplate. We'll use Konn's "providers" feature to modularize the setup/teardown in another module.

```ts
// tests/providers/browser.ts

import { chromium, LaunchOptions } from 'playwright'
import { konn, provider } from 'konn'

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
import { konn, provider } from 'konn'

const ctx = konn().useBeforeAll(browser()).done()
//                 3

test('...', async () => {
  const page = await ctx.browser.newPage()
  // ...
})
```

Steps Taken:

1. We use Konn's dedicated provider API to create our own provider, very similar to the inline API.
1. We tap into lifecycle hooks. Note we don't commit here to whether this is before each or all tests.
1. We consume the provider using Konn's `useBeforeAll` method.

This concludes the introduction. There is more to Konn than this. For example, below are some examples of Konn's typesafety. Happy coding!

```ts
const ctx = konn()
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
konn()
  .useBeforeEach(() => ({
    foo: true,
  }))
  .useBeforeAll((ctx) => ctx.foo /* <-- correctly seen as a static type error */)
```

## Guide

### Context Builder VS Provider Builder APIs

Konn has two primary APIs. A context builder and a provider builer.

The context builder is the primary use-case of Konn for day to day work.

The provider builder API is for library authors and your own project needs when you've found patterns you want to factor out.

It is expected that any sizable test suite is going to be a mix of generic community/standard Konn providers and tailored ones you have written just for your project.

Context Builder API:

```ts
import { konn } from 'konn'

const ctx = konn()
  .beforeEach(/* ... */)
  .afterEach(/* ... */)
  .useBeforeAll(/* ... */)
  .useBeforeEach(/* ... */)
  .done()
```

Provider Builder API:

```ts
import { provider } from 'konn'

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

In Konn the above maps to:

```ts
konn().beforeAll(/* ... */).beforeEach(/* ... */).afterEach(/* ... */).afterAll(/* ... */)
```

In Konn you must signal an end with `.done()` to access the context that tests will use.

```ts
const ctx1 = konn().beforeEach(/* ... */)
const ctx2 = konn().beforeEach(/* ... */).done()

it('...', () => {
  ctx1 // This is still the context builder API!
  ctx2 // Actual context, good to go
})
```

In Konn each setup/setdown function receives context, and setup functions _can_ return additional context.

```ts
konn()
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

Konn statically types that setup functions in before-all hooks cannot see context contributed by setup functions in before-each hooks.

```ts
konn()
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

Konn providers are a way to modularize repetitive setup/setdown logic.

Create them using the provider builder API.

Idiomatic Konn providers do two things:

1. Are wrapped in constructors as usually a provider will have options that can be configured, but even when not, to keep things consistent, it is best practice to do so.

2. Are named. This runtime information improves error messages and log output.

> For static typing reasons provider definitions must end with `.done()` which return apparently a plain function. This is a static "lie" to work around [TypeScript variance control limitatons](https://github.com/microsoft/TypeScript/issues/10717). In actuality, at runtime, something else is being returned and in fact `.done()` is basically a no-op function. Its a small price to pay for the type safety you get with Konn.

```ts
import { provider } from 'konn'

export const foo = () => provider().name('foo').before(/*...*/).after(/*...*/).done()
```

Providers do not control if they will run before all tests, or before each test. This happens instead when providers are used in the context builder API.

```ts
konn().useBeforeAll(someProvider()).useBeforeEach(someOtherProvider()).done()
```

Providers can statically declare what their _upstream context requirements_ are and Konn context builder API ensures that consumers have to honour it or else get a static type error.

```ts
type Needs = {
  toto: boolean
}

const foo = () => provider<Needs>().name('foo').before(/*...*/).after(/*...*/).done()

// ERROR: static type error, no upstream context with `toto: boolean`
konn().useBeforeAll(foo()).done()

// Ok!
konn()
  .beforeAll(() => ({ toto: true }))
  .useBeforeAll(foo())
  .done()
```

Konn's typings are smart enough to correctly handle lifecycle hook order, so this as an error for example:

```ts
// Error! Foo provider is in an before-all-hook which cannot see the context from before-each hooks
konn()
  .beforeEach(() => ({ toto: true }))
  .useBeforeAll(foo())
  .done()
```

### Standard Providers

Konn ships with standard providers for basic things like managing a temp directory or using a Playwright browser.

For in-depth usage details refer to each one's JSDoc.

- `Dir` Get a temp/given directory and instance of [`fs-jetpack`](https://github.com/szwacz/fs-jetpack) pointing to it.
- `Browser` Get a [Playwright](https://playwright.dev/) [browser](https://playwright.dev/docs/api/class-browser).
- `Page` Get a [Playwright](https://playwright.dev/) [page](https://playwright.dev/docs/api/class-page).
- `Run` Handy child-process methods powered by [Execa](https://github.com/sindresorhus/execa). If `Dir` in upstream context then used for default [CWD](https://github.com/sindresorhus/execa#cwd).
- `ChildProcess` Easily run a child-process over the test lifecycle, e.g. a Node.js HTTP server in another process for your tests.

### Reuse & Extension

```ts
const ctx = konn().useBeforeAll(a).useBeforeAll(b).useBeforeAll(c)

describe('Area 1', () => {
  const ctx2 = ctx.useBeforeAll(foo).done()
  it('thing 1', () => {})
  it('thing 2', () => {})
})

describe('Area 2', () => {
  const ctx2 = ctx.useBeforeAll(qux).done()
  it('thing 1', () => {})
  it('thing 2', () => {})
})
```

```ts
// file-1.ts
export const abc = konn().useBeforeAll(a).useBeforeAll(b).useBeforeAll(c)

// file-2.ts
export const efg = konn().useBeforeAll(e).useBeforeAll(f).useBeforeAll(g)

// file-3.ts
import { abc } from './file-1.ts'
import { efg } from './file-1.ts'

const ctx = konn().use(abc).use(efg).done()

describe('Area 1', () => {
  const ctx2 = ctx.useBeforeAll(foo).done()
  it('thing 1', () => {})
  it('thing 2', () => {})
})

describe('Area 2', () => {
  const ctx2 = ctx.useBeforeAll(qux).done()
  it('thing 1', () => {})
  it('thing 2', () => {})
})
```

## Q & A

#### How does context merge?

Using [Lodash `merge`](https://lodash.com/docs/4.17.15#merge).

Example:

```ts
const ctx = konn()
  .beforeAll(() => ({ a: { b: { c1: 1, c3: [1] } } }))
  .beforeEach(() => ({ a: { b: { c2: 2, c3: [2] } } }))
  .done()

expect(ctx).toMatchObject({
  a: {
    b: {
      c1: 1,
      c2: 2,
      c3: [2],
    },
  },
})
```

## Reference Docs

[Read reference docs on Paka](http://paka.dev/npm/konn)
