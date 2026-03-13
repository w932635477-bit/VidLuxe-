import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  const testEmail = `test${Date.now()}@gmail.com`;
  const testPassword = 'test123456';

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                                                              ║');
  console.log('║          生产环境注册流程调试                                ║');
  console.log('║                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log(`测试邮箱: ${testEmail}\n`);

  // 监听控制台日志
  page.on('console', msg => {
    console.log(`[浏览器控制台] ${msg.type()}: ${msg.text()}`);
  });

  // 监听网络请求
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/auth/') || url.includes('supabase')) {
      console.log(`[网络] ${response.status()} ${url}`);
      if (url.includes('signup')) {
        try {
          const body = await response.text();
          console.log(`[响应体] ${body.substring(0, 200)}`);
        } catch (e) {
          // ignore
        }
      }
    }
  });

  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('步骤 1: 访问注册页面');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await page.goto('https://vidluxe.com.cn/auth', { waitUntil: 'networkidle' });
    console.log('  ✅ 页面加载完成\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('步骤 2: 切换到注册模式');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await page.click('button:has-text("注册")');
    await page.waitForTimeout(500);
    console.log('  ✅ 已切换到注册模式\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('步骤 3: 填写注册信息');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await page.fill('input[type="email"]', testEmail);
    const passwordInputs = await page.locator('input[type="password"]').all();
    await passwordInputs[0].fill(testPassword);
    if (passwordInputs.length > 1) {
      await passwordInputs[1].fill(testPassword);
    }
    console.log('  ✅ 已填写邮箱和密码\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('步骤 4: 提交注册');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await page.click('button:has-text("注册")');
    console.log('  ⏳ 等待注册响应...\n');

    // 等待 10 秒观察
    await page.waitForTimeout(10000);

    const currentUrl = page.url();
    console.log(`  当前 URL: ${currentUrl}\n`);

    if (currentUrl.includes('/try')) {
      console.log('  ✅ 注册成功，已跳转到 /try 页面\n');
    } else {
      console.log('  ⚠️  注册后未跳转\n');

      // 检查页面内容
      const pageText = await page.textContent('body');
      if (pageText.includes('注册成功')) {
        console.log('  页面显示: 注册成功\n');
      }
      if (pageText.includes('验证邮箱')) {
        console.log('  页面显示: 需要验证邮箱\n');
      }
      if (pageText.includes('错误') || pageText.includes('失败')) {
        console.log('  ⚠️  页面显示错误信息\n');
      }
    }

    await page.screenshot({ path: 'prod-register-debug.png', fullPage: true });
    console.log('  截图: prod-register-debug.png\n');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error.stack);
  }

  console.log('浏览器将保持打开 30 秒供检查...');
  await page.waitForTimeout(30000);
  await browser.close();

  console.log('\n测试完成\n');
})();
