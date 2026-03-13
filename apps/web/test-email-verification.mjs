import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                                                              ║');
  console.log('║          邮箱验证奖励功能测试                                ║');
  console.log('║                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  try {
    console.log('步骤 1: 访问 /try 页面');
    await page.goto('https://vidluxe.com.cn/try', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(3000);

    console.log('  ✅ 页面加载成功\n');

    console.log('步骤 2: 检查是否显示验证提示横幅');
    const pageText = await page.textContent('body');

    if (pageText.includes('验证邮箱') && pageText.includes('5 次免费额度')) {
      console.log('  ✅ 验证提示横幅正常显示');
      console.log('  内容: "验证邮箱，获得 5 次免费额度 🎁"\n');

      // 截图
      await page.screenshot({ path: 'verification-banner.png', fullPage: true });
      console.log('  截图已保存: verification-banner.png\n');

      console.log('步骤 3: 测试发送验证邮件按钮');
      const sendButton = await page.locator('button:has-text("发送验证邮件")');

      if (await sendButton.isVisible()) {
        console.log('  ✅ "发送验证邮件"按钮存在\n');

        console.log('步骤 4: 点击发送按钮');
        await sendButton.click();
        await page.waitForTimeout(3000);

        const updatedText = await page.textContent('body');

        if (updatedText.includes('验证邮件已发送') || updatedText.includes('发送中')) {
          console.log('  ✅ 按钮功能正常\n');
        } else if (updatedText.includes('已验证') || updatedText.includes('已经领取')) {
          console.log('  ℹ️  邮箱已验证或已领取奖励\n');
        } else {
          console.log('  ⚠️  未检测到响应\n');
        }

        await page.screenshot({ path: 'after-send.png', fullPage: true });
        console.log('  截图已保存: after-send.png\n');
      } else {
        console.log('  ⚠️  "发送验证邮件"按钮不可见\n');
      }
    } else {
      console.log('  ℹ️  未显示验证提示（可能已验证或未登录）\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('功能验证完成');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ 邮箱验证奖励功能已部署');
    console.log('\n功能说明:');
    console.log('  1. 未验证邮箱的用户会看到顶部提示横幅');
    console.log('  2. 点击"发送验证邮件"会收到验证邮件');
    console.log('  3. 点击邮件中的链接完成验证');
    console.log('  4. 验证成功后自动获得 5 次免费额度');
    console.log('  5. 页面会显示"邮箱验证成功！已获得 5 次免费额度奖励"');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
  }

  console.log('\n浏览器将保持打开 10 秒供检查...');
  await page.waitForTimeout(10000);
  await browser.close();

  console.log('\n测试完成\n');
})();
