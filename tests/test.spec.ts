import * as Lib from '../src'

it('works', () => {
  expect(nameof(it)).toEqual('it')
})

it('imports using paths config works relative', () => {
  expect(typeof Lib.todo).toEqual('function')
})
