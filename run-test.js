const { npmInstallTo, getPkgsToBeInstalled } = require('.')
const taim = require('taim')
const path = `${process.env.HOME}/testing`

;(async () => {
  await getPkgsToBeInstalled(path, ['treis@2.6.0', 'ramda@latest'])
    .then(console.log)

  await taim('npmInstallTo', npmInstallTo)(path, [
    'treis@2.6.0',
    'ramda@latest',
    'lodash',
    'raine/taim'
  ])
  .then(console.log)
  .catch(console.log)
})()
