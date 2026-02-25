# 品类与风格提示词设计

## 概述

基于 MidJourney 和 Stable Diffusion 社区的最佳实践，设计 VidLuxe 的品类特定提示词系统。

## 设计原则

参考资源：
- [MidJourney-Styles-and-Keywords-Reference](https://github.com/willwulfken/MidJourney-Styles-and-Keywords-Reference) (12.3k stars)
- [stable-diffusion-prompt-templates](https://github.com/Dalabad/stable-diffusion-prompt-templates)

关键原则：
1. **分层结构**：主体描述 + 风格修饰 + 技术参数
2. **品类优先**：不同品类需要不同的基础修饰词
3. **风格叠加**：风格是在品类基础上的视觉呈现
4. **种草力增强**：针对小红书平台优化

---

## 品类修饰词设计

### 1. 穿搭 (fashion)

```typescript
const fashionModifiers = {
  base: [
    'fashion photography',
    'editorial style',
    'professional model pose',
  ],
  lighting: [
    'soft studio lighting',
    'natural daylight',
    'golden hour glow',
  ],
  details: [
    'texture detail',
    'fabric close-up',
    'outfit showcase',
  ],
  mood: [
    'elegant and confident',
    'effortless chic',
    'sophisticated minimal',
  ],
};
```

**推荐风格**：
- `minimal` - 极简风格，突出服装本身
- `magazine` - 杂志封面感
- `urban` - 城市街拍感

### 2. 美妆 (beauty)

```typescript
const beautyModifiers = {
  base: [
    'beauty photography',
    'macro beauty shot',
    'flawless skin',
  ],
  lighting: [
    'ring light',
    'soft diffused light',
    'beauty dish lighting',
  ],
  details: [
    'makeup detail',
    'skin texture',
    'product close-up',
  ],
  mood: [
    'radiant glow',
    'fresh and natural',
    'glamorous finish',
  ],
};
```

**推荐风格**：
- `soft` - 柔和自然
- `minimal` - 干净专业
- `warmLuxury` - 奢华质感

### 3. 美食 (food)

```typescript
const foodModifiers = {
  base: [
    'food photography',
    'culinary art',
    'appetizing presentation',
  ],
  lighting: [
    'soft window light',
    'backlit glow',
    'warm ambient light',
  ],
  details: [
    'texture detail',
    'steam rising',
    'fresh ingredients',
  ],
  mood: [
    'cozy and inviting',
    'fresh and vibrant',
    'elegant dining',
  ],
};
```

**推荐风格**：
- `warmLuxury` - 温暖诱人
- `morandi` - 高级冷淡
- `soft` - 自然清新

### 4. 探店 (cafe)

```typescript
const cafeModifiers = {
  base: [
    'interior photography',
    'lifestyle shot',
    'atmospheric space',
  ],
  lighting: [
    'natural window light',
    'warm cafe lighting',
    'cozy ambient',
  ],
  details: [
    'interior design detail',
    'coffee art close-up',
    'decor elements',
  ],
  mood: [
    'cozy and welcoming',
    'aesthetic minimal',
    'relaxed ambiance',
  ],
};
```

**推荐风格**：
- `morandi` - 高级灰色调
- `minimal` - 干净整洁
- `soft` - 温馨舒适

### 5. 家居 (home)

```typescript
const homeModifiers = {
  base: [
    'interior design photography',
    'home decor showcase',
    'architectural detail',
  ],
  lighting: [
    'natural daylight',
    'warm home lighting',
    'soft shadows',
  ],
  details: [
    'texture material',
    'decor arrangement',
    'plant accents',
  ],
  mood: [
    'calm and serene',
    'modern minimalist',
    'warm and lived-in',
  ],
};
```

**推荐风格**：
- `minimal` - 现代极简
- `morandi` - 高级灰
- `warmLuxury` - 温暖奢华

### 6. 旅行 (travel)

```typescript
const travelModifiers = {
  base: [
    'travel photography',
    'destination showcase',
    'landscape vista',
  ],
  lighting: [
    'golden hour',
    'blue hour',
    'dramatic sky',
  ],
  details: [
    'scenic view',
    'local culture',
    'adventure moment',
  ],
  mood: [
    'wanderlust',
    'serene and peaceful',
    'adventurous spirit',
  ],
};
```

**推荐风格**：
- `soft` - 自然柔和
- `warmLuxury` - 金色温暖
- `minimal` - 干净画面

### 7. 数码 (tech)

```typescript
const techModifiers = {
  base: [
    'product photography',
    'tech gadget showcase',
    'clean background',
  ],
  lighting: [
    'studio lighting',
    'gradient reflection',
    'subtle rim light',
  ],
  details: [
    'product detail',
    'screen display',
    'material finish',
  ],
  mood: [
    'modern and sleek',
    'professional tech',
    'premium quality',
  ],
};
```

**推荐风格**：
- `minimal` - 干净专业
- `coolPro` - 科技冷调
- `urban` - 城市现代

### 8. 健身 (fitness)

```typescript
const fitnessModifiers = {
  base: [
    'fitness photography',
    'athletic portrait',
    'dynamic movement',
  ],
  lighting: [
    'dramatic lighting',
    'gym lighting',
    'natural outdoor',
  ],
  details: [
    'muscle definition',
    'form technique',
    'equipment detail',
  ],
  mood: [
    'energetic and powerful',
    'healthy and fit',
    'motivated and strong',
  ],
};
```

**推荐风格**：
- `coolPro` - 专业运动
- `urban` - 城市街头
- `minimal` - 干净画面

---

## 风格与品类推荐映射

```typescript
const styleRecommendations: Record<CategoryType, MultiStyleType[]> = {
  fashion: ['minimal', 'magazine', 'urban'],
  beauty: ['soft', 'minimal', 'warmLuxury'],
  food: ['warmLuxury', 'morandi', 'soft'],
  cafe: ['morandi', 'minimal', 'soft'],
  home: ['minimal', 'morandi', 'warmLuxury'],
  travel: ['soft', 'warmLuxury', 'minimal'],
  tech: ['minimal', 'coolPro', 'urban'],
  fitness: ['coolPro', 'urban', 'minimal'],
};
```

---

## 提示词构建函数

```typescript
function buildPrompt(
  category: CategoryType,
  seedingType: SeedingType,
  style: MultiStyleType,
  userDescription?: string
): string {
  const parts: string[] = [];

  // 1. 主体描述（基于种草类型）
  parts.push(getSeedingTypePrompt(seedingType));

  // 2. 品类修饰词
  const categoryMods = categoryModifiers[category];
  parts.push(...categoryMods.base);
  parts.push(...categoryMods.lighting);

  // 3. 风格修饰词
  parts.push(...getStyleModifiers(style));

  // 4. 用户自定义描述（如果有）
  if (userDescription) {
    parts.push(userDescription);
  }

  // 5. 质量提升词
  parts.push('high quality', 'professional', '8k resolution');

  return parts.join(', ');
}
```

---

## 实现计划

1. 创建 `lib/category-modifiers.ts` - 品类修饰词定义
2. 更新 `lib/style-prompts.ts` - 集成品类逻辑
3. 更新 `components/features/try/steps/StyleStep.tsx` - 显示推荐风格
4. 更新 API 调用 - 传递品类信息

## 下一步

确认此设计方案后，我将：
1. 创建品类修饰词文件
2. 更新提示词构建逻辑
3. 在 StyleStep 中显示基于品类的推荐风格
