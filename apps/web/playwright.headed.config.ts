import { defineConfig, devices } from '@playwright/test';

/**
 * VidLuxe 有头测试配置
 * 用于可视化测试，显示浏览器操作
 */
export default defineConfig({
  // 测试目录
  testDir: './e2e',

  // 只运行有头测试文件
  testMatch: '**/headed-test.spec.ts',

  // 全局超时时间
  timeout: 300000,

  // 每个测试的超时时间
  expect: {
    timeout: 15000,
  },

  // 不重试，方便观察
  retries: 0,

  // 单线程运行，方便观察
  workers: 1,

  // 报告器配置
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report-headed' }],
  ],

  // 全局设置
  use: {
    // 基础 URL
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // 显示浏览器
    headless: false,

    // 慢速操作，方便观察
    launchOptions: {
      slowMo: 100,
    },

    // 收集所有测试的 trace
    trace: 'on',

    // 所有测试都截图
    screenshot: 'only-on-failure',

    // 视频录制
    video: 'on',

    // 浏览器上下文配置
    contextOptions: {
      // 忽略 HTTPS 错误
      ignoreHTTPSErrors: true,
      // 设置视口大小
      viewport: { width: 1280, height: 720 },
    },
  },

  // 只使用 Chromium 进行有头测试
  projects: [
    {
      name: 'chromium-headed',
      use: {
        ...devices['Desktop Chrome'],
        headless: false,
      },
    },
  ],

  // 使用已运行的开发服务器
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
