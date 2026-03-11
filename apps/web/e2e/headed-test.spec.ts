/**
 * VidLuxe 有头测试 (Headed Test)
 * 用于可视化测试认证页面和文件上传功能
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

// 辅助函数：截图并添加描述
async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `headed-test-${timestamp}-${name}.png`;
  await page.screenshot({ path: `test-results/${filename}`, fullPage: true });
  console.log(`截图已保存: ${filename}`);
}

// ============================================
// 测试套件 1: 认证页面测试
// ============================================
test.describe('认证页面测试 - 有头模式', () => {
  test.beforeEach(async ({ page }) => {
    // 确保截图目录存在
    await page.goto(`${BASE_URL}/auth`);
    await waitForPageLoad(page);
  });

  test('1. 认证页面加载', async ({ page }) => {
    console.log('\n=== 测试 1: 认证页面加载 ===');

    // 检查页面标题
    await expect(page).toHaveTitle(/VidLuxe/);
    console.log('页面标题检查通过');

    // 检查登录表单元素
    const emailInput = page.getByRole('textbox', { name: '请输入邮箱' });
    const passwordInput = page.getByRole('textbox', { name: '请输入密码' });

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    console.log('登录表单元素可见');

    // 检查登录和注册标签
    await expect(page.getByRole('button', { name: '登录' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: '注册' })).toBeVisible();
    console.log('登录/注册标签可见');

    await takeScreenshot(page, '01-auth-page-loaded');
    console.log('测试 1 完成\n');

    // 暂停 2 秒方便观察
    await page.waitForTimeout(2000);
  });

  test('2. 登录表单输入测试', async ({ page }) => {
    console.log('\n=== 测试 2: 登录表单输入测试 ===');

    // 确保在登录标签页
    await page.getByRole('button', { name: '登录' }).first().click();
    await page.waitForTimeout(500);

    // 测试邮箱输入
    const emailInput = page.getByRole('textbox', { name: '请输入邮箱' });
    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');
    console.log('邮箱输入: test@example.com');

    // 测试密码输入
    const passwordInput = page.getByRole('textbox', { name: '请输入密码' });
    await passwordInput.fill('password123');
    await expect(passwordInput).toHaveValue('password123');
    console.log('密码输入: password123');

    await takeScreenshot(page, '02-login-form-filled');
    console.log('测试 2 完成\n');

    await page.waitForTimeout(2000);
  });

  test('3. 登录表单验证 - 无效邮箱格式', async ({ page }) => {
    console.log('\n=== 测试 3: 登录表单验证 - 无效邮箱格式 ===');

    // 确保在登录标签页
    await page.getByRole('button', { name: '登录' }).first().click();
    await page.waitForTimeout(500);

    // 输入无效邮箱
    const emailInput = page.getByRole('textbox', { name: '请输入邮箱' });
    await emailInput.fill('invalid-email');
    console.log('输入无效邮箱: invalid-email');

    const passwordInput = page.getByRole('textbox', { name: '请输入密码' });
    await passwordInput.fill('password123');

    await takeScreenshot(page, '03-invalid-email-format');

    // 点击登录按钮
    const loginButton = page.getByRole('button', { name: '登录' }).nth(1);
    await loginButton.click();

    // 等待可能的错误提示
    await page.waitForTimeout(3000);

    await takeScreenshot(page, '04-invalid-email-error');
    console.log('测试 3 完成\n');
  });

  test('4. 注册表单输入测试', async ({ page }) => {
    console.log('\n=== 测试 4: 注册表单输入测试 ===');

    // 切换到注册标签
    await page.getByRole('button', { name: '注册' }).click();
    await page.waitForTimeout(500);
    console.log('切换到注册标签');

    // 填写注册表单
    const emailInput = page.getByRole('textbox', { name: '请输入邮箱' });
    await emailInput.fill('newuser@example.com');
    console.log('邮箱输入: newuser@example.com');

    const passwordInput = page.getByRole('textbox', { name: '请输入密码（至少6位）' });
    await passwordInput.fill('newpassword123');
    console.log('密码输入: newpassword123');

    const confirmPasswordInput = page.getByRole('textbox', { name: '请再次输入密码' });
    await confirmPasswordInput.fill('newpassword123');
    console.log('确认密码输入: newpassword123');

    await takeScreenshot(page, '05-register-form-filled');
    console.log('测试 4 完成\n');

    await page.waitForTimeout(2000);
  });

  test('5. 注册表单验证 - 密码不匹配', async ({ page }) => {
    console.log('\n=== 测试 5: 注册表单验证 - 密码不匹配 ===');

    // 切换到注册标签
    await page.getByRole('button', { name: '注册' }).click();
    await page.waitForTimeout(500);

    // 填写不匹配的密码
    const emailInput = page.getByRole('textbox', { name: '请输入邮箱' });
    await emailInput.fill('test@gmail.com');

    const passwordInput = page.getByRole('textbox', { name: '请输入密码（至少6位）' });
    await passwordInput.fill('password123');

    const confirmPasswordInput = page.getByRole('textbox', { name: '请再次输入密码' });
    await confirmPasswordInput.fill('password456');
    console.log('输入不匹配密码: password123 vs password456');

    await takeScreenshot(page, '06-password-mismatch-input');

    // 点击注册按钮
    const registerButton = page.getByRole('button', { name: '注册' }).nth(1);
    await registerButton.click();

    // 等待错误提示
    await page.waitForTimeout(3000);

    await takeScreenshot(page, '07-password-mismatch-error');
    console.log('测试 5 完成\n');
  });

  test('6. 注册表单验证 - 密码太短', async ({ page }) => {
    console.log('\n=== 测试 6: 注册表单验证 - 密码太短 ===');

    // 切换到注册标签
    await page.getByRole('button', { name: '注册' }).click();
    await page.waitForTimeout(500);

    // 填写短密码
    const emailInput = page.getByRole('textbox', { name: '请输入邮箱' });
    await emailInput.fill('test@gmail.com');

    const passwordInput = page.getByRole('textbox', { name: '请输入密码（至少6位）' });
    await passwordInput.fill('12345'); // 只有5位

    const confirmPasswordInput = page.getByRole('textbox', { name: '请再次输入密码' });
    await confirmPasswordInput.fill('12345');
    console.log('输入短密码: 12345 (5位)');

    await takeScreenshot(page, '08-short-password-input');

    // 点击注册按钮
    const registerButton = page.getByRole('button', { name: '注册' }).nth(1);
    await registerButton.click();

    // 等待错误提示
    await page.waitForTimeout(3000);

    await takeScreenshot(page, '09-short-password-error');
    console.log('测试 6 完成\n');
  });
});

// ============================================
// 测试套件 2: Try 页面文件上传测试
// ============================================
test.describe('Try 页面文件上传测试 - 有头模式', () => {
  test('7. Try 页面加载（未登录状态）', async ({ page }) => {
    console.log('\n=== 测试 7: Try 页面加载 ===');

    await page.goto(`${BASE_URL}/try`);
    await waitForPageLoad(page);

    // 检查页面状态
    const url = page.url();
    console.log(`当前 URL: ${url}`);

    // 可能会重定向到登录页或显示上传区域
    if (url.includes('/auth')) {
      console.log('未登录，已重定向到认证页面');
      await takeScreenshot(page, '10-try-redirect-to-auth');
    } else {
      // 检查上传区域
      const uploadArea = page.getByText(/拖入你的原片|上传/);
      if (await uploadArea.isVisible()) {
        console.log('上传区域可见');
      }
      await takeScreenshot(page, '10-try-page-loaded');
    }

    console.log('测试 7 完成\n');
    await page.waitForTimeout(2000);
  });

  test('8. 文件上传区域交互测试', async ({ page }) => {
    console.log('\n=== 测试 8: 文件上传区域交互测试 ===');

    await page.goto(`${BASE_URL}/try`);
    await waitForPageLoad(page);

    // 如果被重定向到登录页，先进行简单登录模拟
    if (page.url().includes('/auth')) {
      console.log('需要登录才能访问 Try 页面');
      console.log('尝试使用测试账号登录...');

      // 填写登录表单（使用任意测试数据）
      await page.getByRole('textbox', { name: '请输入邮箱' }).fill('test@example.com');
      await page.getByRole('textbox', { name: '请输入密码' }).fill('test123456');

      await takeScreenshot(page, '11-login-for-try');

      // 点击登录
      await page.getByRole('button', { name: '登录' }).nth(1).click();
      await page.waitForTimeout(3000);

      // 检查是否登录成功
      const currentUrl = page.url();
      console.log(`登录后 URL: ${currentUrl}`);

      if (!currentUrl.includes('/try')) {
        // 如果没有自动跳转，手动导航
        await page.goto(`${BASE_URL}/try`);
        await waitForPageLoad(page);
      }
    }

    await takeScreenshot(page, '12-try-page-after-auth');

    // 检查上传区域
    const fileInput = page.locator('input[type="file"]');
    const uploadArea = page.getByText(/拖入你的原片|上传|点击上传/);

    if (await fileInput.isVisible() || await uploadArea.isVisible()) {
      console.log('上传区域已就绪');

      // 尝试上传测试图片
      try {
        const testImagePath = 'public/comparisons/outfit-urban-after.jpg';
        await fileInput.setInputFiles(testImagePath);
        console.log(`已上传测试图片: ${testImagePath}`);
        await page.waitForTimeout(2000);
        await takeScreenshot(page, '13-file-uploaded');
      } catch (e) {
        console.log('文件上传可能需要登录:', (e as Error).message);
      }
    } else {
      console.log('上传区域不可见，可能需要登录');
    }

    console.log('测试 8 完成\n');
    await page.waitForTimeout(2000);
  });

  test('9. 文件类型验证测试', async ({ page }) => {
    console.log('\n=== 测试 9: 文件类型验证测试 ===');

    await page.goto(`${BASE_URL}/try`);
    await waitForPageLoad(page);

    // 如果需要登录
    if (page.url().includes('/auth')) {
      await page.getByRole('textbox', { name: '请输入邮箱' }).fill('test@example.com');
      await page.getByRole('textbox', { name: '请输入密码' }).fill('test123456');
      await page.getByRole('button', { name: '登录' }).nth(1).click();
      await page.waitForTimeout(3000);

      if (page.url().includes('/auth')) {
        await page.goto(`${BASE_URL}/try`);
        await waitForPageLoad(page);
      }
    }

    const fileInput = page.locator('input[type="file"]');

    // 尝试上传不支持的文件类型
    try {
      // 创建一个临时的 txt 文件用于测试
      await page.evaluate(() => {
        const content = 'This is a test file';
        const blob = new Blob([content], { type: 'text/plain' });
        const file = new File([blob], 'test.txt', { type: 'text/plain' });

        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        const fileInputElement = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInputElement) {
          fileInputElement.files = dataTransfer.files;
          fileInputElement.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });

      console.log('尝试上传 txt 文件');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, '14-invalid-file-type');
    } catch (e) {
      console.log('文件类型验证测试:', (e as Error).message);
    }

    console.log('测试 9 完成\n');
    await page.waitForTimeout(2000);
  });

  test('10. 风格选择测试', async ({ page }) => {
    console.log('\n=== 测试 10: 风格选择测试 ===');

    await page.goto(`${BASE_URL}/try`);
    await waitForPageLoad(page);

    // 如果需要登录
    if (page.url().includes('/auth')) {
      await page.getByRole('textbox', { name: '请输入邮箱' }).fill('test@example.com');
      await page.getByRole('textbox', { name: '请输入密码' }).fill('test123456');
      await page.getByRole('button', { name: '登录' }).nth(1).click();
      await page.waitForTimeout(3000);

      if (page.url().includes('/auth')) {
        await page.goto(`${BASE_URL}/try`);
        await waitForPageLoad(page);
      }
    }

    // 上传图片
    const fileInput = page.locator('input[type="file"]');
    try {
      await fileInput.setInputFiles('public/comparisons/outfit-urban-after.jpg');
      await page.waitForTimeout(2000);
      console.log('图片上传成功');

      // 检查风格预设是否显示
      const styles = ['杂志大片', '日系温柔', '都市职场', '复古胶片'];

      for (const style of styles) {
        const styleElement = page.getByText(new RegExp(style));
        if (await styleElement.isVisible()) {
          console.log(`风格预设可见: ${style}`);
        }
      }

      await takeScreenshot(page, '15-style-presets');

      // 尝试点击一个风格
      try {
        await page.getByText(/杂志大片/).click();
        await page.waitForTimeout(1000);
        await takeScreenshot(page, '16-style-selected');
        console.log('已选择风格: 杂志大片');
      } catch (e) {
        console.log('风格选择:', (e as Error).message);
      }
    } catch (e) {
      console.log('需要先上传图片:', (e as Error).message);
      await takeScreenshot(page, '15-no-style-presets');
    }

    console.log('测试 10 完成\n');
    await page.waitForTimeout(2000);
  });
});

// ============================================
// 测试套件 3: 页面导航和响应式测试
// ============================================
test.describe('页面导航和响应式测试 - 有头模式', () => {
  test('11. 首页导航测试', async ({ page }) => {
    console.log('\n=== 测试 11: 首页导航测试 ===');

    await page.goto(BASE_URL);
    await waitForPageLoad(page);

    await takeScreenshot(page, '17-homepage');

    // 测试导航到定价页面
    const pricingLink = page.getByRole('link', { name: '定价' });
    if (await pricingLink.isVisible()) {
      await pricingLink.click();
      await waitForPageLoad(page);
      console.log('导航到定价页面');
      await takeScreenshot(page, '18-pricing-page');
    }

    // 返回首页
    await page.goto(BASE_URL);
    await waitForPageLoad(page);

    // 测试导航到体验页面
    const tryLink = page.getByRole('link', { name: /体验|Try/ });
    if (await tryLink.isVisible()) {
      await tryLink.click();
      await waitForPageLoad(page);
      console.log('导航到体验页面');
      await takeScreenshot(page, '19-try-page-via-nav');
    }

    console.log('测试 11 完成\n');
    await page.waitForTimeout(2000);
  });

  test('12. 移动端响应式测试', async ({ page }) => {
    console.log('\n=== 测试 12: 移动端响应式测试 ===');

    // 设置移动端视口 (iPhone 12)
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto(BASE_URL);
    await waitForPageLoad(page);

    await takeScreenshot(page, '20-mobile-homepage');
    console.log('移动端首页截图');

    // 测试认证页面
    await page.goto(`${BASE_URL}/auth`);
    await waitForPageLoad(page);

    await takeScreenshot(page, '21-mobile-auth-page');
    console.log('移动端认证页面截图');

    console.log('测试 12 完成\n');
    await page.waitForTimeout(2000);
  });

  test('13. 平板端响应式测试', async ({ page }) => {
    console.log('\n=== 测试 13: 平板端响应式测试 ===');

    // 设置平板端视口 (iPad Pro)
    await page.setViewportSize({ width: 1024, height: 1366 });

    await page.goto(BASE_URL);
    await waitForPageLoad(page);

    await takeScreenshot(page, '22-tablet-homepage');
    console.log('平板端首页截图');

    // 测试认证页面
    await page.goto(`${BASE_URL}/auth`);
    await waitForPageLoad(page);

    await takeScreenshot(page, '23-tablet-auth-page');
    console.log('平板端认证页面截图');

    console.log('测试 13 完成\n');
    await page.waitForTimeout(2000);
  });
});
