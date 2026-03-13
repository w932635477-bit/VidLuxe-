import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext();
  const page = await context.newPage();

  const testEmail = `test${Date.now()}@gmail.com`;
  const testPassword = 'test123456';

  console.log('=== 最终验证：生产环境注册系统 ===\n');
  console.log(`测试邮箱: ${testEmail}\n`);

  let registrationRequestSent = false;
  let registrationResponse = null;

  // 监听注册请求
  page.on('request', request => {
    if (request.url().includes('supabase.co/auth/v1/signup')) {
      registrationRequestSent = true;
      const url = new URL(request.url());
      const redirectTo = url.searchParams.get('redirect_to');
      console.log('[请求] 注册请求已发送');
      console.log(`  重定向URL: ${redirectTo}`);
    }
  });

  // 监听注册响应
  page.on('response', async response => {
    if (response.url().includes('supabase.co/auth/v1/signup')) {
      registrationResponse = response.status();
      console.log(`[响应] HTTP ${response.status()}`);

      try {
        const body = await response.json();
        if (response.status() === 429) {
          console.log(`  错误: ${body.message}`);
          console.log(`  原因: Supabase 邮件速率限制`);
        } else if (response.status() === 200) {
          console.log(`  成功: 用户已创建`);
          console.log(`  用户ID: ${body.id}`);
        } else {
          console.log(`  消息: ${body.message || body.msg}`);
        }
      } catch (e) {}
    }
  });

  try {
    console.log('步骤 1: 访问认证页面');
    await page.goto('https://vidluxe.com.cn/auth', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    console.log('  ✅ 页面加载成功\n');

    console.log('步骤 2: 切换到注册模式');
    await page.click('button:has-text("注册")');
    await page.waitForTimeout(500);
    console.log('  ✅ 已切换到注册模式\n');

    console.log('步骤 3: 填写注册表单');
    await page.fill('input[type="email"]', testEmail);
    const passwordInputs = await page.locator('input[type="password"]').all();
    await passwordInputs[0].fill(testPassword);
    if (passwordInputs.length > 1) {
      await passwordInputs[1].fill(testPassword);
    }
    console.log('  ✅ 表单填写完成\n');

    console.log('步骤 4: 提交注册');
    await page.click('button:has-text("注册")');
    await page.waitForTimeout(5000);

    if (registrationRequestSent) {
      console.log('\n✅ 注册请求成功发送到 Supabase');
    } else {
      console.log('\n❌ 注册请求未发送');
    }

    if (registrationResponse === 429) {
      console.log('⚠️  当前状态: Supabase 邮件速率限制');
      console.log('\n📋 解决方案:');
      console.log('   1. 等待 1 小时后速率限制自动重置');
      console.log('   2. 或在 Supabase Dashboard 启用邮箱自动确认:');
      console.log('      https://supabase.com/dashboard/project/lklgluxnloqmyelxtpfi/auth/providers');
      console.log('      找到 "Email" → 关闭 "Confirm email"');
    } else if (registrationResponse === 200) {
      console.log('✅ 注册成功！系统完全正常');
    }

    console.log('\n步骤 5: 检查页面反馈');
    const pageText = await page.textContent('body');
    if (pageText.includes('成功')) {
      console.log('  ✅ 页面显示成功提示');
    } else if (pageText.includes('错误') || pageText.includes('失败')) {
      console.log('  ⚠️  页面显示错误提示');
    }

    await page.screenshot({ path: 'final-test.png', fullPage: true });
    console.log('\n  截图已保存: final-test.png');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
  }

  console.log('\n浏览器将保持打开 10 秒供检查...');
  await page.waitForTimeout(10000);
  await browser.close();

  console.log('\n=== 测试完成 ===');
})();
