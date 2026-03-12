import { chromium } from 'playwright';

async function configureTencentCDN() {
  console.log('🚀 启动腾讯云 CDN 自动化配置\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. 访问腾讯云 CDN 控制台
    console.log('📋 访问腾讯云 CDN 控制台...');
    await page.goto('https://console.cloud.tencent.com/cdn/domains/vidluxe.com.cn?tab=cache');

    // 等待用户登录
    console.log('\n⏸️  请在浏览器中完成登录（扫码或账号密码）');
    console.log('登录完成后，脚本将自动继续...\n');

    // 等待页面加载完成
    await page.waitForURL('**/cdn/domains/**', { timeout: 120000 });
    console.log('✅ 登录成功！\n');

    // 等待页面完全加载
    await page.waitForTimeout(5000);

    // 2. 截图并提供手动配置指引
    console.log('🔍 分析页面结构...');
    await page.screenshot({ path: '/tmp/cdn-page.png', fullPage: true });
    console.log('📸 页面截图已保存: /tmp/cdn-page.png\n');

    console.log('⏸️  请手动操作：');
    console.log('1. 在浏览器中找到「节点缓存过期配置」区域');
    console.log('2. 点击「新增规则」按钮');
    console.log('3. 按照以下规则逐个添加：\n');

    const rules = [
      '规则 1: 类型=文件目录, 内容=/_next/static/, 缓存时间=31536000 秒',
      '规则 2: 类型=文件目录, 内容=/uploads/, 缓存时间=86400 秒',
      '规则 3: 类型=文件目录, 内容=/api/, 缓存时间=0 秒',
      '规则 4: 类型=文件后缀, 内容=html, 缓存时间=0 秒',
      '规则 5: 类型=首页, 内容=/, 缓存时间=0 秒',
      '规则 6: 类型=文件路径, 内容=/auth, 缓存时间=0 秒',
      '规则 7: 类型=文件路径, 内容=/try, 缓存时间=0 秒',
      '规则 8: 类型=文件路径, 内容=/pricing, 缓存时间=0 秒',
      '规则 9: 类型=文件路径, 内容=/dashboard, 缓存时间=0 秒',
      '规则 10: 类型=全部文件, 内容=*, 缓存时间=600 秒'
    ];

    rules.forEach(rule => console.log(`   ${rule}`));

    console.log('\n配置完成后，按 Enter 键继续...');
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });

    console.log('\n✅ 缓存规则配置完成！');
    console.log('\n📋 下一步：刷新 CDN 缓存');
    console.log('1. 在浏览器中点击「缓存刷新」标签');
    console.log('2. 选择「目录刷新」');
    console.log('3. 输入以下 URL（每行一个）：');
    console.log('   https://vidluxe.com.cn/');
    console.log('   https://vidluxe.com.cn/_next/static/');
    console.log('4. 点击「提交」');

    console.log('\n完成后按 Enter 键关闭浏览器...');
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });

    console.log('\n🎉 配置完成！');
    console.log('\n⏰ 请等待 5-10 分钟后验证配置是否生效');
    console.log('\n验证命令：');
    console.log('  curl -I https://vidluxe.com.cn/_next/static/css/app-layout.css');
    console.log('  curl -I https://vidluxe.com.cn/');
    console.log('  curl -I https://vidluxe.com.cn/api/health');

  } catch (error) {
    console.error('❌ 配置过程中出现错误:', error);
    console.log('\n请手动完成配置');
    console.log('参考文档: /docs/CDN_CORRECT_CONFIG.md');
  } finally {
    await browser.close();
  }
}

configureTencentCDN().catch(console.error);
