# VidLuxe 测试策略

## 概述

VidLuxe 采用测试金字塔策略，从底层的单元测试到顶端的 E2E 测试，确保代码质量和系统稳定性。

---

## 测试金字塔

```
              /\
             /  \
            / E2E \           Playwright
           /------\
          /  集成   \         Vitest + MSW
         /----------\
        /   单元测试  \       Vitest
       /--------------\
```

### 覆盖目标

| 测试类型 | 覆盖率目标 | 工具 |
|---------|-----------|------|
| 单元测试 | 80%+ | Vitest |
| 集成测试 | 核心流程 | Vitest + MSW |
| E2E 测试 | 关键路径 | Playwright |

---

## 单元测试

### 配置

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

### Setup 文件

```typescript
// tests/setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Canvas API
class MockCanvasRenderingContext2D {
  fillRect() {}
  clearRect() {}
  getImageData(x: number, y: number, w: number, h: number) {
    return {
      data: new Uint8ClampedArray(w * h * 4).fill(128),
      width: w,
      height: h,
    };
  }
  putImageData() {}
}

HTMLCanvasElement.prototype.getContext = vi.fn(() => {
  return new MockCanvasRenderingContext2D() as any;
});

// Mock ImageData
global.ImageData = class ImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;

  constructor(dataOrWidth: any, widthOrHeight: any, height?: number) {
    if (dataOrWidth instanceof Uint8ClampedArray) {
      this.data = dataOrWidth;
      this.width = widthOrHeight;
      this.height = height!;
    } else {
      this.width = dataOrWidth;
      this.height = widthOrHeight;
      this.data = new Uint8ClampedArray(this.width * this.height * 4);
    }
  }
} as any;
```

### 色彩分析器测试

```typescript
// packages/core/src/analyzer/__tests__/color-analyzer.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ColorAnalyzer } from '../color-analyzer';

describe('ColorAnalyzer', () => {
  let analyzer: ColorAnalyzer;

  beforeEach(() => {
    analyzer = new ColorAnalyzer();
  });

  describe('analyzeFrame', () => {
    it('should analyze a simple solid color frame', () => {
      const imageData = createSolidColorImage(200, 200, {
        r: 128,
        g: 128,
        b: 128,
      });

      const result = analyzer.analyzeFrame(imageData);

      expect(result.saturation.mean).toBeCloseTo(0, 1);
      expect(result.brightness.mean).toBeCloseTo(0.5, 1);
    });

    it('should detect high saturation', () => {
      const imageData = createSolidColorImage(200, 200, {
        r: 255,
        g: 0,
        b: 0,
      });

      const result = analyzer.analyzeFrame(imageData);

      expect(result.saturation.mean).toBeGreaterThan(0.8);
      expect(result.issues).toContainEqual(expect.stringContaining('饱和度过高'));
    });

    it('should detect low saturation', () => {
      const imageData = createSolidColorImage(200, 200, {
        r: 60,
        g: 60,
        b: 60,
      });

      const result = analyzer.analyzeFrame(imageData);

      expect(result.issues).toContainEqual(expect.stringContaining('饱和度过低'));
    });

    it('should give premium score for optimal saturation', () => {
      // 创建一个饱和度在 40-50% 范围的图像
      const imageData = createOptimalSaturationImage(200, 200);

      const result = analyzer.analyzeFrame(imageData);

      expect(result.premiumScore).toBeGreaterThan(80);
    });

    it('should extract dominant colors', () => {
      const imageData = createMultiColorImage(200, 200, [
        { r: 255, g: 0, b: 0 },
        { r: 0, g: 255, b: 0 },
        { r: 0, g: 0, b: 255 },
      ]);

      const result = analyzer.analyzeFrame(imageData);

      expect(result.dominantColors.length).toBe(3);
      expect(result.colorCount).toBe(3);
    });

    it('should calculate color harmony', () => {
      // 相似颜色 - 高和谐度
      const harmoniousImage = createHarmoniousColorsImage(200, 200);
      const harmoniousResult = analyzer.analyzeFrame(harmoniousImage);
      expect(harmoniousResult.colorHarmony).toBeGreaterThan(0.7);

      // 对比色 - 较低和谐度
      const contrastingImage = createContrastingColorsImage(200, 200);
      const contrastingResult = analyzer.analyzeFrame(contrastingImage);
      expect(contrastingResult.colorHarmony).toBeLessThan(0.7);
    });
  });

  describe('analyzeFrames', () => {
    it('should aggregate results from multiple frames', () => {
      const frames = [
        createSolidColorImage(200, 200, { r: 128, g: 128, b: 128 }),
        createSolidColorImage(200, 200, { r: 130, g: 130, b: 130 }),
        createSolidColorImage(200, 200, { r: 126, g: 126, b: 126 }),
      ];

      const result = analyzer.analyzeFrames(frames);

      expect(result.colorConsistency).toBeGreaterThan(0.9);
    });

    it('should detect inconsistent color across frames', () => {
      const frames = [
        createSolidColorImage(200, 200, { r: 50, g: 50, b: 50 }),
        createSolidColorImage(200, 200, { r: 200, g: 200, b: 200 }),
      ];

      const result = analyzer.analyzeFrames(frames);

      expect(result.colorConsistency).toBeLessThan(0.8);
      expect(result.issues).toContainEqual(expect.stringContaining('风格不够统一'));
    });
  });
});

// Test helpers
function createSolidColorImage(
  width: number,
  height: number,
  color: { r: number; g: number; b: number }
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = color.r;
    data[i + 1] = color.g;
    data[i + 2] = color.b;
    data[i + 3] = 255;
  }
  return new ImageData(data, width, height);
}

function createOptimalSaturationImage(width: number, height: number): ImageData {
  // 创建一个饱和度约 45% 的图像
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    // HSL to RGB: 饱和度 0.45, 亮度 0.5
    const hsl = { h: 0.5, s: 0.45, l: 0.5 };
    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    data[i] = rgb.r;
    data[i + 1] = rgb.g;
    data[i + 2] = rgb.b;
    data[i + 3] = 255;
  }
  return new ImageData(data, width, height);
}

function hslToRgb(h: number, s: number, l: number) {
  // ... HSL to RGB 转换实现
}
```

### 评分引擎测试

```typescript
// packages/core/src/scorer/__tests__/premium-scorer.test.ts
import { describe, it, expect } from 'vitest';
import { PremiumScorer } from '../premium-scorer';
import { GRADE_THRESHOLDS } from '@vidluxe/types';

describe('PremiumScorer', () => {
  const scorer = new PremiumScorer();

  describe('calculateGrade', () => {
    it('should return S for score >= 85', () => {
      expect(scorer.calculateGrade(85)).toBe('S');
      expect(scorer.calculateGrade(100)).toBe('S');
    });

    it('should return A for score 75-84', () => {
      expect(scorer.calculateGrade(75)).toBe('A');
      expect(scorer.calculateGrade(84)).toBe('A');
    });

    it('should return B for score 65-74', () => {
      expect(scorer.calculateGrade(65)).toBe('B');
      expect(scorer.calculateGrade(74)).toBe('B');
    });

    it('should return C for score 55-64', () => {
      expect(scorer.calculateGrade(55)).toBe('C');
      expect(scorer.calculateGrade(64)).toBe('C');
    });

    it('should return D for score < 55', () => {
      expect(scorer.calculateGrade(54)).toBe('D');
      expect(scorer.calculateGrade(0)).toBe('D');
    });
  });

  describe('calculateFromColor', () => {
    it('should calculate score from color analysis', () => {
      const colorAnalysis = {
        saturation: { mean: 0.45, std: 0.1, highRatio: 0.1 },
        brightness: { mean: 0.5, std: 0.2 },
        contrast: { ratio: 4.5, score: 85 },
        dominantColors: [
          { r: 100, g: 100, b: 100, hex: '#646464' },
          { r: 150, g: 150, b: 150, hex: '#969696' },
        ],
        colorCount: 2,
        colorTemperature: 5500,
        colorHarmony: 0.85,
        colorConsistency: 0.95,
        premiumScore: 88,
        issues: [],
        suggestions: [],
      };

      const result = scorer.calculateFromColor(colorAnalysis);

      expect(result.total).toBeGreaterThan(75);
      expect(result.grade).toMatch(/S|A|B/);
      expect(result.dimensions.color.score).toBe(88);
    });
  });

  describe('getGradeColor', () => {
    it('should return correct colors for each grade', () => {
      expect(scorer.getGradeColor('S')).toBe('#FFD700');
      expect(scorer.getGradeColor('A')).toBe('#4CAF50');
      expect(scorer.getGradeColor('B')).toBe('#2196F3');
      expect(scorer.getGradeColor('C')).toBe('#FF9800');
      expect(scorer.getGradeColor('D')).toBe('#F44336');
    });
  });

  describe('custom weights', () => {
    it('should throw error if weights do not sum to 1', () => {
      expect(() => {
        new PremiumScorer({
          weights: {
            color: 0.5,
            typography: 0.5,
            composition: 0.5,
            motion: 0.1,
            audio: 0.1,
            detail: 0.1,
          },
        });
      }).toThrow('Weights must sum to 1');
    });

    it('should accept valid custom weights', () => {
      const customScorer = new PremiumScorer({
        weights: {
          color: 0.35,
          typography: 0.15,
          composition: 0.20,
          motion: 0.15,
          audio: 0.10,
          detail: 0.05,
        },
      });

      expect(customScorer).toBeDefined();
    });
  });
});
```

### 颜色规则测试

```typescript
// packages/core/src/rules/__tests__/color-rules.test.ts
import { describe, it, expect } from 'vitest';
import {
  saturationRules,
  colorCountRules,
  colorHarmonyRules,
} from '../color-rules';

describe('Color Rules', () => {
  describe('saturationRules', () => {
    const rule = saturationRules[0];

    it('should pass for optimal saturation (40-50%)', () => {
      const result = rule.check(0.45);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
    });

    it('should pass for acceptable saturation (35-55%)', () => {
      const result = rule.check(0.36);
      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(85);
    });

    it('should fail for low saturation', () => {
      const result = rule.check(0.25);
      expect(result.passed).toBe(false);
      expect(result.message).toContain('饱和度过低');
    });

    it('should fail for high saturation', () => {
      const result = rule.check(0.70);
      expect(result.passed).toBe(false);
      expect(result.message).toContain('饱和度过高');
    });
  });

  describe('colorCountRules', () => {
    const rule = colorCountRules[0];

    it('should pass for <= 3 colors', () => {
      const result = rule.check(3);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
    });

    it('should pass with lower score for 4 colors', () => {
      const result = rule.check(4);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(85);
    });

    it('should fail for > 5 colors', () => {
      const result = rule.check(6);
      expect(result.passed).toBe(false);
      expect(result.message).toContain('颜色种类过多');
    });
  });

  describe('colorHarmonyRules', () => {
    const rule = colorHarmonyRules[0];

    it('should pass for high harmony', () => {
      const result = rule.check(0.85);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
    });

    it('should fail for low harmony', () => {
      const result = rule.check(0.5);
      expect(result.passed).toBe(false);
      expect(result.message).toContain('色彩和谐度不足');
    });
  });
});
```

---

## 集成测试

### API 集成测试

```typescript
// packages/api/src/__tests__/analyze.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createHTTPApp } from '../create-app';
import type { AppRouter } from '../router';
import { inferProcedureInput } from '@trpc/server';
import { render, waitFor } from '@testing-library/react';

describe('Analyze API', () => {
  let caller: ReturnType<typeof createCaller>;

  beforeAll(async () => {
    caller = createCaller({});
  });

  describe('analyze.submit', () => {
    it('should submit analysis task', async () => {
      const input: inferProcedureInput<AppRouter['analyze']['submit']> = {
        videoUrl: 'https://example.com/test.mp4',
        options: {
          sampleFrames: 30,
        },
      };

      const result = await caller.analyze.submit(input);

      expect(result).toHaveProperty('analysisId');
      expect(result.status).toBe('processing');
    });

    it('should reject invalid video URL', async () => {
      const input = {
        videoUrl: 'not-a-url',
      };

      await expect(caller.analyze.submit(input)).rejects.toThrow();
    });
  });

  describe('analyze.getResult', () => {
    it('should return analysis result', async () => {
      // 先创建分析任务
      const { analysisId } = await caller.analyze.submit({
        videoUrl: 'https://example.com/test.mp4',
      });

      // 模拟处理完成
      await mockAnalysisComplete(analysisId);

      const result = await caller.analyze.getResult({ analysisId });

      expect(result.status).toBe('completed');
      expect(result).toHaveProperty('score');
    });
  });
});
```

### React 组件集成测试

```typescript
// components/features/analyze/__tests__/score-card.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScoreCard } from '../score-card';
import type { PremiumScore } from '@vidluxe/types';

describe('ScoreCard', () => {
  const mockScore: PremiumScore = {
    total: 85,
    grade: 'S',
    dimensions: {
      color: { score: 90, weight: 0.25, issues: [], suggestions: [] },
      typography: { score: 80, weight: 0.20, issues: [], suggestions: [] },
      composition: { score: 85, weight: 0.20, issues: [], suggestions: [] },
      motion: { score: 75, weight: 0.15, issues: [], suggestions: [] },
      audio: { score: 70, weight: 0.10, issues: [], suggestions: [] },
      detail: { score: 80, weight: 0.10, issues: [], suggestions: [] },
    },
    timestamp: new Date().toISOString(),
  };

  it('should render score correctly', () => {
    render(<ScoreCard score={mockScore} />);

    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.getByText('顶级')).toBeInTheDocument();
  });

  it('should render all dimensions', () => {
    render(<ScoreCard score={mockScore} />);

    expect(screen.getByText('color')).toBeInTheDocument();
    expect(screen.getByText('typography')).toBeInTheDocument();
    expect(screen.getByText('composition')).toBeInTheDocument();
  });
});
```

---

## E2E 测试

### Playwright 配置

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 关键路径测试

```typescript
// e2e/analyze.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Video Analysis Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should upload and analyze video', async ({ page }) => {
    // 导航到上传页面
    await page.click('text=上传视频');
    await expect(page).toHaveURL('/upload');

    // 填写项目名称
    await page.fill('input[name="name"]', 'Test Video');

    // 上传视频
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/sample.mp4');

    // 提交
    await page.click('text=开始分析');

    // 等待分析完成
    await page.waitForURL(/\/analyze\/.*/, { timeout: 60000 });

    // 验证结果显示
    await expect(page.locator('[data-testid="score-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="grade-badge"]')).toBeVisible();
  });

  test('should display analysis results correctly', async ({ page }) => {
    // 直接访问已有分析结果
    await page.goto('/analyze/test-analysis-id');

    // 等待加载
    await page.waitForSelector('[data-testid="score-card"]');

    // 验证各组件
    const scoreCard = page.locator('[data-testid="score-card"]');
    await expect(scoreCard).toBeVisible();

    const dimensionChart = page.locator('[data-testid="dimension-chart"]');
    await expect(dimensionChart).toBeVisible();

    const issueList = page.locator('[data-testid="issue-list"]');
    await expect(issueList).toBeVisible();
  });

  test('should enhance video with selected style', async ({ page }) => {
    await page.goto('/analyze/test-analysis-id');

    // 点击增强按钮
    await page.click('text=增强视频');

    // 选择风格
    await page.click('text=莫兰迪色系');

    // 选择强度
    await page.click('text=中等');

    // 开始增强
    await page.click('text=开始增强');

    // 等待完成
    await page.waitForSelector('text=增强完成', { timeout: 120000 });

    // 验证对比视图
    await expect(page.locator('[data-testid="before-after"]')).toBeVisible();
  });
});

test.describe('Dashboard', () => {
  test('should display recent projects', async ({ page }) => {
    await page.goto('/dashboard');

    const projectCards = page.locator('[data-testid="project-card"]');
    await expect(projectCards.first()).toBeVisible();
  });

  test('should show usage stats', async ({ page }) => {
    await page.goto('/dashboard');

    const usageStats = page.locator('[data-testid="usage-stats"]');
    await expect(usageStats).toBeVisible();
  });
});
```

### 性能测试

```typescript
// e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('homepage should load within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });

  test('analysis page should be interactive within 5 seconds', async ({ page }) => {
    await page.goto('/analyze/test-id');

    // 等待交互元素可用
    await page.waitForSelector('button:not([disabled])', { timeout: 5000 });
  });

  test('should handle large video upload', async ({ page }) => {
    await page.goto('/upload');

    // 上传大文件
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/large-video.mp4');

    // 验证上传进度显示
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
  });
});
```

---

## Mock 策略

### MSW 设置

```typescript
// tests/mocks/handlers.ts
import { rest } from 'msw';
import { setupServer } from 'msw/node';

export const handlers = [
  rest.post('/api/v1/analyze', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          analysisId: 'test-analysis-id',
          status: 'processing',
          estimatedTime: 30,
        },
      })
    );
  }),

  rest.get('/api/v1/analyze/:id', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          id: req.params.id,
          status: 'completed',
          result: {
            score: { total: 85, grade: 'S' },
          },
        },
      })
    );
  }),
];

export const server = setupServer(...handlers);
```

---

## CI/CD 集成

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install

      - name: Run unit tests
        run: pnpm test:unit --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install

      - name: Install Playwright
        run: pnpm exec playwright install --with-deps

      - name: Run E2E tests
        run: pnpm test:e2e

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## 运行测试

```bash
# 运行所有单元测试
pnpm test

# 运行特定文件
pnpm test color-analyzer.test.ts

# 运行并生成覆盖率
pnpm test --coverage

# 运行 E2E 测试
pnpm test:e2e

# 运行 E2E 测试（UI 模式）
pnpm test:e2e --ui
```

---

## 下一步

- [部署方案](./DEPLOYMENT.md)
- [贡献指南](./CONTRIBUTING.md)
