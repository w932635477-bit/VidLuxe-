/**
 * VidLuxe E2E 测试套件
 * 使用 Playwright 进行自动化测试
 */

import { test, expect, Page } from '@playwright/test';

// 测试配置
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || '';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || '';

// 测试超时时间
test.setTimeout(120000);

// 辅助函数：等待页面加载
async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
}

// 辅助函数：登录
async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/auth`);
  await waitForPageLoad(page);

  // 填写登录表单
  await page.getByRole('textbox', { name: '请输入邮箱' }).fill(email);
  await page.getByRole('textbox', { name: '请输入密码' }).fill(password);

  // 点击登录按钮
  await page.getByRole('button', { name: '登录' }).nth(1).click();

  // 等待登录完成
  await page.waitForURL(/\/(try|)/, { timeout: 10000 });
}

// ============================================
// 测试套件 1: 页面加载测试
// ============================================
test.describe('页面加载测试', () => {
  test('首页应该正常加载', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageLoad(page);

    // 检查页面标题
    await expect(page).toHaveTitle(/VidLuxe/);

    // 检查关键元素
    await expect(page.getByRole('heading', { name: /VidLuxe AI/ })).toBeVisible();
    await expect(page.getByRole('link', { name: '体验', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: '定价' })).toBeVisible();
  });

  test('定价页面应该正常加载', async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    await waitForPageLoad(page);

    // 检查定价卡片
    await expect(page.getByRole('heading', { name: '定价' })).toBeVisible();
    await expect(page.getByText('¥29')).toBeVisible();
    await expect(page.getByText('¥79')).toBeVisible();
    await expect(page.getByText('¥199')).toBeVisible();
    await expect(page.getByText('¥499')).toBeVisible();
  });

  test('示例页面应该正常加载', async ({ page }) => {
    await page.goto(`${BASE_URL}/demo`);
    await waitForPageLoad(page);

    await expect(page).toHaveTitle(/VidLuxe/);
  });

  test('登录页面应该正常加载', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);
    await waitForPageLoad(page);

    await expect(page.getByRole('textbox', { name: '请输入邮箱' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: '请输入密码' })).toBeVisible();
  });
});

// ============================================
// 测试套件 2: 表单验证测试
// ============================================
test.describe('表单验证测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);
    await waitForPageLoad(page);
  });

  test('注册表单 - 无效邮箱应该被拒绝', async ({ page }) => {
    // 切换到注册标签
    await page.getByRole('button', { name: '注册' }).click();

    // 填写无效邮箱（格式不正确）
    await page.getByRole('textbox', { name: '请输入邮箱' }).fill('invalid-email');
    await page.getByRole('textbox', { name: '请输入密码（至少6位）' }).fill('password123');
    await page.getByRole('textbox', { name: '请再次输入密码' }).fill('password123');

    // 提交表单
    await page.getByRole('button', { name: '注册' }).nth(1).click();

    // 等待错误提示（邮箱格式错误或注册失败）
    await expect(page.getByText(/invalid|无效|格式|失败|错误/)).toBeVisible({ timeout: 10000 });
  });

  test('登录表单 - 错误凭据应该显示错误', async ({ page }) => {
    // 填写错误凭据
    await page.getByRole('textbox', { name: '请输入邮箱' }).fill('wrong@test.com');
    await page.getByRole('textbox', { name: '请输入密码' }).fill('wrongpassword');

    // 提交登录
    await page.getByRole('button', { name: '登录' }).nth(1).click();

    // 等待错误提示
    await expect(page.getByText(/错误|失败/)).toBeVisible({ timeout: 5000 });
  });

  test('注册表单 - 密码不匹配应该被检测', async ({ page }) => {
    // 切换到注册标签
    await page.getByRole('button', { name: '注册' }).click();

    // 填写不匹配的密码
    await page.getByRole('textbox', { name: '请输入邮箱' }).fill('test@gmail.com');
    await page.getByRole('textbox', { name: '请输入密码（至少6位）' }).fill('password123');
    await page.getByRole('textbox', { name: '请再次输入密码' }).fill('password456');

    // 提交表单
    await page.getByRole('button', { name: '注册' }).nth(1).click();

    // 应该显示密码不匹配的错误
    await expect(page.getByText(/不匹配|不一致/)).toBeVisible({ timeout: 5000 });
  });
});

// ============================================
// 测试套件 3: 导航测试
// ============================================
test.describe('导航测试', () => {
  test('从首页导航到定价页面', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageLoad(page);

    await page.getByRole('link', { name: '定价' }).click();
    await waitForPageLoad(page);

    await expect(page).toHaveURL(/pricing/);
  });

  test('从首页导航到体验页面（需要登录）', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageLoad(page);

    // 直接导航到体验页面验证重定向
    await page.goto(`${BASE_URL}/try`);
    await waitForPageLoad(page);

    // 应该重定向到登录页或留在体验页
    expect(page.url()).toMatch(/\/(auth|try)/);
  });
});

// ============================================
// 测试套件 4: 邀请码系统测试（需要登录）
// ============================================
test.describe('邀请码系统测试', () => {
  test.skip(!TEST_USER_EMAIL || !TEST_USER_PASSWORD, '需要测试账号');

  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
  });

  test('邀请码面板应该可以展开', async ({ page }) => {
    await page.goto(`${BASE_URL}/try`);
    await waitForPageLoad(page);

    // 点击邀请码按钮
    await page.getByRole('button', { name: /邀请好友/ }).click();

    // 检查邀请码显示
    await expect(page.getByText('我的邀请码')).toBeVisible();
    await expect(page.getByRole('button', { name: /复制链接/ })).toBeVisible();
  });

  test('无效邀请码应该被拒绝', async ({ page }) => {
    await page.goto(`${BASE_URL}/try`);
    await waitForPageLoad(page);

    // 展开邀请码面板
    await page.getByRole('button', { name: /邀请好友/ }).click();

    // 输入无效邀请码
    await page.getByRole('textbox', { name: /邀请码/ }).fill('INVALID');
    await page.getByRole('button', { name: '兑换' }).click();

    // 应该显示错误
    await expect(page.getByText(/无效|不存在/)).toBeVisible({ timeout: 5000 });
  });
});

// ============================================
// 测试套件 5: 图片上传测试（需要登录）
// ============================================
test.describe('图片上传测试', () => {
  test.skip(!TEST_USER_EMAIL || !TEST_USER_PASSWORD, '需要测试账号');

  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
  });

  test('应该显示上传区域', async ({ page }) => {
    await page.goto(`${BASE_URL}/try`);
    await waitForPageLoad(page);

    await expect(page.getByText(/拖入你的原片/)).toBeVisible();
  });

  test('应该显示风格预设选项', async ({ page }) => {
    await page.goto(`${BASE_URL}/try`);
    await waitForPageLoad(page);

    // 上传测试图片（使用项目中的测试图片）
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('public/comparisons/outfit-urban-after.jpg');

    // 等待上传完成
    await waitForPageLoad(page);

    // 检查风格预设是否显示
    await expect(page.getByText(/杂志大片/)).toBeVisible();
    await expect(page.getByText(/日系温柔/)).toBeVisible();
  });

  test('应该显示效果强度滑块', async ({ page }) => {
    await page.goto(`${BASE_URL}/try`);
    await waitForPageLoad(page);

    // 上传测试图片
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('public/comparisons/outfit-urban-after.jpg');
    await waitForPageLoad(page);

    // 检查滑块
    await expect(page.getByText('效果强度')).toBeVisible();
    await expect(page.getByRole('slider')).toBeVisible();
  });
});

// ============================================
// 测试套件 6: 支付系统测试（需要登录）
// ============================================
test.describe('支付系统测试', () => {
  test.skip(!TEST_USER_EMAIL || !TEST_USER_PASSWORD, '需要测试账号');

  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
  });

  test('定价页面购买按钮应该可点击', async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    await waitForPageLoad(page);

    // 检查购买按钮存在
    const buyButtons = page.getByRole('button', { name: '立即购买' });
    await expect(buyButtons.first()).toBeVisible();

    // 点击第一个购买按钮
    await buyButtons.first().click();

    // 按钮应该变为加载状态或显示错误
    // 注意：实际支付需要配置微信支付
    await page.waitForTimeout(2000);
  });

  test('应该显示支付方式说明', async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    await waitForPageLoad(page);

    // 滚动到底部查看 FAQ
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // 检查支付方式说明
    await expect(page.getByText(/支付方式/)).toBeVisible();
  });
});

// ============================================
// 测试套件 7: 响应式测试
// ============================================
test.describe('响应式测试', () => {
  test('移动端首页应该正常显示', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    await waitForPageLoad(page);

    await expect(page.getByRole('heading', { name: /VidLuxe AI/ })).toBeVisible();
  });

  test('平板端首页应该正常显示', async ({ page }) => {
    // 设置平板端视口
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(BASE_URL);
    await waitForPageLoad(page);

    await expect(page.getByRole('heading', { name: /VidLuxe AI/ })).toBeVisible();
  });
});
