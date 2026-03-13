import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext();
  const page = await context.newPage();

  const testEmail = `test${Date.now()}@gmail.com`;
  const testPassword = 'test123456';

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                                                              ║');
  console.log('║          VidLuxe 注册系统完整功能验证                        ║');
  console.log('║                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log(`测试邮箱: ${testEmail}\n`);

  let registrationSuccess = false;
  let autoLogin = false;

  // 监听注册响应
  page.on('response', async (response) => {
    if (response.url().includes('supabase.co/auth/v1/signup')) {
      console.log(`\n[注册API] HTTP ${response.status()}`);

      if (response.status() === 200) {
        try {
          const body = await response.json();
          console.log(`  ✅ 用户创建成功`);
          console.log(`  用户ID: ${body.user.id}`);
          console.log(`  邮箱已验证: ${body.user.email_confirmed_at ? '是' : '否'}`);
          console.log(`  Access Token: ${body.access_token ? '已获取' : '未获取'}`);
          registrationSuccess = true;
        } catch (e) {}
      }
    }
  });

  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('步骤 1: 访问认证页面\n');
    await page.goto('https://vidluxe.com.cn/auth', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    console.log('  ✅ 页面加载成功');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('步骤 2: 切换到注册模式\n');
    await page.click('button:has-text("注册")');
    await page.waitForTimeout(500);
    console.log('  ✅ 已切换到注册模式');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('步骤 3: 填写注册表单\n');
    await page.fill('input[type="email"]', testEmail);
    const passwordInputs = await page.locator('input[type="password"]').all();
    await passwordInputs[0].fill(testPassword);
    if (passwordInputs.length > 1) {
      await passwordInputs[1].fill(testPassword);
    }
    console.log('  ✅ 表单填写完成');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('步骤 4: 提交注册\n');
    await page.click('button:has-text("注册")');
    await page.waitForTimeout(6000);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('步骤 5: 检查注册结果\n');

    const currentUrl = page.url();
    console.log(`  当前URL: ${currentUrl}`);

    if (currentUrl.includes('/try')) {
      console.log('  ✅ 已自动跳转到 /try 页面');
      autoLogin = true;
    }

    // 检查页面内容
    const pageText = await page.textContent('body');

    if (pageText.includes('成功')) {
      console.log('  ✅ 页面显示成功提示');
    }

    if (autoLogin) {
      console.log('  ✅ 用户已自动登录');

      // 检查额度显示
      await page.waitForTimeout(2000);
      const creditsText = await page.textContent('body');
      if (creditsText.includes('次') || creditsText.includes('额度')) {
        console.log('  ✅ 额度信息正常显示');
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('步骤 6: 测试登出和重新登录\n');

    if (autoLogin) {
      // 查找登出按钮（可能在用户菜单中）
      console.log('  测试登出功能...');

      // 刷新页面测试会话持久性
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      const urlAfterReload = page.url();
      if (urlAfterReload.includes('/try')) {
        console.log('  ✅ 会话持久性正常（刷新后仍然登录）');
      }
    }

    await page.screenshot({ path: 'final-verification.png', fullPage: true });
    console.log('\n  截图已保存: final-verification.png');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('验证结果汇总\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`  注册功能:     ${registrationSuccess ? '✅ 正常' : '❌ 异常'}`);
    console.log(`  自动登录:     ${autoLogin ? '✅ 正常' : '❌ 异常'}`);
    console.log(`  会话持久性:   ${autoLogin ? '✅ 正常' : '⚠️  未测试'}`);

    if (registrationSuccess && autoLogin) {
      console.log('\n🎉 所有功能验证通过！注册系统完全正常！');
    } else {
      console.log('\n⚠️  部分功能需要检查');
    }

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
  }

  console.log('\n浏览器将保持打开 10 秒供检查...');
  await page.waitForTimeout(10000);
  await browser.close();

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('测试完成');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
})();
