jest.mock('../lib/npm-install');
const npmInstall = require('../lib/npm-install')
const { npmInstallTo } = require('../')
const util = require('util')
const tempy = require('tempy')
const fs = require('fs')
const readFile = util.promisify(fs.readFile)
const readJsonFile = (p) => readFile(p, 'utf8').then(JSON.parse)

test('really installs a module', async () => {
  npmInstall.mockImplementationOnce(jest.requireActual('../lib/npm-install'));

  const tempDir = tempy.directory()
  const result = await npmInstallTo(tempDir, ['identity-function'])

  expect(result).toEqual(
    expect.objectContaining({
      npmOutput: expect.any(String),
      packages: {
        'identity-function': `${tempDir}/node_modules/identity-function`
      }
    })
  )

  const pkg = await readJsonFile(
    `${tempDir}/node_modules/identity-function/package.json`
  )
  expect(pkg.name).toBe('identity-function')
}, 10000)
