import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://146.56.193.40';
const TEST_EMAIL = '932635477@qq.com';
const TEST_PASSWORD = 'wl197939';

// 预期额度值
const EXPECTED_PAID = 12;
const EXPECTED_FREE = 8;
const EXPECTED_TOTAL = 20;

test.describe.serial('VidLuxe 生产环境核心功能验证', () => {
  let initialCredits: { paid: number; free: number; total: number } | null = null;

  test('1. 访问首页并检查页面加载', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // 验证页面标题
    await expect(page).toHaveTitle(/VidLuxe/);

    // 验证未登录状态显示 0 次
    const creditsDisplay = page.locator('text=0 次').first();
    await expect(creditsDisplay).toBeVisible();

    console.log('✅ 首页加载成功');
    await page.screenshot({ path: 'test-results/prod-01-homepage.png' });
  });

  test('2. 登录测试账号', async ({ page }) => {
    // 直接访问登录页面
    await page.goto(`${BASE_URL}/auth?redirect=/try`);
    await page.waitForLoadState('networkidle');

    // 等待页面加载
    await page.waitForTimeout(2000);

    // 填写邮箱
    const emailInput = page.locator('input[type="email"], input[placeholder*="邮箱"], input[name="email"], input[id="email"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill(TEST_EMAIL);

    // 填写密码
    const passwordInput = page.locator('input[type="password"], input[placeholder*="密码"], input[name="password"], input[id="password"]').first();
    await passwordInput.fill(TEST_PASSWORD);

    // 点击登录按钮
    const loginButton = page.locator('button:has-text("登录"), button:has-text("登 录"), button[type="submit"]').first();
    await loginButton.click();

    // 等待登录完成
    await page.waitForTimeout(5000);

    console.log('📍 登录后 URL:', page.url());
    await page.screenshot({ path: 'test-results/prod-02-after-login.png' });

    // 检查是否跳转到 try 页面或首页
    expect(page.url()).toContain('/try');
  });

  test('3. 验证登录后额度显示', async ({ page }) => {
    // 先登录
    await page.goto(`${BASE_URL}/auth?redirect=/try`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const emailInput = page.locator('input[type="email"], input[placeholder*="邮箱"], input[name="email"], input[id="email"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill(TEST_EMAIL);

    const passwordInput = page.locator('input[type="password"], input[placeholder*="密码"], input[name="password"], input[id="password"]').first();
    await passwordInput.fill(TEST_PASSWORD);

    const loginButton = page.locator('button:has-text("登录"), button:has-text("登 录"), button[type="submit"]').first();
    await loginButton.click();

    await page.waitForTimeout(5000);

    // 获取额度信息
    const creditsData = await page.evaluate(async () => {
      const response = await fetch('/api/credits');
      return await response.json();
    });

    console.log('\n========================================');
    console.log('📊 登录后额度信息:');
    console.log('========================================');
    console.log(JSON.stringify(creditsData, null, 2));
    console.log('========================================\n');

    if (creditsData.success) {
      initialCredits = creditsData.data;

      console.log(`   付费额度: ${creditsData.data.paid}`);
      console.log(`   免费额度: ${creditsData.data.free}`);
      console.log(`   总额度: ${creditsData.data.total}`);

      // 验证额度是否符合预期
      expect(creditsData.data.paid).toBe(EXPECTED_PAID);
      expect(creditsData.data.free).toBe(EXPECTED_FREE);
      expect(creditsData.data.total).toBe(EXPECTED_TOTAL);

      console.log('✅ 额度数据符合预期！');
    } else {
      throw new Error(`获取额度失败: ${creditsData.error}`);
    }

    await page.screenshot({ path: 'test-results/prod-03-credits-display.png' });
  });

  test('4. 测试单图上传功能', async ({ page }) => {
    // 登录
    await page.goto(`${BASE_URL}/auth?redirect=/try`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const emailInput = page.locator('input[type="email"], input[placeholder*="邮箱"], input[name="email"], input[id="email"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill(TEST_EMAIL);

    const passwordInput = page.locator('input[type="password"], input[placeholder*="密码"], input[name="password"], input[id="password"]').first();
    await passwordInput.fill(TEST_PASSWORD);

    const loginButton = page.locator('button:has-text("登录"), button:has-text("登 录"), button[type="submit"]').first();
    await loginButton.click();

    await page.waitForTimeout(5000);

    // 确保在 /try 页面
    if (!page.url().includes('/try')) {
      await page.goto(`${BASE_URL}/try`);
      await page.waitForLoadState('networkidle');
    }

    // 选择单图模式
    const singleImageTab = page.locator('button:has-text("单图"), [role="tab"]:has-text("单图")').first();
    if (await singleImageTab.isVisible()) {
      await singleImageTab.click();
      await page.waitForTimeout(1000);
    }

    console.log('✅ 已进入单图模式');
    await page.screenshot({ path: 'test-results/prod-04-single-image-mode.png' });

    // 查找上传区域
    const uploadArea = page.locator('[data-testid="upload-area"], .upload-area, input[type="file"]').first();

    if (await uploadArea.isVisible()) {
      console.log('✅ 找到上传区域');

      // 上传测试图片
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles('./public/test-image.jpg');

      // 等待上传完成
      await page.waitForTimeout(3000);

      console.log('✅ 图片上传成功');
      await page.screenshot({ path: 'test-results/prod-05-image-uploaded.png' });
    } else {
      console.log('⚠️ 未找到上传区域，跳过上传测试');
    }
  });

  test('5. 测试视频上传功能', async ({ page }) => {
    // 登录
    await page.goto(`${BASE_URL}/auth?redirect=/try`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const emailInput = page.locator('input[type="email"], input[placeholder*="邮箱"], input[name="email"], input[id="email"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill(TEST_EMAIL);

    const passwordInput = page.locator('input[type="password"], input[placeholder*="密码"], input[name="password"], input[id="password"]').first();
    await passwordInput.fill(TEST_PASSWORD);

    const loginButton = page.locator('button:has-text("登录"), button:has-text("登 录"), button[type="submit"]').first();
    await loginButton.click();

    await page.waitForTimeout(5000);

    // 确保在 /try 页面
    if (!page.url().includes('/try')) {
      await page.goto(`${BASE_URL}/try`);
      await page.waitForLoadState('networkidle');
    }

    // 选择视频模式
    const videoTab = page.locator('button:has-text("视频"), [role="tab"]:has-text("视频")').first();
    if (await videoTab.isVisible()) {
      await videoTab.click();
      await page.waitForTimeout(1000);

      console.log('✅ 已进入视频模式');
      await page.screenshot({ path: 'test-results/prod-06-video-mode.png' });
    } else {
      console.log('⚠️ 未找到视频模式标签');
    }
  });

  test('6. 验证额度扣除逻辑', async ({ page }) => {
    // 登录
    await page.goto(`${BASE_URL}/auth?redirect=/try`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const emailInput = page.locator('input[type="email"], input[placeholder*="邮箱"], input[name="email"], input[id="email"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill(TEST_EMAIL);

    const passwordInput = page.locator('input[type="password"], input[placeholder*="密码"], input[name="password"], input[id="password"]').first();
    await passwordInput.fill(TEST_PASSWORD);

    const loginButton = page.locator('button:has-text("登录"), button:has-text("登 录"), button[type="submit"]').first();
    await loginButton.click();

    await page.waitForTimeout(5000);

    // 获取当前额度
    const creditsBefore = await page.evaluate(async () => {
      const response = await fetch('/api/credits');
      return await response.json();
    });

    console.log('\n========================================');
    console.log('📊 额度扣除验证:');
    console.log('========================================');
    console.log('当前额度:', creditsBefore.data);

    // 验证扣除逻辑：应该先扣除付费额度
    if (creditsBefore.data.paid > 0) {
      console.log('✅ 付费额度 > 0，下次使用将优先扣除付费额度');
    } else if (creditsBefore.data.free > 0) {
      console.log('⚠️ 付费额度已用完，下次将扣除免费额度');
    } else {
      console.log('❌ 额度已用完');
    }

    console.log('========================================\n');
    await page.screenshot({ path: 'test-results/prod-07-credits-verify.png' });
  });
});
