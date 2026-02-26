// 种草内容增强 - 配置与工具函数

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
    'fashion-product': ['magazine', 'urban'],
    'fashion-lifestyle': ['soft', 'magazine'],
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
