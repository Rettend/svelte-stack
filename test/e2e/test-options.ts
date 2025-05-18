import type { Page, TestInfo } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { test as baseTest, expect } from '@playwright/test'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const nycOutput = path.join(__dirname, '..', '..', '.nyc_output')

// Clean .nyc_output at the start of the test run via package.json script ideally.
// For now, ensuring it exists, but concurrent top-level rmSync can be problematic.
if (!fs.existsSync(nycOutput)) {
  fs.mkdirSync(nycOutput, { recursive: true })
}
else {
  // If playwright runs tests sequentially or this setup is per-worker, this might be okay.
  // Otherwise, a global setup script or package.json pre-test script should handle cleanup.
}

interface CoverageTestFixtures {
  saveCoverage: (page: Page, testInfo: TestInfo) => Promise<void>
}

const test = baseTest.extend<CoverageTestFixtures>({
  // eslint-disable-next-line no-empty-pattern
  saveCoverage: async ({}, use) => {
    await use(async (page: Page, testInfo: TestInfo) => {
      const coverage = await page.evaluate(() => (window as any).__coverage__)

      if (coverage && Object.keys(coverage).length > 0) {
        if (!fs.existsSync(nycOutput))
          fs.mkdirSync(nycOutput, { recursive: true })

        const coverageFilename = path.join(
          nycOutput,
          `coverage-${process.pid}-${testInfo.workerIndex}-${Date.now()}.json`,
        )
        await fs.promises.writeFile(
          coverageFilename,
          JSON.stringify(coverage),
        )
      }
      else {
        // Optional: log if no coverage data found for a test.
        // console.log(`No window.__coverage__ data found for test: ${testInfo.title} in worker ${testInfo.workerIndex}`);
      }
    })
  },

  page: async ({ page, saveCoverage }, use, testInfo) => {
    // REMOVED: await page.coverage.startJSCoverage(...)
    await use(page)
    // Save coverage after the test has interacted with the page.
    await saveCoverage(page, testInfo)
  },
})

export { expect, test }
