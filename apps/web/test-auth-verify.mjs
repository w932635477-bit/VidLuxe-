import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.setDefaultTimeout(60000); // 60 秒超时

  const testEmail = `test${Date.now()}@gmail.com`;
  const testPassword = 'test123456';

  console.log('=== 生产环境注册功能验证 ===\n');
  console.log(`测试邮箱: ${testEmail}\n`);

  // 监听请求
  page.on('request', request => {
    const url = request.url();
    if (url.includes('supabase.co/auth/v1/signup')) {
      console.log(`\n[注册请求] ${url}`);
      const postData = request.postData();
      if (postData) {
        try {
          const data = JSON.parse(postData);
          console.log(`  邮箱: ${data.email}`);
          console.log(`  重定向URL: ${request.url().match(/redirect_to=([^&]+)/)?.[1] || '未设置'}`);
        } catch (e) {}
      }
    }
  });

  // 监听响应
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('supabase.co/auth/v1/signup')) {
      console.log(`\n[注册响应] ${response.status()} ${response.statusText()}`);
      try {
        const body = await response.json();
        if (response.status() >= 400) {
          console.log(`  错误: ${body.message || body.msg}`);
          console.log(`  错误代码: ${body.code || body.error_code}`);
        } else {
          console.log(`  ✅ 注册请求成功`);
        }
      } catch (e) {}
    }
  });

  try {
    console.log('1. 访问认证页面...');
    await page.goto('https://vidluxe.com.cn/auth', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    console.log('   ✅ 页面加载完成\n');

    console.log('2. 等待页面渲染...');
    await page.waitForSelector('button', { timeout: 10000 });

    // 截图调试
    await page.screenshot({ path: 'auth-page.png' });
    console.log('   截图已保存: auth-page.png\n');

    console.log('3. 查找注册按钮...');
    const buttons = await page.locator('button').all();
    console.log(`   找到 ${buttons.length} 个按钮`);

    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      console.log(`   按钮 ${i + 1}: "${text}"`);
    }

    console.log('\n4. 切换到注册模式...');
    const registerTab = await page.locator('button').filter({ hasText: '注册' }).first();
    await registerTab.click();
    await page.waitForTimeout(1000);
    console.log('   ✅ 已切换到注册模式\n');

    console.log('5. 填写表单...');
    await page.fill('input[type="email"]', testEmail);
    const passwordInputs = await page.locator('input[type="password"]').all();
    await passwordInputs[0].fill(testPassword);
    if (passwordInputs.length > 1) {
      await passwordInputs[1].fill(testPassword);
    }
    console.log('   ✅ 表单填写完成\n');

    console.log('6. 提交注册...');
    const submitButton = await page.locator('button').filter({ hasText: /^注册$/ }).last();
    await submitButton.click();

    // 等待响应
    await page.waitForTimeout(8000);

    console.log('\n7. 检查页面反馈...');
    const pageText = await page.textContent('body');

    if (pageText.includes('成功') && pageText.includes('验证邮箱')) {
      console.log('   ✅ 注册成功！用户需要验证邮箱');
    } else if (pageText.includes('速率限制') || pageText.includes('rate limit') || pageText.includes('exceeded')) {
      console.log('   ⚠️  Supabase 邮件速率限制 - 这是预期的');
    } else if (pageText.includes('错误')) {
      console.log('   ❌ 出现错误提示');
    } else {
      console.log('   ⚠️  未检测到明确的反馈');
    }

    await page.screenshot({ path: 'auth-result.png' });
    console.log('   结果截图: auth-result.png');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    await page.screenshot({ path: 'auth-error.png' });
  } finally {
    await browser.close();
  }

  console.log('\n=== 测试完成 ===');
})();
