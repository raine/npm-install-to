const { npmInstallTo } = require('../')
const util = require('util')
const tempy = require('tempy')
const fs = require('fs')
const readFile = util.promisify(fs.readFile)
const readJsonFile = (p) => readFile(p, 'utf8').then(JSON.parse)

test('installs a module', async () => {
  const tempDir = tempy.directory()
  const result = await npmInstallTo(tempDir, ['treis@2.6.0'])

  expect(result).toEqual(
    expect.objectContaining({
      npmOutput: expect.any(String),
      packages: {
        'treis@2.6.0': `${tempDir}/node_modules/treis`
      }
    })
  )

  const pkg = await readJsonFile(`${tempDir}/node_modules/treis/package.json`)
  expect(pkg.name).toBe('treis')
}, 10000)
