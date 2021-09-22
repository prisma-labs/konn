import { merge } from 'lodash'
import { kont } from '../src'

describe('beforeEach can return nothing which forwards the context', () => {
  const data = { a: 1 }
  const ctx = kont()
    .beforeAll(() => data)
    .beforeEach(() => {})
    .done()

  it('test', () => {
    expect(ctx).toMatchObject(data)
  })
})

describe('beforeEach can return data which gets deeply merged into the context', () => {
  const data1 = { a: { a1: true } }
  const data2 = { a: { a2: true } }
  const ctx = kont()
    .beforeAll(() => data1)
    .beforeEach(() => data2)
    .done()

  it('test', () => {
    expect(ctx).toMatchObject(merge(data1, data2))
  })
})

describe('beforeEach can return nothing in the middle of a chain', () => {
  const data1 = { a: { a1: true } }
  const data2 = { a: { a2: true } }
  const ctx = kont()
    .beforeAll(() => data1)
    .beforeEach(() => {})
    .beforeEach(() => data2)
    .done()

  it('test', () => {
    expect(ctx).toMatchObject(merge(data1, data2))
  })
})
