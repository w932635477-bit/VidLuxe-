/**
 * AI 内容识别服务
 *
 * 识别图片的品类和种草类型
 * MVP: 使用规则匹配 + 默认值
 * 生产: 接入 AI Vision API (OpenAI GPT-4V / 百度图像识别)
 */

import type { CategoryType, SeedingType } from '@/lib/types/seeding';

// 识别结果
export interface RecognitionResult {
  category: CategoryType;
  categoryConfidence: number;
  seedingType: SeedingType;
  seedingTypeConfidence: number;
  suggestedStyles: string[];
}

// 品类关键词映射
const CATEGORY_KEYWORDS: Record<CategoryType, string[]> = {
  fashion: ['穿搭', 'ootd', 'outfit', 'fashion', '衣服', '裙', '鞋', 'fashion', 'style', '服装', 'look'],
  beauty: ['美妆', '化妆', '护肤', '口红', '粉底', 'beauty', 'makeup', 'skincare', '妆容', '脸'],
  food: ['美食', '食物', '餐厅', '好吃', 'food', 'delicious', '菜', '餐', '料理'],
  cafe: ['咖啡', '探店', 'cafe', 'coffee', '店铺', '店', '下午茶', '甜品'],
  home: ['家居', '房间', '装修', 'home', 'interior', '装饰', '家具', '生活'],
  travel: ['旅行', '旅游', '风景', '景点', 'travel', 'trip', '度假', '出游'],
  tech: ['数码', '科技', '手机', '电脑', 'tech', 'digital', '电子', '设备'],
  fitness: ['健身', '运动', '瑜伽', 'fit', 'fitness', 'gym', '锻炼', '减肥'],
};

// 种草类型关键词映射
const SEEDING_TYPE_KEYWORDS: Record<SeedingType, string[]> = {
  product: ['产品', '商品', '好物', '推荐', 'product', 'item', '开箱', '测评', '买'],
  location: ['地点', '打卡', '去哪', '探店', 'location', 'place', '地址', '在哪'],
  lifestyle: ['生活', '日常', '分享', 'vlog', 'lifestyle', '日常', '记录', '感受'],
};

// 品类到种草类型的默认映射
const CATEGORY_TO_SEEDING_DEFAULT: Record<CategoryType, SeedingType> = {
  fashion: 'product',
  beauty: 'product',
  food: 'location',
  cafe: 'location',
  home: 'lifestyle',
  travel: 'location',
  tech: 'product',
  fitness: 'lifestyle',
};

/**
 * 从文本中识别品类
 */
function recognizeCategoryFromText(text: string): { category: CategoryType; confidence: number } | null {
  const lowerText = text.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        // 匹配到的关键词越多，置信度越高
        const matchCount = keywords.filter(k => lowerText.includes(k.toLowerCase())).length;
        const confidence = Math.min(0.95, 0.6 + (matchCount * 0.1));
        return {
          category: category as CategoryType,
          confidence,
        };
      }
    }
  }

  return null;
}

/**
 * 从文本中识别种草类型
 */
function recognizeSeedingTypeFromText(text: string): { type: SeedingType; confidence: number } | null {
  const lowerText = text.toLowerCase();

  for (const [type, keywords] of Object.entries(SEEDING_TYPE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return {
          type: type as SeedingType,
          confidence: 0.85,
        };
      }
    }
  }

  return null;
}

/**
 * 根据品类推荐风格
 */
function getSuggestedStyles(category: CategoryType, seedingType: SeedingType): string[] {
  const styleMap: Record<string, string[]> = {
    'fashion-product': ['magazine', 'urban'],
    'fashion-lifestyle': ['soft', 'vintage'],
    'beauty-product': ['magazine', 'soft'],
    'beauty-lifestyle': ['soft', 'vintage'],
    'food-product': ['magazine', 'soft'],
    'food-location': ['soft', 'vintage'],
    'cafe-location': ['soft', 'vintage'],
    'cafe-lifestyle': ['soft', 'vintage'],
    'home-lifestyle': ['soft', 'vintage'],
    'travel-location': ['magazine', 'vintage'],
    'travel-lifestyle': ['vintage', 'soft'],
    'tech-product': ['urban', 'magazine'],
    'fitness-lifestyle': ['urban', 'magazine'],
  };

  const key = `${category}-${seedingType}`;
  return styleMap[key] || ['magazine', 'soft'];
}

/**
 * 识别图片内容
 *
 * MVP: 基于文件名/URL 进行简单匹配
 * 生产: 接入 AI Vision API
 */
export async function recognizeImage(
  imageUrl: string,
  options?: {
    filename?: string;
    userHint?: string; // 用户提供的提示文本
  }
): Promise<RecognitionResult> {
  // 组合可用的文本信息
  const textSources = [
    imageUrl,
    options?.filename || '',
    options?.userHint || '',
  ].filter(Boolean);

  const combinedText = textSources.join(' ');

  // 1. 尝试从文本识别品类
  let category: CategoryType = 'beauty'; // 默认美妆
  let categoryConfidence = 0.5;

  for (const source of textSources) {
    const result = recognizeCategoryFromText(source);
    if (result && result.confidence > categoryConfidence) {
      category = result.category;
      categoryConfidence = result.confidence;
    }
  }

  // 2. 尝试从文本识别种草类型
  let seedingType: SeedingType = CATEGORY_TO_SEEDING_DEFAULT[category];
  let seedingTypeConfidence = 0.6;

  for (const source of textSources) {
    const result = recognizeSeedingTypeFromText(source);
    if (result && result.confidence > seedingTypeConfidence) {
      seedingType = result.type;
      seedingTypeConfidence = result.confidence;
    }
  }

  // 3. 获取推荐风格
  const suggestedStyles = getSuggestedStyles(category, seedingType);

  return {
    category,
    categoryConfidence,
    seedingType,
    seedingTypeConfidence,
    suggestedStyles,
  };
}

/**
 * 使用 AI Vision API 进行识别（生产环境）
 *
 * 使用 EvoLink Chat API (GPT-4o Image) 进行图像识别
 */
export async function recognizeImageWithAI(
  imageUrl: string,
  options?: {
    filename?: string;
    userHint?: string;
  }
): Promise<RecognitionResult> {
  const apiKey = process.env.NANO_BANANA_API_KEY;

  if (!apiKey) {
    console.log('[Recognition] No API key configured, using rule-based recognition');
    return recognizeImage(imageUrl, options);
  }

  try {
    console.log('[Recognition] Using AI Vision API for:', imageUrl);

    const response = await fetch('https://api.evolink.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-image',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `分析这张图片，识别以下信息（用 JSON 格式返回）：

1. category: 品类类型，必须是以下之一：
   - fashion (穿搭/服装)
   - beauty (美妆/化妆)
   - food (美食/餐饮)
   - cafe (咖啡/探店)
   - home (家居/生活)
   - travel (旅行/风景)
   - tech (数码/科技)
   - fitness (健身/运动)

2. categoryConfidence: 品类识别置信度 (0-1)

3. seedingType: 种草类型，必须是以下之一：
   - product (产品推荐)
   - location (地点打卡)
   - lifestyle (生活方式)

4. seedingTypeConfidence: 种草类型置信度 (0-1)

5. suggestedStyles: 推荐的风格数组，从以下选择 2 个：
   - magazine (杂志大片)
   - soft (温柔日系)
   - urban (都市职场)
   - vintage (复古胶片)

${options?.userHint ? `用户提示：${options.userHint}` : ''}

只返回 JSON，不要其他解释。`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('[Recognition] API error:', response.status);
      return recognizeImage(imageUrl, options);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // 解析 JSON 响应
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Recognition] No JSON found in response:', content);
      return recognizeImage(imageUrl, options);
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // 验证并返回结果
    const validCategories: CategoryType[] = ['fashion', 'beauty', 'food', 'cafe', 'home', 'travel', 'tech', 'fitness'];
    const validSeedingTypes: SeedingType[] = ['product', 'location', 'lifestyle'];
    const validStyles = ['magazine', 'soft', 'urban', 'vintage'];

    const category = validCategories.includes(parsed.category) ? parsed.category : 'beauty';
    const seedingType = validSeedingTypes.includes(parsed.seedingType) ? parsed.seedingType : 'product';

    return {
      category,
      categoryConfidence: Math.min(1, Math.max(0, parsed.categoryConfidence || 0.8)),
      seedingType,
      seedingTypeConfidence: Math.min(1, Math.max(0, parsed.seedingTypeConfidence || 0.8)),
      suggestedStyles: (parsed.suggestedStyles || ['magazine', 'soft'])
        .filter((s: string) => validStyles.includes(s))
        .slice(0, 2),
    };
  } catch (error) {
    console.error('[Recognition] AI Vision error:', error);
    // 回退到规则匹配
    return recognizeImage(imageUrl, options);
  }
}

/**
 * 批量识别图片
 */
export async function recognizeImages(
  imageUrls: string[]
): Promise<RecognitionResult[]> {
  return Promise.all(imageUrls.map(url => recognizeImage(url)));
}
