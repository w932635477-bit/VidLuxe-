import { chromium } from 'playwright';

(async () => {
  console.log('=== Supabase 邮箱自动确认配置工具 ===\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('步骤 1: 访问 Supabase 项目设置页面...');
    await page.goto('https://supabase.com/dashboard/project/lklgluxnloqmyelxtpfi/auth/providers', {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    console.log('\n⚠️  请在打开的浏览器中完成以下操作：\n');
    console.log('1. 如果需要登录，请先登录 Supabase 账号');
    console.log('2. 登录后，页面会自动跳转到 Authentication > Providers');
    console.log('3. 找到 "Email" 部分');
    console.log('4. 找到 "Confirm email" 开关');
    console.log('5. 将开关从 ON 改为 OFF');
    console.log('6. 点击页面底部的 "Save" 按钮');
    console.log('\n我会等待你完成操作...\n');

    // 等待用户手动操作
    console.log('操作完成后，请在这个终端按 Ctrl+C 退出');
    console.log('或者等待 5 分钟后自动关闭\n');

    // 监听页面变化
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/auth/config') && response.request().method() === 'PUT') {
        console.log('\n✅ 检测到配置保存请求！');
        try {
          const body = await response.json();
          console.log('配置已更新');
        } catch (e) {}
      }
    });

    // 等待 5 分钟
    await page.waitForTimeout(300000);

  } catch (error) {
    console.error('\n❌ 错误:', error.message);
  }

  console.log('\n浏览器将保持打开状态，请手动关闭');
})();
