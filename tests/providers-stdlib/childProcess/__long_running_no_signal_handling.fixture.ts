import * as Fs from 'fs-jetpack'

const filePath = './tests/fixture-process-proof-file.txt'

Fs.write(filePath, '')

setTimeout(() => {
  console.log('ready')
}, 100)

// long running service
const workingTimeout = setTimeout(() => {}, 1000 * 60 * 60 /* 1h */)

process.on('SIGTERM', () => {
  // Not responding to sigterm to force sigkill
})
