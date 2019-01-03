const { fork } = require('child_process')
const path = require('path')

const npmInstall = (npmLoadOpts, packages) =>
  new Promise((resolve, reject) => {
    const child = fork(path.join(__dirname, 'npm-install-child.js'), {
      silent: true
    })
    let output = ''
    child.stdout.on('data', (chunk) => {
      output += chunk.toString()
    })
    child.stderr.pipe(process.stderr)
    child.on('message', ({ type, data }) => {
      if (type === 'ready') {
        child.send({
          type: 'install',
          data: { npmLoadOpts, packages }
        })
      } else if (type === 'success') {
        resolve(output.trim())
        child.kill()
      } else if (type === 'error') {
        reject(new Error(data))
        child.kill()
      }
    })
  })

module.exports = npmInstall
