const npmInstallTo = require('.')

npmInstallTo(
  `${process.env.HOME}/testing`,
  ['is-number', 'treis']
)
