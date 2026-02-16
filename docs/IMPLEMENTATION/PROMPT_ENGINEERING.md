# Prompt 工程文档

> **版本**: 1.0
> **更新日期**: 2026-02-16
> **状态**: MVP 阶段

## 概述

本文档详细说明 VidLuxe 项目中 Prompt 工程的设计原则、模板系统和优化策略，用于生成具有"高级感"的视觉素材。

## 核心理念

```
"高级感 = 简约 + 精致 + 克制"
```

高级感不是堆砌元素，而是精心设计的克制。好的 Prompt 应该传达这种理念。

---

## 1. 高级感视觉特征

### 1.1 核心视觉元素

**来源**: 基于对高端品牌视觉分析（Apple、Aesop、Celine 等）

```yaml
色彩:
  - 低饱和度: 饱和度 30-50%
  - 高对比度: 明暗对比明显
  - 限定色板: 2-3 种主色
  - 暖色调: 米色、棕色、金色点缀

构图:
  - 负空间: 留白占比 40-60%
  - 黄金比例: 1:1.618
  - 对称/不对称平衡
  - 焦点明确

质感:
  - 材质真实: 皮革、金属、织物纹理
  - 光影柔和: 软光为主
  - 细节精致: 边缘干净

字体（如需要）:
  - 无衬线: Helvetica, SF Pro, Inter
  - 衬线: Georgia, Playfair Display
  - 字重: Light/Medium，避免 Bold
```

### 1.2 避免"廉价感"

```yaml
应避免:
  - 高饱和度颜色（霓虹色）
  - 过多渐变和阴影
  - 复杂背景
  - 过多元素堆砌
  - 夸张特效
  - 不自然的颜色
```

---

## 2. Prompt 设计原则

### 2.1 结构化 Prompt 模板

**参考**: [OpenAI Prompt Engineering Guide](https://platform.openai.com/docs/guides/prompt-engineering)

```typescript
// packages/generator/src/prompt/types.ts

/**
 * Prompt 模板结构
 */
export interface PromptTemplate {
  // 主体描述
  subject: string;

  // 风格描述
  style: StyleDescriptor;

  // 技术参数
  technical: TechnicalParams;

  // 负向提示
  negativePrompt: string[];
}

export interface StyleDescriptor {
  // 整体风格
  aesthetic: 'minimal' | 'cinematic' | 'editorial' | 'luxury';

  // 色调
  colorTone: 'warm' | 'cool' | 'neutral' | 'monochrome';

  // 光线
  lighting: 'soft' | 'dramatic' | 'natural' | 'studio';

  // 氛围
  mood: 'calm' | 'energetic' | 'sophisticated' | 'cozy';
}

export interface TechnicalParams {
  // 画质
  quality: 'high' | 'ultra';

  // 分辨率
  resolution: '1080p' | '2k' | '4k';

  // 宽高比
  aspectRatio: '1:1' | '9:16' | '16:9' | '4:5';
}
```

### 2.2 Prompt 构建器

```typescript
// packages/generator/src/prompt/prompt-builder.ts

/**
 * 高级感 Prompt 构建器
 */
export class PremiumPromptBuilder {
  private static readonly QUALITY_KEYWORDS = [
    'high quality',
    'professional',
    'masterpiece',
    '4k',
    'detailed',
  ];

  private static readonly PREMIUM_KEYWORDS = {
    minimal: [
      'minimalist',
      'clean',
      'simple',
      'elegant',
      'refined',
      'sophisticated',
    ],
    cinematic: [
      'cinematic',
      'film grain',
      'anamorphic',
      'movie still',
      'dramatic lighting',
    ],
    editorial: [
      'editorial',
      'magazine',
      'fashion',
      'vogue',
      'harper\'s bazaar',
    ],
    luxury: [
      'luxury',
      'premium',
      'high-end',
      'exclusive',
      'bespoke',
      'artisanal',
    ],
  };

  private static readonly LIGHTING_STYLES = {
    soft: ['soft lighting', 'diffused light', 'gentle shadows'],
    dramatic: ['dramatic lighting', 'chiaroscuro', 'strong contrast'],
    natural: ['natural light', 'golden hour', 'soft daylight'],
    studio: ['studio lighting', 'professional lighting', 'ring light'],
  };

  private static readonly NEGATIVE_KEYWORDS = [
    'blurry',
    'low quality',
    'pixelated',
    'oversaturated',
    'neon colors',
    'cartoon',
    'anime',
    'illustration',
    'watermark',
    'text',
    'logo',
    'cluttered',
    'messy',
    'distorted',
    'deformed',
    'ugly',
    'bad anatomy',
  ];

  /**
   * 构建背景图 Prompt
   */
  static buildBackgroundPrompt(
    theme: string,
    style: StyleDescriptor
  ): string {
    const parts: string[] = [];

    // 主体
    parts.push(`${theme} background`);

    // 风格关键词
    const styleKeywords = this.PREMIUM_KEYWORDS[style.aesthetic];
    parts.push(styleKeywords.join(', '));

    // 光线
    const lighting = this.LIGHTING_STYLES[style.lighting];
    parts.push(lighting.join(', '));

    // 色调
    parts.push(`${style.colorTone} color palette`);

    // 氛围
    parts.push(`${style.mood} atmosphere`);

    // 质量关键词
    parts.push(...this.QUALITY_KEYWORDS);

    return parts.join(', ');
  }

  /**
   * 构建文字卡片 Prompt
   */
  static buildTextCardPrompt(
    cardType: 'quote' | 'title' | 'highlight',
    style: StyleDescriptor
  ): string {
    const parts: string[] = [];

    // 卡片类型
    parts.push(`${cardType} card design`);

    // 风格
    const styleKeywords = this.PREMIUM_KEYWORDS[style.aesthetic];
    parts.push(styleKeywords.join(', '));

    // 设计元素
    parts.push('clean typography');
    parts.push('negative space');
    parts.push('balanced composition');

    // 质感
    parts.push('subtle gradient');
    parts.push('elegant texture');

    // 质量
    parts.push(...this.QUALITY_KEYWORDS);

    return parts.join(', ');
  }

  /**
   * 构建负向提示
   */
  static buildNegativePrompt(): string {
    return this.NEGATIVE_KEYWORDS.join(', ');
  }
}
```

---

## 3. 场景化 Prompt 模板

### 3.1 口播视频背景

```typescript
// packages/generator/src/prompt/templates/talking-video.ts

/**
 * 口播视频背景 Prompt 模板
 */
export const TalkingVideoPromptTemplates = {
  /**
   * 纯色渐变背景
   */
  gradient: {
    warm: (
      'Minimalist gradient background, warm beige to soft cream, '
      + 'elegant subtle gradient, clean, sophisticated, '
      + 'negative space, professional, high quality'
    ),
    cool: (
      'Minimalist gradient background, cool gray to soft blue, '
      + 'elegant subtle gradient, clean, sophisticated, '
      + 'negative space, professional, high quality'
    ),
    neutral: (
      'Minimalist gradient background, soft white to light gray, '
      + 'elegant subtle gradient, clean, sophisticated, '
      + 'negative space, professional, high quality'
    ),
  },

  /**
   * 纹理背景
   */
  texture: {
    paper: (
      'Premium paper texture background, subtle grain, '
      + 'warm ivory color, minimalist, clean, '
      + 'elegant, professional, high quality'
    ),
    fabric: (
      'Luxury fabric texture background, linen texture, '
      + 'natural beige, soft folds, minimalist, '
      + 'elegant, professional, high quality'
    ),
    marble: (
      'Premium marble texture background, subtle veins, '
      + 'white and gray, luxury, clean, '
      + 'elegant, professional, high quality'
    ),
  },

  /**
   * 抽象背景
   */
  abstract: {
    fluid: (
      'Abstract fluid art background, soft organic shapes, '
      + 'pastel colors, elegant flow, minimalist, '
      + 'sophisticated, professional, high quality'
    ),
    geometric: (
      'Minimalist geometric background, clean lines, '
      + 'subtle shapes, neutral colors, modern, '
      + 'elegant, professional, high quality'
    ),
    bokeh: (
      'Soft bokeh background, out of focus lights, '
      + 'warm golden tones, dreamy, cinematic, '
      + 'elegant, professional, high quality'
    ),
  },

  /**
   * 环境背景
   */
  environment: {
    studio: (
      'Professional studio background, soft lighting, '
      + 'minimalist interior, clean space, '
      + 'elegant, sophisticated, high quality'
    ),
    cafe: (
      'Cozy cafe background, soft natural light, '
      + 'blurred interior, warm atmosphere, '
      + 'elegant, lifestyle, high quality'
    ),
    nature: (
      'Soft nature background, out of focus foliage, '
      + 'gentle light, peaceful atmosphere, '
      + 'natural, elegant, high quality'
    ),
  },
};
```

### 3.2 文字卡片模板

```typescript
// packages/generator/src/prompt/templates/text-card.ts

/**
 * 文字卡片 Prompt 模板
 */
export const TextCardPromptTemplates = {
  /**
   * 引用卡片
   */
  quote: {
    minimal: (
      'Quote card design, minimalist style, '
      + 'clean typography, ample white space, '
      + 'elegant serif font, centered layout, '
      + 'professional, high quality'
    ),
    editorial: (
      'Quote card design, editorial style, '
      + 'magazine layout, elegant typography, '
      + 'subtle decorative elements, '
      + 'sophisticated, high quality'
    ),
    luxury: (
      'Quote card design, luxury style, '
      + 'gold accent, elegant typography, '
      + 'premium feel, sophisticated layout, '
      + 'high quality'
    ),
  },

  /**
   * 标题卡片
   */
  title: {
    bold: (
      'Title card design, bold typography, '
      + 'clean sans-serif font, strong hierarchy, '
      + 'minimalist, modern, professional, high quality'
    ),
    elegant: (
      'Title card design, elegant typography, '
      + 'refined serif font, subtle details, '
      + 'luxury feel, sophisticated, high quality'
    ),
    creative: (
      'Title card design, creative typography, '
      + 'unique layout, artistic elements, '
      + 'modern, stylish, high quality'
    ),
  },

  /**
   * 高亮卡片
   */
  highlight: {
    simple: (
      'Highlight card design, simple frame, '
      + 'clean lines, subtle border, '
      + 'minimalist, elegant, high quality'
    ),
    gradient: (
      'Highlight card design, soft gradient frame, '
      + 'elegant colors, subtle glow, '
      + 'modern, sophisticated, high quality'
    ),
    glass: (
      'Highlight card design, glassmorphism style, '
      + 'frosted glass effect, subtle blur, '
      + 'modern, elegant, high quality'
    ),
  },
};
```

### 3.3 产品展示模板

```typescript
// packages/generator/src/prompt/templates/product.ts

/**
 * 产品展示 Prompt 模板
 */
export const ProductPromptTemplates = {
  /**
   * 产品背景
   */
  background: {
    studio: (
      'Professional product photography background, '
      + 'seamless gradient, soft lighting, '
      + 'clean, minimalist, studio setup, '
      + 'professional, high quality'
    ),
    lifestyle: (
      'Lifestyle product photography background, '
      + 'natural setting, soft ambient light, '
      + 'elegant environment, '
      + 'aspirational, high quality'
    ),
    artistic: (
      'Artistic product photography background, '
      + 'creative composition, elegant props, '
      + 'sophisticated styling, '
      + 'editorial, high quality'
    ),
  },

  /**
   * 产品场景
   */
  scene: {
    skincare: (
      'Skincare product display, '
      + 'elegant arrangement, natural elements, '
      + 'soft lighting, clean composition, '
      + 'luxury beauty, high quality'
    ),
    fashion: (
      'Fashion accessory display, '
      + 'elegant styling, premium materials, '
      + 'dramatic lighting, editorial feel, '
      + 'luxury fashion, high quality'
    ),
    tech: (
      'Technology product display, '
      + 'sleek design, modern aesthetic, '
      + 'clean lighting, premium feel, '
      + 'professional, high quality'
    ),
  },
};
```

---

## 4. B-LoRA 风格 Prompt

### 4.1 风格描述模板

**参考**: [B-LoRA Paper](https://arxiv.org/abs/2309.17445)

```typescript
// packages/generator/src/prompt/templates/blora-style.ts

/**
 * B-LoRA 风格描述模板
 *
 * B-LoRA 允许通过参考图学习风格，
 * 但仍需要配合 Prompt 描述内容
 */
export const BLoRAStylePrompts = {
  /**
   * 内容描述模板
   * 配合 B-LoRA 风格时使用
   */
  contentTemplates: {
    background: (
      'Abstract background, soft shapes, '
      + 'elegant composition, clean design'
    ),
    portrait: (
      'Portrait photography, elegant pose, '
      + 'professional lighting, sophisticated look'
    ),
    product: (
      'Product photography, clean presentation, '
      + 'professional styling, premium feel'
    ),
    landscape: (
      'Landscape photography, beautiful scenery, '
      + 'dramatic lighting, cinematic feel'
    ),
  },

  /**
   * 风格强度控制
   */
  styleStrength: {
    subtle: '<0.3>',
    moderate: '<0.5>',
    strong: '<0.7>',
    dominant: '<1.0>',
  },

  /**
   * 构建 B-LoRA Prompt
   *
   * @param content - 内容描述
   * @param styleStrength - 风格强度
   */
  buildPrompt(content: string, styleStrength: string = '<0.5>'): string {
    return `${content} ${styleStrength}`;
  },
};
```

### 4.2 风格学习 Prompt

```typescript
// packages/generator/src/prompt/style-learning.ts

/**
 * 风格学习相关 Prompt
 *
 * 用于从参考图提取风格描述
 */
export class StyleLearningPrompts {
  /**
   * 生成风格描述
   *
   * 基于参考图的视觉特征
   */
  static generateStyleDescription(analysis: {
    dominantColors: string[];
    colorTone: 'warm' | 'cool' | 'neutral';
    lighting: 'soft' | 'dramatic' | 'natural';
    mood: string;
    texture?: string;
  }): string {
    const parts: string[] = [];

    // 颜色
    parts.push(`${analysis.colorTone} color palette`);
    parts.push(`${analysis.dominantColors.slice(0, 3).join(', ')} tones`);

    // 光线
    parts.push(`${analysis.lighting} lighting`);

    // 氛围
    parts.push(`${analysis.mood} atmosphere`);

    // 质感
    if (analysis.texture) {
      parts.push(`${analysis.texture} texture`);
    }

    // 风格关键词
    parts.push('elegant, sophisticated, premium');

    return parts.join(', ');
  }

  /**
   * 风格变体 Prompt
   *
   * 生成同一风格的变体
   */
  static generateVariants(
    baseStyle: string,
    variations: ('color' | 'lighting' | 'mood')[]
  ): string[] {
    const results: string[] = [];

    if (variations.includes('color')) {
      results.push(`${baseStyle}, warm color variation`);
      results.push(`${baseStyle}, cool color variation`);
    }

    if (variations.includes('lighting')) {
      results.push(`${baseStyle}, dramatic lighting variation`);
      results.push(`${baseStyle}, soft lighting variation`);
    }

    if (variations.includes('mood')) {
      results.push(`${baseStyle}, calm atmosphere variation`);
      results.push(`${baseStyle}, energetic atmosphere variation`);
    }

    return results;
  }
}
```

---

## 5. Nano Banana 专用优化

### 5.1 Nano Banana Prompt 特点

**来源**: [Nano Banana Documentation](https://www.nano-banana.com/docs)

```yaml
Nano Banana (基于 Gemini):
  特点:
    - 对自然语言理解较好
    - 支持复杂描述
    - 响应速度快（1-2秒）

  最佳实践:
    - 使用清晰的英文描述
    - 分段描述（主体、风格、细节）
    - 避免过于抽象的词汇
    - 使用具体的形容词
```

### 5.2 Nano Banana 优化器

```typescript
// packages/generator/src/prompt/nano-banana-optimizer.ts

/**
 * Nano Banana Prompt 优化器
 */
export class NanoBananaOptimizer {
  /**
   * 优化 Prompt 以适配 Nano Banana
   */
  static optimize(prompt: string): string {
    // 1. 移除多余空格
    let optimized = prompt.replace(/\s+/g, ' ').trim();

    // 2. 确保关键词在前面
    const importantKeywords = ['minimalist', 'elegant', 'premium', 'professional'];
    const words = optimized.split(', ');

    // 将重要关键词移到前面
    importantKeywords.forEach(keyword => {
      const index = words.findIndex(w =>
        w.toLowerCase().includes(keyword.toLowerCase())
      );
      if (index > 0) {
        const [word] = words.splice(index, 1);
        words.unshift(word);
      }
    });

    optimized = words.join(', ');

    // 3. 添加质量后缀
    if (!optimized.includes('high quality')) {
      optimized += ', high quality';
    }

    return optimized;
  }

  /**
   * 为不同尺寸优化
   */
  static optimizeForAspectRatio(
    prompt: string,
    aspectRatio: '1:1' | '9:16' | '16:9'
  ): string {
    const aspectHints = {
      '1:1': 'square composition',
      '9:16': 'vertical composition, portrait orientation',
      '16:9': 'horizontal composition, landscape orientation',
    };

    return `${prompt}, ${aspectHints[aspectRatio]}`;
  }

  /**
   * 为不同用途优化
   */
  static optimizeForUseCase(
    prompt: string,
    useCase: 'background' | 'card' | 'thumbnail' | 'overlay'
  ): string {
    const useCaseHints = {
      background: 'suitable for background, enough negative space',
      card: 'suitable for text overlay, clean center area',
      thumbnail: 'eye-catching, clear focal point',
      overlay: 'transparent-ready, clean edges',
    };

    return `${prompt}, ${useCaseHints[useCase]}`;
  }
}
```

---

## 6. 质量控制

### 6.1 Prompt 质量评估

```typescript
// packages/generator/src/prompt/quality-evaluator.ts

/**
 * Prompt 质量评估器
 */
export class PromptQualityEvaluator {
  private static readonly GOOD_KEYWORDS = [
    'elegant', 'sophisticated', 'minimalist', 'premium',
    'professional', 'clean', 'refined', 'luxury',
  ];

  private static readonly BAD_KEYWORDS = [
    'cheap', 'basic', 'simple', 'plain',
    'generic', 'common', 'ordinary',
  ];

  private static readonly OVERUSED_KEYWORDS = [
    'stunning', 'amazing', 'beautiful', 'gorgeous',
    'perfect', 'masterpiece', 'award-winning',
  ];

  /**
   * 评估 Prompt 质量
   */
  static evaluate(prompt: string): {
    score: number;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    const lowerPrompt = prompt.toLowerCase();

    // 检查好的关键词
    const goodKeywordCount = this.GOOD_KEYWORDS.filter(k =>
      lowerPrompt.includes(k)
    ).length;

    // 检查坏的关键词
    const badKeywords = this.BAD_KEYWORDS.filter(k =>
      lowerPrompt.includes(k)
    );
    if (badKeywords.length > 0) {
      issues.push(`Contains negative keywords: ${badKeywords.join(', ')}`);
    }

    // 检查过度使用的词汇
    const overusedKeywords = this.OVERUSED_KEYWORDS.filter(k =>
      lowerPrompt.includes(k)
    );
    if (overusedKeywords.length > 2) {
      issues.push(`Contains overused keywords: ${overusedKeywords.join(', ')}`);
      suggestions.push('Consider using more specific descriptions');
    }

    // 检查长度
    if (prompt.length < 50) {
      issues.push('Prompt too short');
      suggestions.push('Add more detail about style and atmosphere');
    } else if (prompt.length > 500) {
      issues.push('Prompt too long');
      suggestions.push('Focus on the most important elements');
    }

    // 计算分数
    let score = 50; // 基础分
    score += goodKeywordCount * 10;
    score -= issues.length * 10;
    score = Math.max(0, Math.min(100, score));

    return { score, issues, suggestions };
  }
}
```

### 6.2 A/B 测试框架

```typescript
// packages/generator/src/prompt/ab-testing.ts

/**
 * Prompt A/B 测试框架
 */
export class PromptABTesting {
  private results: Map<string, ABTestResult> = new Map();

  /**
   * 创建测试
   */
  createTest(
    testId: string,
    promptA: string,
    promptB: string,
    config: {
      sampleSize: number;
      metric: 'user_rating' | 'click_rate' | 'conversion';
    }
  ): void {
    this.results.set(testId, {
      promptA,
      promptB,
      config,
      resultsA: [],
      resultsB: [],
      status: 'running',
    });
  }

  /**
   * 记录结果
   */
  recordResult(
    testId: string,
    variant: 'A' | 'B',
    score: number
  ): void {
    const test = this.results.get(testId);
    if (!test) return;

    if (variant === 'A') {
      test.resultsA.push(score);
    } else {
      test.resultsB.push(score);
    }

    // 检查是否达到样本量
    if (
      test.resultsA.length >= test.config.sampleSize &&
      test.resultsB.length >= test.config.sampleSize
    ) {
      test.status = 'completed';
    }
  }

  /**
   * 获取测试结果
   */
  getResults(testId: string): ABTestAnalysis | null {
    const test = this.results.get(testId);
    if (!test) return null;

    const avgA = this.average(test.resultsA);
    const avgB = this.average(test.resultsB);

    return {
      testId,
      winner: avgA > avgB ? 'A' : 'B',
      improvement: ((Math.max(avgA, avgB) - Math.min(avgA, avgB)) / Math.min(avgA, avgB)) * 100,
      details: {
        A: { average: avgA, samples: test.resultsA.length },
        B: { average: avgB, samples: test.resultsB.length },
      },
    };
  }

  private average(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }
}

interface ABTestResult {
  promptA: string;
  promptB: string;
  config: {
    sampleSize: number;
    metric: 'user_rating' | 'click_rate' | 'conversion';
  };
  resultsA: number[];
  resultsB: number[];
  status: 'running' | 'completed';
}

interface ABTestAnalysis {
  testId: string;
  winner: 'A' | 'B';
  improvement: number;
  details: {
    A: { average: number; samples: number };
    B: { average: number; samples: number };
  };
}
```

---

## 7. 最佳实践总结

### 7.1 Prompt 编写清单

```yaml
✅ 必须包含:
  - 主体描述（清晰、具体）
  - 风格关键词（2-3个高级感词汇）
  - 光线描述（soft lighting 等）
  - 质量声明（high quality）

✅ 建议包含:
  - 色调描述
  - 构图提示
  - 氛围描述

❌ 避免使用:
  - 模糊词汇（nice, good, beautiful）
  - 过于复杂的句子
  - 矛盾的描述
  - 过度使用的热词
```

### 7.2 示例对比

```yaml
# ❌ 不好的 Prompt
"Make a beautiful background that looks nice and professional"

# ✅ 好的 Prompt
"Minimalist gradient background, warm beige to soft cream, "
"elegant subtle gradient, clean, sophisticated, "
"negative space, soft diffused lighting, high quality"
```

---

## 8. 参考资源

### Prompt 工程指南

| 资源 | 链接 |
|------|------|
| OpenAI Prompt Guide | https://platform.openai.com/docs/guides/prompt-engineering |
| Learn Prompting | https://learnprompting.org/ |
| Prompt Engineering Guide | https://www.promptingguide.ai/ |
| Stable Diffusion Prompt Book | https://promptx.net/ |

### 高级感设计参考

| 资源 | 链接 |
|------|------|
| Awwwards | https://www.awwwards.com/ |
| Mobbin | https://mobbin.com/ |
| Dribbble - Minimal | https://dribbble.com/search/minimal |
| Behance - Editorial | https://www.behance.net/search/editorial |

### 色彩工具

| 资源 | 链接 |
|------|------|
| Coolors | https://coolors.co/ |
| Adobe Color | https://color.adobe.com/ |
| Color Hunt | https://colorhunt.co/ |

---

## 更新历史

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-02-16 | 1.0 | 初始版本 |
