const npm = require('global-npm')
const util = require('util')
const npmLoad = util.promisify(npm.load)

process.on('message', async ({ type, data }) => {
  if (type === 'install') {
    await npmLoad(data.npmLoadOpts)
    const npmInstall = util.promisify(npm.commands.install)
    try {
      await npmInstall(data.packages)
      process.send({ type: 'success' })
    } catch (err) {
      process.send({ type: 'error', data: err.message })
    }
  }
})

process.send({
  type: 'ready'
})
