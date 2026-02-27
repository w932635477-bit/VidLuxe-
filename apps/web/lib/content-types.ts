/**
 * 内容类型配置模块
 *
 * 定义小红书内容类型（穿搭、美妆、探店、旅游、美食）
 * 及其对应的 Prompt 增强词
 */

import type { PresetStyle } from './style-prompts';

/**
 * 内容类型枚举
 */
export type ContentType = 'outfit' | 'beauty' | 'cafe' | 'travel' | 'food';

/**
 * 内容类型配置接口
 */
export interface ContentTypeConfig {
  id: ContentType;
  name: string;
  icon: string;
  description: string;
  keywords: string;
  negativeKeywords: string;
  suitableStyles: PresetStyle[];
  comparisonImage: {
    before: string;
    after: string;
  };
}

/**
 * 内容类型配置
 */
export const CONTENT_TYPES: Record<ContentType, ContentTypeConfig> = {
  outfit: {
    id: 'outfit',
    name: '穿搭',
    icon: '👗',
    description: '时尚穿搭、街拍、日常搭配',
    keywords: 'fashion photography, outfit details, street style, clothing texture, model pose, fashion editorial',
    negativeKeywords: 'casual snapshot, poor lighting, messy background, unflattering angle',
    suitableStyles: ['magazine', 'soft', 'urban', 'vintage'],
    comparisonImage: {
      before: '/comparisons/fashion-1-original.jpg',
      after: '/comparisons/fashion-1-enhanced.jpg',
    },
  },
  beauty: {
    id: 'beauty',
    name: '美妆',
    icon: '💄',
    description: '妆容展示、美妆产品、护肤',
    keywords: 'beauty close-up, makeup details, skin texture, glamour lighting, portrait photography, cosmetic',
    negativeKeywords: 'harsh shadows, overexposed, unnatural colors, heavy retouching',
    suitableStyles: ['magazine', 'soft'],
    comparisonImage: {
      before: '/hero/hero-beauty-before.jpg',
      after: '/hero/hero-beauty-after.jpg',
    },
  },
  cafe: {
    id: 'cafe',
    name: '探店',
    icon: '☕',
    description: '咖啡店、餐厅、空间探店',
    keywords: 'interior atmosphere, cozy vibe, lifestyle photography, ambient lighting, cafe aesthetic, space design',
    negativeKeywords: 'cluttered, harsh fluorescent lighting, empty, sterile',
    suitableStyles: ['soft', 'urban', 'vintage'],
    comparisonImage: {
      before: '/comparisons/cafe-1-original.jpg',
      after: '/comparisons/cafe-1-enhanced.jpg',
    },
  },
  travel: {
    id: 'travel',
    name: '旅游',
    icon: '✈️',
    description: '旅行记录、风景、目的地',
    keywords: 'travel photography, landscape, scenic view, adventure, destination, wanderlust',
    negativeKeywords: 'tourist traps, crowded, artificial, cliche',
    suitableStyles: ['soft', 'vintage'],
    comparisonImage: {
      before: '/comparisons/lifestyle-1-original.jpg',
      after: '/comparisons/lifestyle-1-enhanced.jpg',
    },
  },
  food: {
    id: 'food',
    name: '美食',
    icon: '🍽️',
    description: '美食摄影、餐厅菜品、烹饪',
    keywords: 'food photography, appetizing, warm lighting, gourmet, culinary art, delicious',
    negativeKeywords: 'unappetizing, harsh flash, messy plating, artificial colors',
    suitableStyles: ['soft', 'magazine'],
    comparisonImage: {
      before: '/comparisons/food-1-original.jpg',
      after: '/comparisons/food-1-enhanced.jpg',
    },
  },
};

/**
 * 获取内容类型配置
 */
export function getContentTypeConfig(contentType: ContentType): ContentTypeConfig {
  return CONTENT_TYPES[contentType] || CONTENT_TYPES.outfit;
}

/**
 * 获取所有内容类型列表
 */
export function getAllContentTypes(): ContentTypeConfig[] {
  return Object.values(CONTENT_TYPES);
}
