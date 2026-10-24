import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;

// End-to-end tests run against a production build (`next build` + `next start`), not the dev server:
// no dev overlay in screenshots, and what is tested is what ships. The build includes the preview
// routes (design system, stub login) through NEXT_PUBLIC_PREVIEW_ROUTES=1.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${String(PORT)}`,
    trace: 'retain-on-failure',
    reducedMotion: 'reduce',
  },
  // Baselines are per project, not per OS: they are generated on Linux in CI (fonts differ on Windows),
  // and visual tests only run when VISUAL=1.
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}-{projectName}{ext}',
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: 'disabled' } },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'pnpm build:e2e && pnpm start:e2e',
    url: `http://localhost:${String(PORT)}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
