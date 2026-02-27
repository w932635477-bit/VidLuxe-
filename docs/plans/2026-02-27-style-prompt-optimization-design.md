# 风格选择与 Prompt 优化设计方案

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to implement this design.

**目标：** 优化风格选择 UX，让用户明确了解风格效果，并通过内容类型+风格组合生成精准 Prompt

**方案：** 两步选择流程（内容类型 → 风格）+ 真实对比图 + 智能 Prompt 组合

**设计风格：** Apple 黑金高级感（保持现有设计语言不变）

---

## 1. 设计背景

### 1.1 当前问题

| 问题 | 现状 | 影响 |
|------|------|------|
| 预览图不真实 | 使用 Unsplash 随机图片 | 用户无法看到真实风格效果 |
| Before/After 不对应 | 两张不同图片切换 | 不是真正的效果对比 |
| Prompt 通用化 | 所有内容类型使用相同 Prompt | 生成效果不够精准 |

### 1.2 目标用户

小红书中腰部博主（1-50万粉丝），内容类型：
- 穿搭 / 美妆 / 探店 / 旅游 / 美食

---

## 2. 用户流程设计

```
Step 1: 选择内容类型
┌────────────────────────────────────┐
│  👗穿搭  💄美妆  ☕探店  ✈️旅游  🍽️美食  │  ← 水平 Chip 选择
└────────────────────────────────────┘
              ↓
Step 2: 选择风格（自动加载对应对比图）
┌────────────────────────────────────┐
│  [杂志大片]  [温柔日系]  [都市职场]  [复古胶片]  │  ← 2列网格 + 滑动对比
└────────────────────────────────────┘
              ↓
Step 3: AI 增强
┌────────────────────────────────────┐
│  生成 Prompt = 风格基础词 + 内容增强词 + 质量保证词  │
└────────────────────────────────────┘
```

---

## 3. 内容类型定义

### 3.1 内容类型枚举

```typescript
type ContentType = 'outfit' | 'beauty' | 'cafe' | 'travel' | 'food';

interface ContentTypeConfig {
  id: ContentType;
  name: string;
  icon: string;
  description: string;
  keywords: string;        // Prompt 增强词
  negativeKeywords: string;
  suitableStyles: PresetStyle[];
}
```

### 3.2 内容类型配置

| 类型 | 名称 | 图标 | Prompt 增强词 |
|------|------|------|---------------|
| outfit | 穿搭 | 👗 | fashion photography, outfit details, street style, clothing texture, model pose |
| beauty | 美妆 | 💄 | beauty close-up, makeup details, skin texture, glamour lighting, portrait |
| cafe | 探店 | ☕ | interior atmosphere, cozy vibe, lifestyle photography, ambient lighting, cafe aesthetic |
| travel | 旅游 | ✈️ | travel photography, landscape, scenic view, adventure, destination |
| food | 美食 | 🍽️ | food photography, appetizing, warm lighting, gourmet, culinary art |

---

## 4. 风格 + 内容类型 Prompt 矩阵

### 4.1 Prompt 组合公式

```
最终 Prompt = 风格基础词 + 内容类型增强词 + 质量保证词
```

### 4.2 矩阵示例

| 内容类型 \ 风格 | 杂志大片 | 温柔日系 | 都市职场 | 复古胶片 |
|----------------|----------|----------|----------|----------|
| **穿搭** | ✅ 高街时尚杂志风 | ✅ 日系穿搭博主 | ✅ 都市通勤穿搭 | ✅ 复古街头风 |
| **美妆** | ✅ 时尚美妆大片 | ✅ 清透日系妆容 | ⚠️ 较少使用 | ⚠️ 较少使用 |
| **探店** | ⚠️ 较少使用 | ✅ 日系生活方式 | ✅ 专业空间摄影 | ✅ 复古胶片探店 |
| **旅游** | ⚠️ 较少使用 | ✅ 日系旅行 | ⚠️ 较少使用 | ✅ 复古旅行记录 |
| **美食** | ✅ 美食杂志 | ✅ 日系美食摄影 | ⚠️ 较少使用 | ✅ 复古美食 |

### 4.3 对比图资源映射

使用现有 `/public/comparisons/` 资源：

| 内容类型 | 对比图资源 |
|----------|-----------|
| 穿搭 | fashion-1-original.jpg / fashion-1-enhanced.jpg |
| 美妆 | hero-beauty-before.jpg / hero-beauty-after.jpg |
| 探店 | cafe-1-original.jpg / cafe-1-enhanced.jpg |
| 美食 | food-1-original.jpg / food-1-enhanced.jpg |
| 通用 | lifestyle-1, portrait-1, product-1 |

---

## 5. UI 组件设计

### 5.1 设计 Token（复用现有）

```css
/* 复用 globals.css 中的变量 */
--brand-primary: #D4AF37;
--bg-card: rgba(255, 255, 255, 0.03);
--border-subtle: rgba(255, 255, 255, 0.06);
--radius-full: 980px;
--radius-2xl: 24px;
--duration-normal: 200ms;
--ease-apple: cubic-bezier(0.25, 0.1, 0.25, 1);
--shadow-glow: 0 0 24px rgba(212, 175, 55, 0.3);
```

### 5.2 ContentTypeSelector 组件

```tsx
// 内容类型 Chip 样式
const CHIP_STYLES = {
  base: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px 20px',
    borderRadius: 'var(--radius-2xl)', // 24px
    border: '1px solid var(--border-subtle)',
    background: 'var(--bg-card)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all var(--duration-normal) var(--ease-apple)',
    minWidth: '80px',
  },
  selected: {
    border: '1px solid var(--brand-primary)',
    background: 'rgba(212, 175, 55, 0.08)',
    color: 'var(--brand-primary)',
    boxShadow: '0 0 0 3px rgba(212, 175, 55, 0.15)',
  },
  hover: {
    transform: 'translateY(-2px)',
    boxShadow: 'var(--shadow-md)',
  }
};
```

### 5.3 StyleCardWithComparison 组件

```tsx
// 复用现有 .comparison-slider 样式
// 扩展 StyleCard 组件添加滑动对比功能

interface StyleCardWithComparisonProps {
  style: StylePreset;
  contentType: ContentType;
  isSelected: boolean;
  onSelect: () => void;
}

// 对比图根据 contentType 动态加载
// 使用 react-compare-slider 或自定义实现
```

### 5.4 组件结构

```
StyleSelector.tsx (重构)
├── ContentTypeSelector (新增)
│   ├── ContentTypeChip × 5
│   └── 水平滚动容器
├── StyleSelectorEnhanced (增强)
│   ├── 标题 + 说明
│   └── StyleCardWithComparison × 4
│       ├── ComparisonSlider
│       │   ├── BeforeImage
│       │   ├── AfterImage
│       │   └── SliderHandle
│       ├── StyleInfo (名称 + 标签)
│       └── SelectionIndicator
└── 导出函数
    ├── getStylePreset()
    ├── getContentTypeConfig()
    └── buildEnhancedPrompt()
```

---

## 6. Prompt 构建系统

### 6.1 核心函数

```typescript
/**
 * 构建增强版 Prompt
 * @param style 风格类型
 * @param contentType 内容类型
 * @returns 完整的 Prompt 字符串
 */
function buildEnhancedPrompt(
  style: PresetStyle,
  contentType: ContentType
): string {
  const styleConfig = STYLE_PRESETS[style];
  const contentConfig = CONTENT_TYPE_ENHANCERS[contentType];

  const stylePrompt = styleConfig.prompt;
  const contentKeywords = contentConfig.keywords;
  const qualityPrompt = '8K, high resolution, professional photography, premium quality';

  return `${stylePrompt}, ${contentKeywords}, ${qualityPrompt}`;
}

/**
 * 构建负面 Prompt
 */
function buildNegativePrompt(
  style: PresetStyle,
  contentType: ContentType
): string {
  const styleConfig = STYLE_PRESETS[style];
  const contentConfig = CONTENT_TYPE_ENHANCERS[contentType];

  const styleNegative = styleConfig.negativePrompt;
  const contentNegative = contentConfig.negativeKeywords;

  return `${styleNegative}, ${contentNegative}`;
}
```

### 6.2 质量保证词

```
// 通用质量词（所有 Prompt 末尾添加）
8K, high resolution, professional photography, premium quality, sharp details
```

---

## 7. 交互设计

### 7.1 内容类型选择

| 交互 | 效果 |
|------|------|
| 点击 Chip | 选中状态（金色边框 + 背景高亮） |
| 悬停 Chip | 微微上浮 + 阴影增强 |
| 选中后 | 自动滚动到风格选择区域 |

### 7.2 风格选择

| 交互 | 效果 |
|------|------|
| 悬停卡片 | 显示 After 图片（对比效果） |
| 滑动对比 | 可拖动滑块查看 Before/After |
| 点击卡片 | 选中状态（金色边框 + 光晕） |
| 选中后 | 显示确认按钮 |

### 7.3 动画规范

| 动画 | 时长 | 缓动函数 |
|------|------|----------|
| Chip 选中 | 200ms | var(--ease-apple) |
| 卡片悬停 | 200ms | var(--ease-apple) |
| 图片切换 | 500ms | ease |
| 滑块拖动 | 实时 | - |

---

## 8. 文件修改清单

### 8.1 新增文件

| 文件 | 说明 |
|------|------|
| `lib/content-types.ts` | 内容类型配置和 Prompt 增强词 |
| `components/features/try/ContentTypeSelector.tsx` | 内容类型选择器组件 |

### 8.2 修改文件

| 文件 | 修改内容 |
|------|----------|
| `lib/style-prompts.ts` | 添加 buildEnhancedPrompt 函数 |
| `components/features/try/StyleSelector.tsx` | 重构为两步流程，添加对比滑块 |
| `components/features/try/flows/VideoFlow/index.tsx` | 集成新的风格选择流程 |
| `components/features/try/flows/ImageSingleFlow/index.tsx` | 集成新的风格选择流程 |
| `components/features/try/flows/ImageBatchFlow/index.tsx` | 集成新的风格选择流程 |

### 8.3 资源文件

| 文件 | 说明 |
|------|------|
| `public/comparisons/config.json` | 更新对比图配置 |
| `public/comparisons/*.jpg` | 确保对比图资源存在 |

---

## 9. 技术实现要点

### 9.1 对比滑块

- **方案：** 自定义实现（复用 globals.css 中的 `.comparison-slider`）
- **备选：** react-compare-slider 库
- **理由：** 保持设计风格一致，避免引入新依赖

### 9.2 状态管理

```typescript
// 在各 Flow 组件中管理状态
const [selectedContentType, setSelectedContentType] = useState<ContentType>('outfit');
const [selectedStyle, setSelectedStyle] = useState<StyleType>('magazine');

// 构建 Prompt 时使用
const prompt = buildEnhancedPrompt(selectedStyle, selectedContentType);
```

### 9.3 响应式设计

- 内容类型选择器：水平滚动，触摸友好
- 风格卡片：2列网格，移动端最佳
- 触摸区域：≥44px（符合 Apple 规范）

---

## 10. 测试要点

### 10.1 功能测试

- [ ] 内容类型选择正确切换
- [ ] 风格对比图根据内容类型动态加载
- [ ] Prompt 组合正确生成
- [ ] 滑动对比功能正常

### 10.2 UI 测试

- [ ] 选中状态视觉反馈正确
- [ ] 动画流畅
- [ ] 响应式布局正确
- [ ] 无障碍访问（键盘导航、屏幕阅读器）

### 10.3 边界情况

- [ ] 未选择内容类型时的默认行为
- [ ] 不兼容的内容类型+风格组合提示
- [ ] 对比图加载失败的降级处理

---

## 11. 成功指标

| 指标 | 目标 |
|------|------|
| 用户选择时间 | < 10秒 |
| 风格理解准确率 | > 90%（用户知道选的是什么） |
| Prompt 生成满意度 | > 85% |
| 功能使用率 | > 80% 用户完成两步选择 |

---

## 12. 后续优化方向

1. **AI 自动识别内容类型** - 减少用户操作步骤
2. **更多风格预设** - 根据用户反馈扩展
3. **自定义 Prompt 编辑** - 高级用户可微调
4. **风格收藏功能** - 保存常用风格组合

---

**文档版本：** 1.0
**创建日期：** 2026-02-27
**作者：** Claude + User
