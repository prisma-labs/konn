// output not related to start

setTimeout(() => {
  console.log('1 (stdout)')
}, 10)

setTimeout(() => {
  console.log('2 (stdout)')
}, 20)

setTimeout(() => {
  console.error('3 (stderr)')
}, 30)

// long running service
const workingTimeout = setTimeout(() => {}, 1000 * 60 * 60 /* 1h */)

process.on('SIGTERM', () => {
  clearTimeout(workingTimeout)
  process.exit(0)
})
