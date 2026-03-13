import { test, expect } from '@playwright/test';

const BASE_URL = 'http://146.56.193.40';

test('验证测试账号额度 API 响应', async ({ page, context }) => {
  // 访问登录页面
  await page.goto(`${BASE_URL}/auth`);
  await page.waitForLoadState('networkidle');

  // 填写邮箱和密码
  const emailInput = page.locator('input[type="email"], input[placeholder*="邮箱"], input[name="email"]').first();
  const passwordInput = page.locator('input[type="password"], input[placeholder*="密码"], input[name="password"]').first();

  console.log('Email input visible:', await emailInput.isVisible());

  if (await emailInput.isVisible()) {
    await emailInput.fill('932635477@qq.com');
    await passwordInput.fill('test123456');

    // 点击登录按钮
    const loginButton = page.locator('button:has-text("登录"), button:has-text("登 录"), button[type="submit"]').first();
    await loginButton.click();

    // 等待跳转或错误提示
    await page.waitForTimeout(5000);

    // 截图
    await page.screenshot({ path: 'test-results/credits-after-login.png', fullPage: true });

    // 检查当前 URL
    console.log('Current URL after login:', page.url());
  }

  // 使用 page 的 fetch 来调用 API（携带 cookies）
  const creditsData = await page.evaluate(async () => {
    const response = await fetch('/api/credits');
    return await response.json();
  });

  console.log('\n========================================');
  console.log('📊 Credits API Response:');
  console.log('========================================');
  console.log(JSON.stringify(creditsData, null, 2));
  console.log('========================================\n');

  // 保存响应到文件
  const fs = require('fs');
  fs.writeFileSync('test-results/credits-api-response.json', JSON.stringify(creditsData, null, 2));

  // 预期值：
  // total: 20 (12 付费 + 8 免费)
  // paid: 12
  // free: 8

  if (creditsData.success) {
    console.log('✅ API 响应成功');
    console.log(`   付费额度: ${creditsData.data.paid}`);
    console.log(`   免费额度: ${creditsData.data.free}`);
    console.log(`   总额度: ${creditsData.data.total}`);

    // 检查是否符合预期
    if (creditsData.data.paid === 12 && creditsData.data.free === 8 && creditsData.data.total === 20) {
      console.log('✅ 额度数据符合预期！');
    } else {
      console.log('⚠️ 额度数据与预期不符！');
      console.log(`   预期: paid=12, free=8, total=20`);
    }
  } else {
    console.log('❌ API 响应失败:', creditsData.error);
  }
});
