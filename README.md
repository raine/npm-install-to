# npm-install-to

## introduction

`npm-install-to` is a library that provides an API for `npm install` through
globally installed npm.

### key features

- allows installing modules to a specific directory
- cache mechanism

### caching

Does not attempt to install modules that are found in
`<installPath>/node_modules` with satisfying install parameters in
`package.json`.

For example, if one of the packages to be installed is `ramda@0.26.0`. the
library will check if `package.json` at `<installPath>/node_modules/ramda`
contains `{ _requested: { type: "version", fetchSpec: "0.26.0" } }`. Failing
that, it will install `ramda` at the given version.

The same strategy is applied for tags as well.

### global npm

As mentioned, this module uses globally installed npm, through a module called
[`global-npm`](https://github.com/dracupid/global-npm), instead of introducing
npm as its own dependency. This may present a problem, in case the global npm is
incompatible with the way this library uses npm's programmatic API.

The library runs the actual `npm.commands.install()` in a child process. The
only reason for that is that programmatic npm install pollutes stdout of the
process. Spawning a child process seemed like a better idea than monkey patching
console.log for the duration of the npm install part.

## install

```sh
npm install npm-install-to
```

## usage

#### `npmInstallTo(installPath: string, packages: string[]): Promise`

The argument of `packages` is a list of packages as strings, corresponding to
how `npm install` command is given packages to be installed. More information on
that available with `npm help install`. However, git repo urls, tarballs and
directories are unlikely to work as arguments right now.

Returned promise resolves with output from npm running install with given
packages.

## example

```js
const npmInstallTo = require('npm-install-to')

npmInstallTo(`${process.env.HOME}/test-dir`, [
  'treis@2.6.0',
  'ramda@latest',
  'lodash'
])
  .then(console.log)
  .catch(console.log)
```
