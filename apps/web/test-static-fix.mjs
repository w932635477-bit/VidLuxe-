import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const testEmail = `test${Date.now()}@gmail.com`;
  const testPassword = 'test123456';

  console.log('=== 验证静态资源修复 ===\n');

  // 监听资源加载失败
  const failedResources = [];
  page.on('response', response => {
    if (response.status() === 404) {
      failedResources.push(response.url());
    }
  });

  // 监听注册请求
  page.on('request', request => {
    if (request.url().includes('supabase.co/auth/v1/signup')) {
      console.log('\n[✓] 注册请求已发送');
    }
  });

  // 监听注册响应
  page.on('response', async response => {
    if (response.url().includes('supabase.co/auth/v1/signup')) {
      console.log(`[✓] 注册响应: ${response.status()}`);
      if (response.status() === 429) {
        console.log('[!] Supabase 速率限制 (预期中)');
      } else if (response.status() === 200) {
        console.log('[✓] 注册成功！');
      }
    }
  });

  try {
    console.log('1. 访问认证页面...');
    await page.goto('https://vidluxe.com.cn/auth', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    if (failedResources.length > 0) {
      console.log(`\n❌ 仍有 ${failedResources.length} 个资源加载失败:`);
      failedResources.slice(0, 5).forEach(url => {
        console.log(`   - ${url.split('/').pop()}`);
      });
    } else {
      console.log('\n✅ 所有静态资源加载成功！');
    }

    console.log('\n2. 检查页面元素...');
    const buttons = await page.locator('button').count();
    console.log(`   找到 ${buttons} 个按钮`);

    if (buttons > 0) {
      console.log('   ✅ 页面正常渲染\n');

      console.log('3. 测试注册功能...');
      await page.click('button:has-text("注册")');
      await page.waitForTimeout(500);

      await page.fill('input[type="email"]', testEmail);
      const passwordInputs = await page.locator('input[type="password"]').all();
      await passwordInputs[0].fill(testPassword);
      if (passwordInputs.length > 1) {
        await passwordInputs[1].fill(testPassword);
      }

      console.log(`   测试邮箱: ${testEmail}`);

      await page.click('button:has-text("注册")').catch(() => {});
      await page.waitForTimeout(5000);

      const pageText = await page.textContent('body');
      if (pageText.includes('速率限制') || pageText.includes('rate limit')) {
        console.log('\n⚠️  Supabase 邮件速率限制 (这是预期的)');
        console.log('   建议: 在 Supabase Dashboard 启用邮箱自动确认');
      } else if (pageText.includes('成功')) {
        console.log('\n✅ 注册功能正常！');
      }
    } else {
      console.log('   ❌ 页面未正常渲染');
    }

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
  } finally {
    await browser.close();
  }

  console.log('\n=== 测试完成 ===');
})();
