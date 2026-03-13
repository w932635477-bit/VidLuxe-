import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const testEmail = `test${Date.now()}@gmail.com`;
  const testPassword = 'test123456';

  console.log('=== 最终测试：生产环境注册功能 ===\n');
  console.log(`测试邮箱: ${testEmail}\n`);

  // 监听 Supabase 请求
  page.on('request', request => {
    const url = request.url();
    if (url.includes('supabase.co/auth')) {
      console.log(`[请求] ${request.method()} ${url}`);
    }
  });

  // 监听 Supabase 响应
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('supabase.co/auth')) {
      console.log(`[响应] ${response.status()} ${url}`);
      if (response.status() >= 400) {
        try {
          const body = await response.json();
          console.log(`[错误] ${JSON.stringify(body, null, 2)}`);
        } catch (e) {
          // ignore
        }
      }
    }
  });

  try {
    console.log('1. 访问认证页面...');
    await page.goto('https://vidluxe.com.cn/auth', { waitUntil: 'networkidle' });
    console.log('   ✅ 页面加载成功\n');

    console.log('2. 切换到注册模式...');
    await page.click('button:has-text("注册")');
    await page.waitForTimeout(500);

    console.log('3. 填写表单...');
    await page.fill('input[type="email"]', testEmail);
    const passwordInputs = await page.locator('input[type="password"]').all();
    await passwordInputs[0].fill(testPassword);
    if (passwordInputs.length > 1) {
      await passwordInputs[1].fill(testPassword);
    }

    console.log('4. 提交注册...\n');
    await page.click('button').filter({ hasText: /^注册$/ }).last().click();

    // 等待响应
    await page.waitForTimeout(5000);

    console.log('\n5. 检查结果...');
    const pageText = await page.textContent('body');

    if (pageText.includes('成功') || pageText.includes('验证邮箱')) {
      console.log('   ✅ 注册成功！');
    } else if (pageText.includes('速率限制') || pageText.includes('rate limit')) {
      console.log('   ⚠️  Supabase 邮件速率限制');
    } else if (pageText.includes('错误') || pageText.includes('失败')) {
      console.log('   ❌ 注册失败');
    } else {
      console.log('   ⚠️  状态未知');
    }

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
  } finally {
    await browser.close();
  }

  console.log('\n=== 测试完成 ===');
})();
