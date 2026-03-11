import { defineConfig, devices } from '@playwright/test';

/**
 * VidLuxe E2E 测试配置
 */
export default defineConfig({
  // 测试目录
  testDir: './e2e',

  // 测试文件匹配模式
  testMatch: '**/*.spec.ts',

  // 全局超时时间
  timeout: 120000,

  // 每个测试的超时时间
  expect: {
    timeout: 10000,
  },

  // 失败重试次数
  retries: process.env.CI ? 2 : 0,

  // 并行工作进程数
  workers: process.env.CI ? 1 : undefined,

  // 报告器配置
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report' }],
  ],

  // 全局设置
  use: {
    // 基础 URL
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // 收集失败测试的 trace
    trace: 'on-first-retry',

    // 截图配置
    screenshot: 'only-on-failure',

    // 视频录制
    video: 'on-first-retry',

    // 浏览器上下文配置
    contextOptions: {
      // 忽略 HTTPS 错误
      ignoreHTTPSErrors: true,
    },

    // 代理配置 - 使用系统代理
    proxy: process.env.HTTPS_PROXY ? {
      server: process.env.HTTPS_PROXY,
    } : undefined,
  },

  // 项目配置
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // 移动端测试
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // 本地开发服务器
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
