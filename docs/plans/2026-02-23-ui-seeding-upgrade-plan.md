# UI 种草力升级实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将体验页从 4 步升级为 5 步流程，新增 AI 识别步骤，评分系统从 4 维高级感评分升级为 5 维种草力评分。

**Architecture:** 在现有 TryPage 基础上新增 Step 2（AI 识别），调整状态管理支持新的品类和种草类型选择，复用现有 Apple 风格设计系统。

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS

---

## Phase 1: 类型定义与配置

### Task 1: 创建种草类型定义

**Files:**
- Create: `apps/web/lib/types/seeding.ts`

**Step 1: 创建类型定义文件**

```typescript
// apps/web/lib/types/seeding.ts

// 品类类型 (8种)
export type CategoryType =
  | 'fashion'   // 穿搭
  | 'beauty'    // 美妆
  | 'food'      // 美食
  | 'cafe'      // 探店
  | 'home'      // 家居
  | 'travel'    // 旅行
  | 'tech'      // 数码
  | 'fitness';  // 健身

// 种草类型 (3种)
export type SeedingType =
  | 'product'      // 种草商品 - 让读者想买
  | 'location'     // 种草地点 - 让读者想去
  | 'lifestyle';   // 种草生活方式 - 让读者想成为

// 品类配置
export interface CategoryConfig {
  id: CategoryType;
  label: string;
  icon: string;
}

// 种草类型配置
export interface SeedingTypeConfig {
  id: SeedingType;
  label: string;
  description: string;
  enhancementFocus: string;
}

// AI 识别结果
export interface AIRecognitionResult {
  category: CategoryType;
  categoryConfidence: number;
  seedingType: SeedingType;
  seedingTypeConfidence: number;
  suggestedStyles: string[];
}

// 种草力评分 (5维)
export interface SeedingScore {
  overall: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  dimensions: {
    visualAttraction: number;    // 视觉吸引力 30%
    contentMatch: number;        // 内容匹配度 25%
    authenticity: number;        // 真实可信度 20%
    emotionalImpact: number;     // 情绪感染力 15%
    actionGuidance: number;      // 行动引导力 10%
  };
}
```

**Step 2: 验证文件创建成功**

Run: `ls -la apps/web/lib/types/`
Expected: 看到 `seeding.ts` 文件

**Step 3: Commit**

```bash
git add apps/web/lib/types/seeding.ts
git commit -m "feat: add seeding types definition"
```

---

### Task 2: 创建种草配置文件

**Files:**
- Create: `apps/web/lib/config/seeding.ts`

**Step 1: 创建配置文件**

```typescript
// apps/web/lib/config/seeding.ts

import type { CategoryConfig, SeedingTypeConfig, CategoryType, SeedingType } from '@/lib/types/seeding';

// 品类配置
export const CATEGORIES: CategoryConfig[] = [
  { id: 'fashion', label: '穿搭', icon: '👗' },
  { id: 'beauty', label: '美妆', icon: '💄' },
  { id: 'food', label: '美食', icon: '🍽️' },
  { id: 'cafe', label: '探店', icon: '☕' },
  { id: 'home', label: '家居', icon: '🏠' },
  { id: 'travel', label: '旅行', icon: '✈️' },
  { id: 'tech', label: '数码', icon: '📱' },
  { id: 'fitness', label: '健身', icon: '💪' },
];

// 种草类型配置
export const SEEDING_TYPES: SeedingTypeConfig[] = [
  {
    id: 'product',
    label: '种草商品',
    description: '让读者想买',
    enhancementFocus: '突出产品、展示细节、强调质感',
  },
  {
    id: 'location',
    label: '种草地点',
    description: '让读者想去',
    enhancementFocus: '突出氛围、场景感、代入感',
  },
  {
    id: 'lifestyle',
    label: '种草生活方式',
    description: '让读者想成为',
    enhancementFocus: '突出理想感、真实感、共鸣感',
  },
];

// 获取品类配置
export function getCategoryConfig(id: CategoryType): CategoryConfig | undefined {
  return CATEGORIES.find(c => c.id === id);
}

// 获取种草类型配置
export function getSeedingTypeConfig(id: SeedingType): SeedingTypeConfig | undefined {
  return SEEDING_TYPES.find(s => s.id === id);
}

// 根据品类+种草类型推荐风格
export function getRecommendedStyles(category: CategoryType, seedingType: SeedingType): string[] {
  // 简单推荐逻辑，后续可优化
  const styleMap: Record<string, string[]> = {
    'fashion-product': ['magazine', 'warmLuxury'],
    'fashion-lifestyle': ['morandi', 'magazine'],
    'beauty-product': ['warmLuxury', 'minimal'],
    'beauty-lifestyle': ['minimal', 'morandi'],
    'food-product': ['warmLuxury', 'magazine'],
    'food-location': ['morandi', 'warmLuxury'],
    'cafe-location': ['morandi', 'coolPro'],
    'cafe-lifestyle': ['morandi', 'minimal'],
    'home-lifestyle': ['morandi', 'minimal'],
    'travel-location': ['magazine', 'morandi'],
    'travel-lifestyle': ['morandi', 'magazine'],
    'tech-product': ['minimal', 'coolPro'],
    'fitness-lifestyle': ['coolPro', 'minimal'],
  };

  const key = `${category}-${seedingType}`;
  return styleMap[key] || ['magazine', 'minimal'];
}
```

**Step 2: 验证文件创建成功**

Run: `ls -la apps/web/lib/config/`
Expected: 看到 `seeding.ts` 文件（如果没有 config 目录则创建）

**Step 3: Commit**

```bash
git add apps/web/lib/config/seeding.ts
git commit -m "feat: add seeding configuration and helper functions"
```

---

## Phase 2: 新增组件

### Task 3: 创建品类选择器组件

**Files:**
- Create: `apps/web/components/features/try/CategorySelector.tsx`

**Step 1: 创建品类选择器组件**

```typescript
// apps/web/components/features/try/CategorySelector.tsx

'use client';

import type { CategoryType } from '@/lib/types/seeding';
import { CATEGORIES } from '@/lib/config/seeding';

const APPLE_EASE = 'cubic-bezier(0.25, 0.1, 0.25, 1)';

interface CategorySelectorProps {
  selected: CategoryType | null;
  onChange: (category: CategoryType) => void;
  aiSuggested?: CategoryType | null;
}

export function CategorySelector({ selected, onChange, aiSuggested }: CategorySelectorProps) {
  return (
    <div>
      <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '12px' }}>
        品类
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {CATEGORIES.map((cat) => {
          const isSelected = selected === cat.id;
          const isAiSuggested = aiSuggested === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onChange(cat.id)}
              style={{
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: 500,
                borderRadius: '980px',
                border: isAiSuggested && !isSelected
                  ? '1px dashed rgba(212, 175, 55, 0.5)'
                  : '1px solid transparent',
                cursor: 'pointer',
                transition: `all 0.3s ${APPLE_EASE}`,
                background: isSelected
                  ? '#D4AF37'
                  : isAiSuggested
                  ? 'rgba(212, 175, 55, 0.1)'
                  : 'rgba(255, 255, 255, 0.05)',
                color: isSelected
                  ? '#000000'
                  : isAiSuggested
                  ? '#D4AF37'
                  : 'rgba(255, 255, 255, 0.7)',
              }}
            >
              <span style={{ marginRight: '6px' }}>{cat.icon}</span>
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/components/features/try/CategorySelector.tsx
git commit -m "feat: add CategorySelector component"
```

---

### Task 4: 创建种草类型选择器组件

**Files:**
- Create: `apps/web/components/features/try/SeedingTypeSelector.tsx`

**Step 1: 创建种草类型选择器组件**

```typescript
// apps/web/components/features/try/SeedingTypeSelector.tsx

'use client';

import type { SeedingType } from '@/lib/types/seeding';
import { SEEDING_TYPES } from '@/lib/config/seeding';

const APPLE_EASE = 'cubic-bezier(0.25, 0.1, 0.25, 1)';

interface SeedingTypeSelectorProps {
  selected: SeedingType | null;
  onChange: (type: SeedingType) => void;
  aiSuggested?: SeedingType | null;
}

export function SeedingTypeSelector({ selected, onChange, aiSuggested }: SeedingTypeSelectorProps) {
  return (
    <div>
      <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '12px' }}>
        目的
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {SEEDING_TYPES.map((type) => {
          const isSelected = selected === type.id;
          const isAiSuggested = aiSuggested === type.id;

          return (
            <button
              key={type.id}
              onClick={() => onChange(type.id)}
              style={{
                padding: '16px 20px',
                borderRadius: '16px',
                border: isAiSuggested && !isSelected
                  ? '1px dashed rgba(212, 175, 55, 0.5)'
                  : isSelected
                  ? '1px solid #D4AF37'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                transition: `all 0.3s ${APPLE_EASE}`,
                background: isSelected
                  ? 'rgba(212, 175, 55, 0.15)'
                  : 'rgba(255, 255, 255, 0.03)',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: 500,
                    color: isSelected ? '#D4AF37' : 'rgba(255, 255, 255, 0.9)',
                    marginBottom: '4px',
                  }}>
                    {type.label}
                    {isAiSuggested && (
                      <span style={{
                        marginLeft: '8px',
                        fontSize: '11px',
                        color: '#D4AF37',
                        padding: '2px 8px',
                        background: 'rgba(212, 175, 55, 0.15)',
                        borderRadius: '4px',
                      }}>
                        AI 推荐
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>
                    {type.description}
                  </div>
                </div>
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: isSelected ? 'none' : '2px solid rgba(255, 255, 255, 0.2)',
                    background: isSelected ? '#D4AF37' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {isSelected && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12L10 17L19 8" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/components/features/try/SeedingTypeSelector.tsx
git commit -m "feat: add SeedingTypeSelector component"
```

---

### Task 5: 创建种草力评分卡片组件

**Files:**
- Create: `apps/web/components/features/try/SeedingScoreCard.tsx`

**Step 1: 创建种草力评分卡片组件**

```typescript
// apps/web/components/features/try/SeedingScoreCard.tsx

'use client';

import type { SeedingScore } from '@/lib/types/seeding';

interface SeedingScoreCardProps {
  score: SeedingScore;
}

const DIMENSION_LABELS: Record<string, { label: string; weight: string }> = {
  visualAttraction: { label: '视觉吸引力', weight: '30%' },
  contentMatch: { label: '内容匹配度', weight: '25%' },
  authenticity: { label: '真实可信度', weight: '20%' },
  emotionalImpact: { label: '情绪感染力', weight: '15%' },
  actionGuidance: { label: '行动引导力', weight: '10%' },
};

const GRADE_LABELS: Record<string, string> = {
  S: '完美',
  A: '优秀',
  B: '良好',
  C: '一般',
  D: '需改进',
};

export function SeedingScoreCard({ score }: SeedingScoreCardProps) {
  const dimensions = Object.entries(score.dimensions).map(([key, value]) => ({
    key,
    ...DIMENSION_LABELS[key],
    score: value,
  }));

  return (
    <div
      style={{
        padding: '20px',
        borderRadius: '20px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* 总分区域 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>
            种草力评分
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '36px', fontWeight: 600, color: '#D4AF37', letterSpacing: '-0.02em' }}>
              {score.overall}
            </span>
            <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)' }}>/ 100</span>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '100px',
            background: 'rgba(212, 175, 55, 0.15)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
          }}
        >
          <span style={{ fontSize: '20px', fontWeight: 700, color: '#D4AF37' }}>
            {score.grade}
          </span>
          <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
            {GRADE_LABELS[score.grade]}
          </span>
        </div>
      </div>

      {/* 维度分数 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {dimensions.map((dim) => (
          <div key={dim.key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', width: '72px', flexShrink: 0 }}>
              {dim.label}
            </span>
            <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${dim.score}%`,
                  height: '100%',
                  borderRadius: '2px',
                  background: dim.score >= 80 ? '#D4AF37' : dim.score >= 60 ? '#B8962E' : '#8E8E93',
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#D4AF37', width: '28px', textAlign: 'right' }}>
              {dim.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/components/features/try/SeedingScoreCard.tsx
git commit -m "feat: add SeedingScoreCard component for 5-dimension scoring"
```

---

## Phase 3: 修改体验页主流程

### Task 6: 更新 TryPage 为 5 步流程

**Files:**
- Modify: `apps/web/app/try/page.tsx`

**Step 1: 添加新状态和导入**

在文件顶部添加新的导入和类型：

```typescript
// 添加到现有导入之后
import type { CategoryType, SeedingType, SeedingScore } from '@/lib/types/seeding';
import { getRecommendedStyles, getCategoryConfig, getSeedingTypeConfig } from '@/lib/config/seeding';
import { CategorySelector } from '@/components/features/try/CategorySelector';
import { SeedingTypeSelector } from '@/components/features/try/SeedingTypeSelector';
import { SeedingScoreCard } from '@/components/features/try/SeedingScoreCard';
```

**Step 2: 更新 Step 类型**

```typescript
// 修改 Step 类型
type Step = 'upload' | 'recognition' | 'style' | 'processing' | 'result';
```

**Step 3: 添加新状态变量**

在 TryPage 组件内添加新状态：

```typescript
// 品类和种草类型
const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
const [selectedSeedingType, setSelectedSeedingType] = useState<SeedingType | null>(null);

// AI 识别结果
const [aiRecognition, setAiRecognition] = useState<{
  category: CategoryType;
  seedingType: SeedingType;
} | null>(null);
```

**Step 4: 更新 StepIndicator 组件**

将 steps 数组更新为 5 步：

```typescript
const steps = [
  { id: 'upload', label: '上传' },
  { id: 'recognition', label: '识别' },
  { id: 'style', label: '风格' },
  { id: 'processing', label: '处理' },
  { id: 'result', label: '完成' },
];
```

**Step 5: 添加 AI 识别步骤 (Step 2)**

在上传步骤之后、风格步骤之前添加新的识别步骤：

```typescript
{/* ===== 步骤 2: AI 识别 ===== */}
{step === 'recognition' && previewUrl && (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '80px 24px 40px',
      maxWidth: '480px',
      margin: '0 auto',
    }}
  >
    <StepIndicator currentStep="recognition" />

    {/* 预览图 */}
    <div style={{ marginBottom: '24px' }}>
      <div
        style={{
          position: 'relative',
          borderRadius: '16px',
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {contentType === 'video' ? (
          <video
            src={previewUrl}
            style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', display: 'block' }}
            muted autoPlay loop playsInline
          />
        ) : (
          <img
            src={previewUrl}
            alt="预览"
            style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', display: 'block' }}
          />
        )}
      </div>
    </div>

    {/* AI 识别提示 */}
    <div
      style={{
        padding: '16px 20px',
        borderRadius: '16px',
        background: 'rgba(212, 175, 55, 0.06)',
        border: '1px solid rgba(212, 175, 55, 0.12)',
        marginBottom: '24px',
      }}
    >
      <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
        💡 <span style={{ color: '#D4AF37' }}>AI 识别结果</span> - 请确认或修改
      </p>
    </div>

    {/* 品类选择 */}
    <div style={{ marginBottom: '24px' }}>
      <CategorySelector
        selected={selectedCategory}
        onChange={setSelectedCategory}
        aiSuggested={aiRecognition?.category}
      />
    </div>

    {/* 种草类型选择 */}
    <div style={{ flex: 1, marginBottom: '24px' }}>
      <SeedingTypeSelector
        selected={selectedSeedingType}
        onChange={setSelectedSeedingType}
        aiSuggested={aiRecognition?.seedingType}
      />
    </div>

    {/* 操作按钮 */}
    <div style={{ display: 'flex', gap: '12px' }}>
      <button
        onClick={() => setStep('upload')}
        style={{
          flex: 1,
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          background: 'transparent',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '17px',
          cursor: 'pointer',
        }}
      >
        重新上传
      </button>
      <button
        onClick={() => {
          if (selectedCategory && selectedSeedingType) {
            setStep('style');
          }
        }}
        disabled={!selectedCategory || !selectedSeedingType}
        style={{
          flex: 2,
          padding: '16px',
          borderRadius: '12px',
          border: 'none',
          background: !selectedCategory || !selectedSeedingType ? '#8E8E93' : '#D4AF37',
          color: '#000000',
          fontSize: '17px',
          fontWeight: 600,
          cursor: !selectedCategory || !selectedSeedingType ? 'not-allowed' : 'pointer',
        }}
      >
        确认，下一步
      </button>
    </div>
  </div>
)}
```

**Step 6: 更新上传成功后的跳转**

修改 handleFileChange 函数，上传成功后跳转到 recognition 而不是 style：

```typescript
// 修改这一行
setStep('style');
// 改为
setStep('recognition');

// 并添加模拟的 AI 识别结果
setAiRecognition({
  category: 'beauty', // 默认模拟值
  seedingType: 'product',
});
setSelectedCategory('beauty');
setSelectedSeedingType('product');
```

**Step 7: 更新结果页使用 SeedingScoreCard**

将原有的评分展示替换为 SeedingScoreCard：

```typescript
{/* 评分区域 - 使用新的种草力评分卡片 */}
{resultData.score && (
  <SeedingScoreCard score={resultData.score as SeedingScore} />
)}
```

**Step 8: Commit**

```bash
git add apps/web/app/try/page.tsx
git commit -m "feat: upgrade TryPage to 5-step flow with AI recognition"
```

---

## Phase 4: 更新 API 类型

### Task 7: 更新 API 响应类型支持种草力评分

**Files:**
- Modify: `apps/web/app/try/page.tsx` (TaskStatusResponse 类型)

**Step 1: 更新 TaskStatusResponse 类型**

```typescript
interface TaskStatusResponse {
  success: boolean;
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStage?: string;
  result?: {
    type: ContentType;
    enhancedUrl: string;
    originalUrl: string;
    score?: {
      overall: number;
      grade: string;
      dimensions: {
        visualAttraction: number;    // 视觉吸引力
        contentMatch: number;        // 内容匹配度
        authenticity: number;        // 真实可信度
        emotionalImpact: number;     // 情绪感染力
        actionGuidance: number;      // 行动引导力
      };
    };
  };
  error?: string;
}
```

**Step 2: Commit**

```bash
git add apps/web/app/try/page.tsx
git commit -m "feat: update TaskStatusResponse to support seeding score"
```

---

## Phase 5: 测试与验证

### Task 8: 验证完整流程

**Step 1: 启动开发服务器**

Run: `cd /Users/weilei/VidLuxe && pnpm web`

**Step 2: 手动测试流程**

1. 访问 http://localhost:3000/try
2. 上传一张图片
3. 验证跳转到 Step 2 (AI 识别)
4. 确认品类和种草类型可选择
5. 点击"确认，下一步"进入 Step 3
6. 验证风格选择正常
7. 点击"开始升级"进入处理流程

**Step 3: 检查 TypeScript 编译**

Run: `cd /Users/weilei/VidLuxe/apps/web && npx tsc --noEmit`
Expected: 无错误

**Step 4: Commit (如果有修改)**

```bash
git add -A
git commit -m "fix: resolve TypeScript errors in TryPage"
```

---

## 完成检查清单

- [ ] 类型定义文件 `lib/types/seeding.ts` 已创建
- [ ] 配置文件 `lib/config/seeding.ts` 已创建
- [ ] CategorySelector 组件已创建
- [ ] SeedingTypeSelector 组件已创建
- [ ] SeedingScoreCard 组件已创建
- [ ] TryPage 已升级为 5 步流程
- [ ] Step 2 (AI 识别) 正常工作
- [ ] TypeScript 编译无错误
- [ ] 手动测试流程完整

---

> 计划创建时间：2026-02-23
> 设计文档：`docs/plans/2026-02-23-ui-upgrade-seeding-design.md`
