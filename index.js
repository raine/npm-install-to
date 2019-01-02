const { fork } = require('child_process')
const path = require('path')
const npmPackageArg = require('npm-package-arg')
const fs = require('fs')
const util = require('util')
const debug = require('debug')('npm-install-to')
const pFilter = require('p-filter')
const readFile = util.promisify(fs.readFile)

const NPM_OPTS = {
  progress: false,
  loglevel: 'silent'
}

const install = (npmLoadOpts, packages) =>
  new Promise((resolve, reject) => {
    const child = fork('./npm-install-child.js', { silent: true })
    let output = ''
    child.stdout.on('data', (chunk) => {
      output += chunk.toString()
    })
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

const firstDefined = (arr) => arr.find((x) => x !== undefined)

// `package` corresponds to how installed packages are given to npm install
// it could anything like: ramda, ramda@testing, ramda@1.0.0
// TODO: rename the variable to what npm calls the value
const shouldInstallPackage = (installPath) => async (package) => {
  const npa = npmPackageArg(package)
  const pkgJsonPath = path.join(
    installPath,
    'node_modules',
    npa.name,
    'package.json'
  )
  let pkg
  try {
    const rawPkg = await readFile(pkgJsonPath, 'utf8')
    pkg = JSON.parse(rawPkg)
  } catch (e) {
    debug(`failed to read package.json for ${package}, installing`)
    return true
  }

  const checkProp = (prop, npa, pkg) => {
    if (npa.type === prop && pkg._requested.type === prop) {
      if (npa.fetchSpec === pkg._requested.fetchSpec) {
        debug(
          `${package} installed already with same ${prop} (${
            pkg._requested.fetchSpec
          })`
        )
        return false
      } else {
        debug(
          `${package} installed with different ${prop} (${
            pkg._requested.fetchSpec
          }), installing`
        )
        return true
      }
    }
  }

  return firstDefined([
    checkProp('tag', npa, pkg),
    checkProp('version', npa, pkg),
    checkProp('range', npa, pkg),
    true
  ])
}

const npmInstallTo = async (installPath, packages, npmLoadOpts = {}) => {
  npmLoadOpts = { ...NPM_OPTS, ...npmLoadOpts, prefix: installPath }
  const pkgsToBeInstalled = await pFilter(
    packages,
    shouldInstallPackage(installPath)
  )
  debug(`installing`, pkgsToBeInstalled)
  if (pkgsToBeInstalled.length) return install(npmLoadOpts, pkgsToBeInstalled)
}

module.exports = npmInstallTo
