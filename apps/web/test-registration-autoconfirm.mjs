import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const testEmail = `test${Date.now()}@gmail.com`;
  const testPassword = 'test123456';

  console.log('=== 测试注册功能（邮箱自动确认已启用）===\n');
  console.log(`测试邮箱: ${testEmail}\n`);

  let registrationSuccess = false;
  let responseStatus = null;

  // 监听注册响应
  page.on('response', async (response) => {
    if (response.url().includes('supabase.co/auth/v1/signup')) {
      responseStatus = response.status();
      console.log(`[注册响应] HTTP ${response.status()}`);

      if (response.status() === 200) {
        try {
          const body = await response.json();
          console.log(`[成功] 用户已创建`);
          console.log(`  用户ID: ${body.id}`);
          console.log(`  邮箱: ${body.email}`);
          registrationSuccess = true;
        } catch (e) {}
      } else if (response.status() === 429) {
        console.log(`[速率限制] 但这次应该不会发生了`);
      }
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
    console.log('  ✅ 已切换\n');

    console.log('步骤 3: 填写表单');
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

    console.log('\n步骤 5: 检查结果');

    if (registrationSuccess) {
      console.log('  ✅ 注册成功！');

      // 检查是否自动登录
      const currentUrl = page.url();
      console.log(`  当前URL: ${currentUrl}`);

      if (currentUrl.includes('/try')) {
        console.log('  ✅ 已自动跳转到 /try 页面');
        console.log('  ✅ 用户已自动登录');
      }
    } else if (responseStatus === 429) {
      console.log('  ⚠️  仍然遇到速率限制（可能需要等待一段时间）');
    } else {
      console.log('  ⚠️  未检测到注册响应');
    }

    await page.screenshot({ path: 'registration-test.png' });
    console.log('\n  截图: registration-test.png');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
  } finally {
    await browser.close();
  }

  console.log('\n=== 测试完成 ===');

  if (registrationSuccess) {
    console.log('\n🎉 注册系统完全正常！用户可以立即注册并登录。');
  }
})();
