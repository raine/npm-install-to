const npmInstallTo = require('.')
const taim = require('taim')

taim('npmInstallTo', npmInstallTo)(`${process.env.HOME}/testing`, [
  'treis@2.6.0',
  'ramda@latest',
  'lodash',
  'raine/taim'
])
  .then(console.log)
  .catch(console.log)
