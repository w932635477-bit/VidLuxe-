import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  const testEmail = `test${Date.now()}@gmail.com`;
  const testPassword = 'test123456';

  console.log('=== 调试生产环境注册功能 ===\n');
  console.log(`测试邮箱: ${testEmail}`);
  console.log(`测试密码: ${testPassword}\n`);

  // 监听所有 Supabase 请求
  page.on('request', request => {
    const url = request.url();
    if (url.includes('supabase')) {
      console.log(`[请求] ${request.method()} ${url}`);
      const postData = request.postData();
      if (postData) {
        console.log(`[请求数据] ${postData}`);
      }
    }
  });

  // 监听所有 Supabase 响应
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('supabase')) {
      console.log(`[响应] ${response.status()} ${url}`);
      try {
        const body = await response.text();
        console.log(`[响应数据] ${body.substring(0, 300)}...`);
      } catch (e) {
        // ignore
      }
    }
  });

  // 监听所有控制台消息
  page.on('console', msg => {
    console.log(`[浏览器控制台 ${msg.type()}] ${msg.text()}`);
  });

  // 监听页面错误
  page.on('pageerror', error => {
    console.error(`[页面错误] ${error.message}`);
  });

  try {
    console.log('1. 访问认证页面...');
    await page.goto('https://vidluxe.com.cn/auth', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('\n2. 检查页面元素...');
    const registerButton = await page.locator('button:has-text("注册")').first();
    console.log(`   注册按钮存在: ${await registerButton.isVisible()}`);

    console.log('\n3. 切换到注册模式...');
    await registerButton.click();
    await page.waitForTimeout(1000);

    console.log('\n4. 检查表单元素...');
    const emailInput = await page.locator('input[type="email"]');
    const passwordInputs = await page.locator('input[type="password"]').all();
    console.log(`   邮箱输入框存在: ${await emailInput.isVisible()}`);
    console.log(`   密码输入框数量: ${passwordInputs.length}`);

    console.log('\n5. 填写表单...');
    await emailInput.fill(testEmail);
    await passwordInputs[0].fill(testPassword);
    if (passwordInputs.length > 1) {
      await passwordInputs[1].fill(testPassword);
    }
    await page.waitForTimeout(500);

    console.log('\n6. 检查提交按钮...');
    const submitButton = await page.locator('button').filter({ hasText: /^注册$/ }).last();
    console.log(`   提交按钮存在: ${await submitButton.isVisible()}`);
    console.log(`   提交按钮文本: ${await submitButton.textContent()}`);
    console.log(`   提交按钮是否禁用: ${await submitButton.isDisabled()}`);

    console.log('\n7. 点击提交按钮...');
    await submitButton.click();

    console.log('\n8. 等待 10 秒观察结果...');
    await page.waitForTimeout(10000);

    console.log('\n9. 检查页面状态...');
    const pageContent = await page.content();
    if (pageContent.includes('成功') || pageContent.includes('验证邮箱')) {
      console.log('   ✅ 页面包含成功提示');
    } else if (pageContent.includes('错误') || pageContent.includes('失败')) {
      console.log('   ❌ 页面包含错误提示');
    } else {
      console.log('   ⚠️  页面状态未知');
    }

    // 截图
    await page.screenshot({ path: 'test-register-result.png', fullPage: true });
    console.log('\n   截图已保存: test-register-result.png');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    await page.screenshot({ path: 'test-register-error.png', fullPage: true });
  }

  console.log('\n浏览器将保持打开 30 秒供检查...');
  await page.waitForTimeout(30000);
  await browser.close();
})();
