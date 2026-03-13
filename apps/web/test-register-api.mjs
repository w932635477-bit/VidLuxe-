import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const testEmail = `test${Date.now()}@gmail.com`;
  const testPassword = 'test123456';

  console.log('=== 测试生产环境注册功能 ===\n');
  console.log(`测试邮箱: ${testEmail}`);
  console.log(`测试密码: ${testPassword}\n`);

  // 监听所有网络请求
  const requests = [];
  page.on('request', request => {
    if (request.url().includes('supabase') || request.url().includes('auth')) {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData()
      });
    }
  });

  // 监听所有网络响应
  const responses = [];
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('supabase') || url.includes('auth')) {
      let body = null;
      try {
        body = await response.text();
      } catch (e) {
        body = '[无法读取响应体]';
      }
      responses.push({
        url: url,
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers(),
        body: body
      });
    }
  });

  // 监听控制台错误
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleErrors.push(`[${msg.type()}] ${msg.text()}`);
    }
  });

  // 监听页面错误
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  try {
    console.log('1. 访问认证页面...');
    await page.goto('https://vidluxe.com.cn/auth', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('   ✅ 页面加载成功\n');

    console.log('2. 切换到注册模式...');
    await page.click('button:has-text("注册")');
    await page.waitForTimeout(500);
    console.log('   ✅ 已切换到注册模式\n');

    console.log('3. 填写注册表单...');
    await page.fill('input[type="email"]', testEmail);
    const passwordInputs = await page.locator('input[type="password"]').all();
    await passwordInputs[0].fill(testPassword);
    if (passwordInputs.length > 1) {
      await passwordInputs[1].fill(testPassword);
    }
    console.log('   ✅ 表单填写完成\n');

    console.log('4. 提交注册请求...');
    await page.click('button:has-text("注册")');

    // 等待响应
    await page.waitForTimeout(5000);

    // 检查页面状态
    console.log('\n5. 检查注册结果...');

    // 检查错误提示
    const errorElements = await page.locator('div').filter({ hasText: /错误|失败|invalid|error/i }).all();
    if (errorElements.length > 0) {
      console.log('   ❌ 发现错误提示:');
      for (const el of errorElements) {
        const text = await el.textContent();
        if (text && text.trim()) {
          console.log(`      - ${text.trim()}`);
        }
      }
    }

    // 检查成功提示
    const successElements = await page.locator('div').filter({ hasText: /成功|验证邮箱|success/i }).all();
    if (successElements.length > 0) {
      console.log('   ✅ 发现成功提示:');
      for (const el of successElements) {
        const text = await el.textContent();
        if (text && text.trim()) {
          console.log(`      - ${text.trim()}`);
        }
      }
    }

    // 输出网络请求详情
    console.log('\n=== 网络请求详情 ===\n');
    if (requests.length === 0) {
      console.log('⚠️  没有捕获到任何 Supabase/Auth 请求');
    } else {
      requests.forEach((req, i) => {
        console.log(`请求 ${i + 1}:`);
        console.log(`  URL: ${req.url}`);
        console.log(`  方法: ${req.method}`);
        if (req.postData) {
          console.log(`  数据: ${req.postData.substring(0, 200)}...`);
        }
        console.log('');
      });
    }

    // 输出网络响应详情
    console.log('=== 网络响应详情 ===\n');
    if (responses.length === 0) {
      console.log('⚠️  没有捕获到任何 Supabase/Auth 响应');
    } else {
      responses.forEach((res, i) => {
        console.log(`响应 ${i + 1}:`);
        console.log(`  URL: ${res.url}`);
        console.log(`  状态: ${res.status} ${res.statusText}`);
        console.log(`  响应体: ${res.body.substring(0, 500)}...`);
        console.log('');
      });
    }

    // 输出控制台错误
    if (consoleErrors.length > 0) {
      console.log('=== 控制台错误 ===\n');
      consoleErrors.forEach(err => console.log(err));
      console.log('');
    }

    // 输出页面错误
    if (pageErrors.length > 0) {
      console.log('=== 页面错误 ===\n');
      pageErrors.forEach(err => console.log(err));
      console.log('');
    }

  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error.message);
  } finally {
    await browser.close();
  }

  console.log('\n=== 测试完成 ===');
})();
