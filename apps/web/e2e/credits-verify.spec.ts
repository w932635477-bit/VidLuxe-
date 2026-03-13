import { test, expect } from '@playwright/test';

const BASE_URL = 'http://146.56.193.40:3000';

test('验证测试账号额度 API 修复', async ({ page }) => {
  // 访问 try 页面
  await page.goto(`${BASE_URL}/try`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // 获取页面上的额度相关文本
  const pageText = await page.innerText('body');

  console.log('\n========================================');
  console.log('📊 未登录状态页面检查');
  console.log('========================================');

  // 使用 page.evaluate 来调用 API
  const creditsData = await page.evaluate(async () => {
    const response = await fetch('/api/credits');
    return await response.json();
  });

  console.log('API Response:', JSON.stringify(creditsData, null, 2));

  // 登录
  await page.goto(`${BASE_URL}/auth`);
  await page.waitForLoadState('networkidle');

  const emailInput = page.locator('input[type="email"], input[placeholder*="邮箱"], input[name="email"]').first();
  const passwordInput = page.locator('input[type="password"], input[placeholder*="密码"], input[name="password"]').first();

  if (await emailInput.isVisible()) {
    console.log('\n========================================');
    console.log('🔐 开始登录...');
    console.log('========================================');

    await emailInput.fill('932635477@qq.com');
    await passwordInput.fill('test123456');

    const loginButton = page.locator('button:has-text("登录"), button:has-text("登 录"), button[type="submit"]').first();
    await loginButton.click();

    // 等待登录完成
    await page.waitForTimeout(5000);

    // 截图
    await page.screenshot({ path: 'test-results/credits-after-login-fixed.png', fullPage: true });

    console.log('登录后 URL:', page.url());
  }

  // 再次检查额度
  const creditsAfterLogin = await page.evaluate(async () => {
    const response = await fetch('/api/credits');
    return await response.json();
  });

  console.log('\n========================================');
  console.log('📊 登录后 API Response:');
  console.log('========================================');
  console.log(JSON.stringify(creditsAfterLogin, null, 2));

  // 验证额度
  if (creditsAfterLogin.success) {
    const { paid, free, total } = creditsAfterLogin.data;

    console.log('\n========================================');
    console.log('✅ 额度验证结果:');
    console.log('========================================');
    console.log(`付费额度: ${paid} (预期: 12)`);
    console.log(`免费额度: ${free} (预期: 8)`);
    console.log(`总额度: ${total} (预期: 20)`);

    if (paid === 12 && free === 8 && total === 20) {
      console.log('\n✅ 额度修复成功！数据完全正确！');
    } else if (paid > 0) {
      console.log('\n⚠️ 额度部分修复，但数值与预期不完全一致');
    } else {
      console.log('\n❌ 额度仍然有问题');
    }
  } else {
    console.log('\n❌ API 响应失败:', creditsAfterLogin.error);
  }

  // 访问 try 页面检查 UI 显示
  await page.goto(`${BASE_URL}/try`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  await page.screenshot({ path: 'test-results/credits-try-page.png', fullPage: true });
});
