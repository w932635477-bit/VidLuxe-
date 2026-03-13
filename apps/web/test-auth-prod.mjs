import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 监听控制台消息
  page.on('console', msg => {
    console.log(`[Console ${msg.type()}]`, msg.text());
  });

  // 监听页面错误
  page.on('pageerror', error => {
    console.error('[Page Error]', error.message);
  });

  // 监听网络请求失败
  page.on('requestfailed', request => {
    console.error('[Request Failed]', request.url(), request.failure()?.errorText);
  });

  // 监听网络响应
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('supabase') || url.includes('auth')) {
      console.log(`[Network] ${response.status()} ${url}`);
      if (response.status() >= 400) {
        try {
          const body = await response.text();
          console.log('[Response Body]', body);
        } catch (e) {
          // ignore
        }
      }
    }
  });

  console.log('正在访问生产环境认证页面...');
  await page.goto('https://vidluxe.com.cn/auth', { waitUntil: 'networkidle' });

  console.log('\n等待 5 秒观察页面状态...');
  await page.waitForTimeout(5000);

  console.log('\n尝试注册新用户...');
  const testEmail = `test${Date.now()}@gmail.com`;
  const testPassword = 'test123456';

  // 切换到注册模式
  await page.click('text=注册');
  await page.waitForTimeout(1000);

  // 填写表单
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[type="password"]', testPassword);
  const passwordInputs = await page.locator('input[type="password"]').all();
  if (passwordInputs.length > 1) {
    await passwordInputs[1].fill(testPassword);
  }

  console.log(`\n测试邮箱: ${testEmail}`);
  console.log('点击注册按钮...');

  await page.click('button:has-text("注册")');

  console.log('\n等待 10 秒观察注册结果...');
  await page.waitForTimeout(10000);

  // 检查是否有错误提示
  const errorElement = await page.locator('div:has-text("错误")').first();
  if (await errorElement.isVisible()) {
    const errorText = await errorElement.textContent();
    console.log('\n❌ 发现错误提示:', errorText);
  }

  // 检查是否有成功提示
  const successElement = await page.locator('div:has-text("成功")').first();
  if (await successElement.isVisible()) {
    const successText = await successElement.textContent();
    console.log('\n✅ 发现成功提示:', successText);
  }

  console.log('\n测试完成，浏览器将保持打开状态供检查...');
  console.log('按 Ctrl+C 退出');
})();
