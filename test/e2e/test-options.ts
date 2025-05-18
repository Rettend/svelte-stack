import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { test as baseTest, expect } from '@playwright/test'
import v8ToIstanbul from 'v8-to-istanbul'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const projectRoot = path.resolve(__dirname, '..', '..')
const nycOutput = path.join(projectRoot, '.nyc_output')

if (!fs.existsSync(nycOutput))
  fs.mkdirSync(nycOutput, { recursive: true })

const test = baseTest.extend({
  page: async ({ page }, use) => {
    await page.coverage.startJSCoverage({ resetOnNavigation: false })
    await use(page)
    const jsCoverage = await page.coverage.stopJSCoverage()

    const coverageMap: Record<string, any> = {}
    for (const entry of jsCoverage) {
      if (!entry.source || !entry.url)
        continue

      let filePathInProject = ''
      try {
        const url = new URL(entry.url)
        if (url.protocol === 'file:') {
          filePathInProject = fileURLToPath(entry.url)
        }
        else if (url.protocol === 'http:' || url.protocol === 'https:') {
          if (url.pathname.startsWith('/@fs/')) {
            let absoluteFsPath = url.pathname.substring('/@fs'.length)
            if (process.platform === 'win32' && /^\/[A-Z]:\//i.test(absoluteFsPath))
              absoluteFsPath = absoluteFsPath.substring(1)

            filePathInProject = absoluteFsPath
          }
          else {
            filePathInProject = path.join(projectRoot, url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname)
          }
        }
        else {
          continue
        }
      }
      catch {
        continue
      }

      if (!filePathInProject)
        continue

      let relativePathForIstanbul = path.relative(projectRoot, filePathInProject)
      relativePathForIstanbul = relativePathForIstanbul.replace(/\\/g, '/')

      const isSvelteKitGenerated = relativePathForIstanbul.startsWith('.svelte-kit/generated/')
      const isSrc = relativePathForIstanbul.startsWith('src/')
      if (
        !(isSrc || isSvelteKitGenerated)
        || relativePathForIstanbul.includes('node_modules/.vite/deps')
        || relativePathForIstanbul.startsWith('node_modules/@')
        || relativePathForIstanbul.startsWith('@vite/')
        || relativePathForIstanbul.includes('?v=')
        || relativePathForIstanbul.startsWith('vite/')
      )
        // eslint-disable-next-line antfu/curly
        continue

      try {
        const converter = v8ToIstanbul(relativePathForIstanbul, 0, { source: entry.source })
        await converter.load()
        converter.applyCoverage(entry.functions)
        const istanbulCoverage = converter.toIstanbul()
        for (const [absFile, data] of Object.entries(istanbulCoverage)) {
          const relFile = path.relative(projectRoot, absFile).replace(/\\/g, '/')
          coverageMap[relFile] = data
        }
      }
      catch (e) {
        console.error(`[TEST_OPTIONS] Error converting coverage for ${relativePathForIstanbul} (from ${entry.url}):`, e)
      }
    }

    if (Object.keys(coverageMap).length > 0) {
      const coverageFilename = path.join(
        nycOutput,
        `coverage-pw-${process.pid}-${Date.now()}.json`,
      )
      await fs.promises.writeFile(
        coverageFilename,
        JSON.stringify(coverageMap, null, 2),
      )
    }
  },
})

export { expect, test }
