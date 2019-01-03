const { fork } = require('child_process')
const path = require('path')
const npmPackageArg = require('npm-package-arg')
const fs = require('fs')
const util = require('util')
const debug = require('debug')('npm-install-to')
const readFile = util.promisify(fs.readFile)
const fg = require('fast-glob')
const zip = require('lodash.zip')
const fromPairs = require('lodash.fromPairs')
const pProps = require('p-props')
const pFilter = require('p-filter')
const pMemoize = require('p-memoize')

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

const readJsonFile = (p) => readFile(p, 'utf8').then(JSON.parse)
const firstDefined = (arr) => arr.find((x) => x !== undefined)
const isTarball = (str) => str.endsWith('.tgz') || str.endsWith('.tar.gz')
const readGlobJsons = (glob) =>
  fg(glob).then((paths) => Promise.all(paths.map(readJsonFile)))
const readInstallPathPkgJsons = (installPath) =>
  readGlobJsons(path.join(installPath, 'node_modules', '*', 'package.json'))
const readInstallPathPkgJsonsMemoized = pMemoize(readInstallPathPkgJsons)
const findMatchingPkgJson = (installPath, pred) =>
  readInstallPathPkgJsonsMemoized(installPath).then((pkgs) => pkgs.find(pred))

// `package` corresponds to how installed packages are given to npm install
// it could anything like: ramda, ramda@testing, ramda@1.0.0, ramda-0.26.1.tgz
const shouldInstallPackage = (installPath) => async (packageSpec) => {
  const npa = npmPackageArg(packageSpec)
  let pkg
  if (isTarball(packageSpec)) {
    const tarballBasename = path.basename(packageSpec)
    const pkg = await findMatchingPkgJson(installPath, (_pkg) =>
      _pkg._requested.fetchSpec.endsWith(tarballBasename)
    )
    debug(
      `package.json matching tarball ${packageSpec} ${
        !pkg ? 'not found, installing' : 'found, not installing'
      }`
    )
    return pkg ? false : true
  } else if (npa.type === 'git') {
    const pkg = await findMatchingPkgJson(
      installPath,
      (_pkg) =>
        _pkg._requested.type === 'git' &&
        _pkg._requested.rawSpec === packageSpec
    )
    debug(
      `package.json matching git repo ${packageSpec} ${
        !pkg ? 'not found, installing' : 'found, not installing'
      }`
    )
    return pkg ? false : true
  } else {
    const pkgJsonPath = path.join(
      installPath,
      'node_modules',
      npa.name,
      'package.json'
    )
    try {
      pkg = await readJsonFile(pkgJsonPath)
      debug(`found package.json for ${packageSpec}`)
    } catch (e) {
      debug(`failed to read package.json for ${packageSpec}, installing`)
      return true
    }
  }

  const checkProp = (prop, npa, pkg) => {
    if (npa.type === prop && pkg._requested.type === prop) {
      if (npa.fetchSpec === pkg._requested.fetchSpec) {
        debug(
          `${packageSpec} installed already with same ${prop} (${
            pkg._requested.fetchSpec
          })`
        )
        return false
      } else {
        debug(
          `${packageSpec} installed with different ${prop} (${
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

const getPkgSpecInstalledLocation = (installPath) => (pkgSpec) => {
  const npa = npmPackageArg(pkgSpec)
  // Optimization: If name can be determined from pkgSpec, we don't have to
  // waste time reading package.jsons again from installPath/node_modules/*, and
  // can simply assume that after successful npm install the module will be
  // found there, with the npa.name as directory name
  return npa.name
    ? path.join(installPath, 'node_modules', npa.name)
    : findMatchingPkgJson(installPath, (pkg) => pkg._spec === pkgSpec).then(
        (pkg) => path.join(installPath, 'node_modules', pkg._location)
      )
}

const npmInstallTo = async (installPath, packages, npmLoadOpts = {}) => {
  npmLoadOpts = { ...NPM_OPTS, ...npmLoadOpts, prefix: installPath }
  const pkgsToBeInstalled = await pFilter(
    packages,
    shouldInstallPackage(installPath)
  )
  debug(`installing`, pkgsToBeInstalled)
  let npmOutput = null
  if (pkgsToBeInstalled.length)
    npmOutput = await install(npmLoadOpts, pkgsToBeInstalled)

  // Clear the cache for this memoized promise returning function, because
  // npm install would have changed contents of installPath
  pMemoize.clear(readInstallPathPkgJsonsMemoized)

  return {
    npmOutput,
    packages: fromPairs(
      zip(
        packages,
        await Promise.all(
          packages.map(getPkgSpecInstalledLocation(installPath))
        )
      )
    )
  }
}

module.exports = npmInstallTo
