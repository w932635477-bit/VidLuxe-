// 案例数据 - 使用最新的图片生成图片数据
// 更新时间: 2026-02-19

export interface Case {
  id: string;
  category: string;
  categoryLabel: string;
  originalUrl: string;   // 用户原图
  enhancedUrl: string;   // AI 升级后
  recommendedStyle: 'minimal' | 'warmLuxury' | 'coolPro' | 'morandi';
}

export const CASES: Case[] = [
  {
    "id": "fashion-1",
    "category": "fashion",
    "categoryLabel": "穿搭 OOTD",
    "originalUrl": "/comparisons/fashion-1-original.jpg",
    "enhancedUrl": "/comparisons/fashion-1-enhanced.jpg",
    "recommendedStyle": "warmLuxury"
  },
  {
    "id": "portrait-1",
    "category": "beauty",
    "categoryLabel": "背景升级",
    "originalUrl": "/comparisons/portrait-1-original.jpg",
    "enhancedUrl": "/comparisons/portrait-1-enhanced.jpg",
    "recommendedStyle": "warmLuxury"
  },
  {
    "id": "cafe-1",
    "category": "cafe",
    "categoryLabel": "咖啡探店",
    "originalUrl": "/comparisons/cafe-1-original.jpg",
    "enhancedUrl": "/comparisons/cafe-1-enhanced.jpg",
    "recommendedStyle": "warmLuxury"
  },
  {
    "id": "food-1",
    "category": "food",
    "categoryLabel": "探店美食",
    "originalUrl": "/comparisons/food-1-original.jpg",
    "enhancedUrl": "/comparisons/food-1-enhanced.jpg",
    "recommendedStyle": "warmLuxury"
  },
  {
    "id": "lifestyle-1",
    "category": "lifestyle",
    "categoryLabel": "生活方式",
    "originalUrl": "/comparisons/lifestyle-1-original.jpg",
    "enhancedUrl": "/comparisons/lifestyle-1-enhanced.jpg",
    "recommendedStyle": "minimal"
  },
  {
    "id": "product-1",
    "category": "beauty",
    "categoryLabel": "美妆升级",
    "originalUrl": "/comparisons/product-1-original.jpg",
    "enhancedUrl": "/comparisons/product-1-enhanced.jpg",
    "recommendedStyle": "warmLuxury"
  }
];

export function getCasesByCategory(category: string): Case[] {
  return CASES.filter((c) => c.category === category);
}

export function getHeroCases(count: number = 3): Case[] {
  return CASES.slice(0, count);
}

export const CATEGORIES = [
  { id: 'fashion', label: '穿搭 OOTD', icon: '👗' },
  { id: 'beauty', label: '美妆护肤', icon: '💄' },
  { id: 'cafe', label: '咖啡探店', icon: '☕' },
  { id: 'food', label: '探店美食', icon: '🍽️' },
  { id: 'lifestyle', label: '生活方式', icon: '🌿' },
  { id: 'tech', label: '数码产品', icon: '📱' },
] as const;

export type CategoryId = typeof CATEGORIES[number]['id'];
