const { fork } = require('child_process')

const NPM_OPTS = {
  progress: false,
  loglevel: 'silent'
}

const npmInstallTo = async (destPath, packages, npmLoadOpts = {}) => {
  npmLoadOpts = { ...NPM_OPTS, ...npmLoadOpts, prefix: destPath }
  const child = fork('./npm-install-child.js', { silent: true })
  child.on('message', ({ type, data }) => {
    if (type === 'ready') {
      child.send({
        type: 'install',
        data: { npmLoadOpts, packages }
      })
    } else if (type === 'success') {
      child.kill()
    } else if (type === 'error') {
      throw new Error(data)
      child.kill()
    }
  })
}

module.exports = npmInstallTo
