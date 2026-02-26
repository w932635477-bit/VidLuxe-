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
 * 预留接口，后续可接入：
 * - OpenAI GPT-4 Vision
 * - 百度图像识别
 * - 阿里云视觉智能
 */
export async function recognizeImageWithAI(imageUrl: string): Promise<RecognitionResult> {
  // TODO: 接入 AI Vision API
  // 目前回退到规则匹配
  console.log('[Recognition] AI Vision API not yet implemented, using rule-based recognition');
  return recognizeImage(imageUrl);
}

/**
 * 批量识别图片
 */
export async function recognizeImages(
  imageUrls: string[]
): Promise<RecognitionResult[]> {
  return Promise.all(imageUrls.map(url => recognizeImage(url)));
}
