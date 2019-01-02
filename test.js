const npmInstallTo = require('.')

npmInstallTo(
  `${process.env.HOME}/testing`,
  ['treis', 'ramda@latest']
)
.then(console.log)
.catch(console.log)
