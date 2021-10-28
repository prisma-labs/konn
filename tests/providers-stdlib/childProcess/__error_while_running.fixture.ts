console.log('ready')

setTimeout(() => {
  throw new Error('Something went wrong while running.')
}, 100)

process.on('SIGTERM', () => {
  process.exit(0)
})
