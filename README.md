# kont

[![trunk](https://github.com/prisma-labs/kont/actions/workflows/trunk.yml/badge.svg)](https://github.com/prisma-labs/kont/actions/workflows/trunk.yml)

## Introduction

Kont is a library for building contextual data for Jest tests. On the one hand it makes it easy to modularize test resources into reusable abstractions, but it turns out to often just be a better way in general to deal with Jest lifecycle hooks as you'll quickly see.

In this brief introduction we're going to show you how to go from something like this:

```ts
import { chromium } from 'playwright'

let browser

beforeAll(async () => {
  browser = await chromium.launch({
    /* ... */
  })
})

afterAll(async () => {
  await browser?.close()
})

test('...', async () => {
  const page = await browser.newPage()
  // ...
})
```

To something like this:

```ts
import { browser } from './providers/browser'
import { kont } from 'kont'

const ctx = kont()
  .useBeforeAll(
    browser({
      /* ... */
    })
  )
  .done()

test('...', async () => {
  const page = await ctx.browser.newPage()
  // ...
})
```

So, let's begin with that senario:

```ts
import { chromium } from 'playwright'

let browser

beforeAll(async () => {
  browser = await chromium.launch({
    /* ... */
  })
})

afterAll(async () => {
  await browser?.close()
})

test('...', async () => {
  const page = await browser.newPage()
  // ...
})
```

There are multiple problems here:

1. There is a lot of boilerplate just to setup an initial test value.
1. The indirection between the where `browser` is defined, where it is set, and where it is used creates overhead to understand this code. Larger test files exacerbate this point.
1. It can be useful to think of our program as a series of connected inputs/outputs. The above code actively thwarts that however. The input to each lifecycle function, and its output, are not based on functions. As the test suite grows this lack of clarity will hurt more and more.
1. The signal to noise ratio here is not good. The test is the signal, the interesting part. The boilerplate introduces too much noise.
1. The `let` binding for test access to test resources prevents easily lifting the generic logic into a function from another module shared across a test suite, etc.

Let's move this code over to Kont, for now maintaining the inline coding style.

```ts
import { chromium } from 'playwright'
import { kont } from 'kont'

const ctx = kont()
  .beforeAll(async () => {
    return {
      browser: await chromium.launch({
        /* ... */
      }),
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

Hopefully you can see things have improved:

1. We have a lifecycle pipeline clearly showing the input/output chain.
1. Each lifecycle hook is tightly encapsulated needing only to deal with its inputs and return its outputs.
1. A single `ctx` (short for `context`) variable is defined and accessed by the test. `ctx` makes it immediately clear that part of the test is coming from the context.

But perhaps the single most important improvement is that we can now factor out generic code in this test suite. Let's push this example further to show that. First, let's factor the resource into a reusable thing, Kont calls such "things" _providers_.

```ts
import { chromium, LaunchOptions } from 'playwright'
import { kont, provider } from 'kont'

const browser = (params: LaunchOptions) =>
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

const ctx = kont()
  // 3
  .useBeforeAll(
    browser({
      /* ... */
    })
  )
  .done()

test('...', async () => {
  const page = await ctx.browser.newPage()
  // ...
})
```

Here's what has happened:

1. We use Kont's dedicated provider api which is designed to be very similar to the context building API (`kont`).
1. We tap into lifecycle hooks but without committing whether to before each or all tests. This flexibility is left to the consumer of the provider.
1. Finally we consume the provider using another context builder method, `useBeforeAll`.

Now its trivial to move the provider to another module that other tests can import it from. If we wish we can build up a set of such providers for different parts of our test suite, or make very generic ones that we can even publish onto npm and reuse across different projects, or perhaps teams at our organization. The skies the limit.

```ts
// tests/__providers__/browser.ts

import { chromium, LaunchOptions } from 'playwright'
import { provider } from 'kont'

const browser = (params: LaunchOptions) =>
  provider()
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
import { kont } from 'kont'

const ctx = kont()
  .useBeforeAll(
    browser({
      /* ... */
    })
  )
  .done()

test('...', async () => {
  const page = await ctx.browser.newPage()
  // ...
})
```

Finally, another super power of Kont is that it is fully type safe. And that also implies great autocomplete. Here are just some examples to give you a _rough idea_.

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

## Reference Docs

[Read reference docs on Paka](http://paka.dev/npm/kont)
