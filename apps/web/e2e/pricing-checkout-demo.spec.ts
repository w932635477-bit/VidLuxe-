/**
 * VidLuxe 定价、结账和 Demo 页面有头测试
 * 使用 Playwright 进行可视化测试
 */

import { test, expect, Page } from '@playwright/test';

// 测试配置
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// 设置较长的超时时间，方便观察
test.setTimeout(300000);

// 辅助函数：等待页面加载
async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
}

// 辅助函数：截图并等待
async function screenshotAndWait(page: Page, name: string, waitTime = 2000) {
  await page.screenshot({ path: `test-results/${name}.png`, fullPage: true });
  await page.waitForTimeout(waitTime);
}

// ============================================
// 测试套件: 定价页面测试
// ============================================
test.describe('定价页面测试', () => {
  test('访问定价页面并检查卡片', async ({ page }) => {
    // 访问定价页面
    await page.goto(`${BASE_URL}/pricing`);
    await waitForPageLoad(page);

    // 截图：定价页面初始状态
    await screenshotAndWait(page, '01-pricing-page');

    // 检查定价页面标题
    await expect(page.getByRole('heading', { name: '定价' })).toBeVisible();

    // 检查所有定价卡片
    const pricingCards = page.locator('[class*="pricing"], [class*="card"]').filter({ hasText: '¥' });
    const cardCount = await pricingCards.count();
    console.log(`找到 ${cardCount} 个定价卡片`);

    // 检查各个价格点
    await expect(page.getByText('¥29')).toBeVisible();
    await expect(page.getByText('¥79')).toBeVisible();
    await expect(page.getByText('¥199')).toBeVisible();
    await expect(page.getByText('¥499')).toBeVisible();

    // 检查购买按钮
    const buyButtons = page.getByRole('button', { name: /购买|立即购买/ });
    const buttonCount = await buyButtons.count();
    console.log(`找到 ${buttonCount} 个购买按钮`);

    // 截图：定价卡片特写
    await page.locator('body').evaluate(el => {
      el.style.scrollBehavior = 'smooth';
    });
    await page.evaluate(() => window.scrollTo(0, 300));
    await screenshotAndWait(page, '02-pricing-cards');

    // 滚动到底部查看 FAQ
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await screenshotAndWait(page, '03-pricing-faq');
  });

  test('测试定价卡片交互', async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    await waitForPageLoad(page);

    // 获取所有购买按钮
    const buyButtons = page.getByRole('button', { name: /购买|立即购买/ });

    // 悬停在第一个按钮上
    await buyButtons.first().hover();
    await screenshotAndWait(page, '04-pricing-hover');

    // 点击第一个购买按钮（观察行为）
    await buyButtons.first().click();
    await page.waitForTimeout(2000);

    // 截图：点击后的状态
    await screenshotAndWait(page, '05-pricing-after-click');
  });
});

// ============================================
// 测试套件: 结账页面测试
// ============================================
test.describe('结账页面测试', () => {
  test('访问结账页面并检查表单', async ({ page }) => {
    // 访问结账页面
    await page.goto(`${BASE_URL}/checkout`);
    await waitForPageLoad(page);

    // 截图：结账页面初始状态
    await screenshotAndWait(page, '06-checkout-page');

    // 检查是否有表单元素
    const formElements = page.locator('form, input, button');
    const formCount = await formElements.count();
    console.log(`找到 ${formCount} 个表单元素`);

    // 检查常见结账元素
    const possibleElements = [
      '合计', '总计', '支付', '订单', '商品',
      '微信支付', '支付宝', '银行卡'
    ];

    for (const element of possibleElements) {
      const found = await page.getByText(new RegExp(element)).count();
      if (found > 0) {
        console.log(`找到元素: ${element}`);
      }
    }

    // 滚动查看整个页面
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await screenshotAndWait(page, '07-checkout-middle');

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await screenshotAndWait(page, '08-checkout-bottom');
  });

  test('测试结账表单交互', async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout`);
    await waitForPageLoad(page);

    // 查找所有可交互元素
    const inputs = page.locator('input:visible');
    const inputCount = await inputs.count();
    console.log(`找到 ${inputCount} 个输入框`);

    // 查找支付按钮
    const payButtons = page.getByRole('button').filter({ hasText: /支付|提交|确认/ });
    const buttonCount = await payButtons.count();
    console.log(`找到 ${buttonCount} 个支付相关按钮`);

    if (buttonCount > 0) {
      // 悬停在支付按钮上
      await payButtons.first().hover();
      await screenshotAndWait(page, '09-checkout-hover');
    }
  });
});

// ============================================
// 测试套件: Demo 页面测试
// ============================================
test.describe('Demo 页面测试', () => {
  test('访问 Demo 页面并检查内容', async ({ page }) => {
    // 访问 Demo 页面
    await page.goto(`${BASE_URL}/demo`);
    await waitForPageLoad(page);

    // 截图：Demo 页面初始状态
    await screenshotAndWait(page, '10-demo-page');

    // 检查页面标题
    await expect(page).toHaveTitle(/VidLuxe/);

    // 检查页面内容
    const pageContent = await page.content();
    console.log(`Demo 页面内容长度: ${pageContent.length}`);

    // 查找图片或示例
    const images = page.locator('img');
    const imageCount = await images.count();
    console.log(`找到 ${imageCount} 张图片`);

    // 查找按钮或链接
    const buttons = page.locator('button, a');
    const buttonCount = await buttons.count();
    console.log(`找到 ${buttonCount} 个按钮/链接`);

    // 滚动查看整个页面
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await screenshotAndWait(page, '11-demo-middle');

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await screenshotAndWait(page, '12-demo-bottom');
  });

  test('测试 Demo 页面交互', async ({ page }) => {
    await page.goto(`${BASE_URL}/demo`);
    await waitForPageLoad(page);

    // 查找可点击元素
    const clickableElements = page.locator('button:visible, a:visible');
    const count = await clickableElements.count();
    console.log(`找到 ${count} 个可点击元素`);

    if (count > 0) {
      // 悬停在第一个元素上
      await clickableElements.first().hover();
      await screenshotAndWait(page, '13-demo-hover');

      // 点击第一个元素
      await clickableElements.first().click();
      await page.waitForTimeout(2000);
      await screenshotAndWait(page, '14-demo-after-click');
    }
  });
});

// ============================================
// 测试套件: 页面导航测试
// ============================================
test.describe('页面导航测试', () => {
  test('从首页导航到各个页面', async ({ page }) => {
    // 从首页开始
    await page.goto(BASE_URL);
    await waitForPageLoad(page);
    await screenshotAndWait(page, '15-home-page');

    // 导航到定价页面
    const pricingLink = page.getByRole('link', { name: /定价|pricing/i });
    if (await pricingLink.count() > 0) {
      await pricingLink.first().click();
      await waitForPageLoad(page);
      await screenshotAndWait(page, '16-nav-to-pricing');
    }

    // 导航到 Demo 页面
    await page.goto(`${BASE_URL}/demo`);
    await waitForPageLoad(page);
    await screenshotAndWait(page, '17-nav-to-demo');

    // 导航到结账页面
    await page.goto(`${BASE_URL}/checkout`);
    await waitForPageLoad(page);
    await screenshotAndWait(page, '18-nav-to-checkout');
  });
});

// ============================================
// 测试套件: 响应式测试
// ============================================
test.describe('响应式测试', () => {
  test('移动端页面显示', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });

    // 测试定价页面
    await page.goto(`${BASE_URL}/pricing`);
    await waitForPageLoad(page);
    await screenshotAndWait(page, '19-mobile-pricing');

    // 测试 Demo 页面
    await page.goto(`${BASE_URL}/demo`);
    await waitForPageLoad(page);
    await screenshotAndWait(page, '20-mobile-demo');

    // 测试结账页面
    await page.goto(`${BASE_URL}/checkout`);
    await waitForPageLoad(page);
    await screenshotAndWait(page, '21-mobile-checkout');
  });

  test('平板端页面显示', async ({ page }) => {
    // 设置平板端视口
    await page.setViewportSize({ width: 768, height: 1024 });

    // 测试定价页面
    await page.goto(`${BASE_URL}/pricing`);
    await waitForPageLoad(page);
    await screenshotAndWait(page, '22-tablet-pricing');

    // 测试 Demo 页面
    await page.goto(`${BASE_URL}/demo`);
    await waitForPageLoad(page);
    await screenshotAndWait(page, '23-tablet-demo');
  });
});
