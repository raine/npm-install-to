const npmInstallTo = require('.')
const taim = require('taim')

taim('npmInstallTo', npmInstallTo)(
  `${process.env.HOME}/testing`,
  [
    'ramda@0.26.1',
    '/Users/raine/code/npm-install-to/treis-2.6.0.tgz'
  ]
)
.then(console.log)
.catch(console.log)
