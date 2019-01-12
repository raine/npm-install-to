# npm-install-to [![Build Status](https://travis-ci.com/raine/npm-install-to.svg?branch=master)](https://travis-ci.com/raine/npm-install-to)

Provides an API for `npm install` through globally installed npm.

See also: [`runtime-npm-install`](https://github.com/raine/runtime-npm-install)

## introduction

### key features

- does not introduce npm as dependency, by using globally installed npm
- allows installing modules to a specific directory
- optimized for performance: calling with already installed packages should be
  as quick as possible

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

## API

The module exports following functions:

#### `npmInstallTo(installPath: string, packages: string[], options: Object): Promise<Object>`

##### `installPath: string`

A path in the local filesystem where modules should be installed to. It does not
have to exist.

##### `packages: string[]`

A list of packages as strings, corresponding to how `npm install` command is
given packages to be installed. More information on that available with `npm
help install`.

##### `options: Object`

```js
{
  // Exclude packages from being installed, but return them if already installed
  skipInstall: string[],
  // Force specific packages to be installed regardless of if they exist already
  forceInstall: string[],
}
```

Use `skipInstall` option to exclude specific packages from being installed. They
will still be in the return value, but the function won't check if they have to
be installed.

The option `forceInstall` can be used to schedule some packages to be installed
regardless of if they are already installed with the same version.

Returned promise resolves to an object containing output from npm install, and
locations of installed modules.

For example, given the input:

```js
const { npmInstallTo } = require('npm-install-to')
npmInstallTo('/path/to/dir', [
  'treis@2.6.0',
  'ramda@latest',
  'lodash'
])
```

The resolved object might look as follows:

```js
{ npmOutput:
   '+ ramda@0.26.1\n+ treis@2.6.0\n+ lodash@4.17.11\nadded 1 package from 2 contributors, updated 2 packages and audited 713 packages in 1.854s\nfound 0 vulnerabilities',
  packages:
  { 'treis@2.6.0': '/path/to/dir/node_modules/treis',
    'ramda@latest': '/path/to/dir/node_modules/ramda',
    lodash: '/path/to/dir/node_modules/lodash' } }
```

#### `getPkgsToBeInstalled(installPath: string, packages: string[]): Promise<string[]>`

Use to check which given packages would be installed, if `npmInstallTo` were to
be run with them.

## example

```js
const { npmInstallTo } = require('npm-install-to')

npmInstallTo(`${process.env.HOME}/test-dir`, [
  'treis@2.6.0',
  'ramda@latest',
  'lodash'
])
  .then(console.log)
  .catch(console.log)
```

## debugging

Uses [`debug`](https://github.com/visionmedia/debug/) for debugging messages.

Enabling them with `export DEBUG=npm-install-to` might provide helpful
information.

## related projects

- [npmi](https://github.com/maxleiko/npmi)
