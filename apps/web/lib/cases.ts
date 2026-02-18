// 自动生成的案例数据 - 2026-02-17T23:27:26.592Z
// 图片已下载到本地存储

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
    "originalUrl": "/cases/images/fashion-1-after.jpg",
    "enhancedUrl": "/cases/images/fashion-1-before.jpg",
    "recommendedStyle": "warmLuxury"
  },
  {
    "id": "fashion-2",
    "category": "fashion",
    "categoryLabel": "穿搭 OOTD",
    "originalUrl": "/cases/images/fashion-2-after.jpg",
    "enhancedUrl": "/cases/images/fashion-2-before.jpg",
    "recommendedStyle": "minimal"
  },
  {
    "id": "beauty-1",
    "category": "beauty",
    "categoryLabel": "美妆护肤",
    "originalUrl": "/cases/images/beauty-1-after.jpg",
    "enhancedUrl": "/cases/images/beauty-1-before.jpg",
    "recommendedStyle": "warmLuxury"
  },
  {
    "id": "beauty-2",
    "category": "beauty",
    "categoryLabel": "美妆护肤",
    "originalUrl": "/cases/images/beauty-2-after.jpg",
    "enhancedUrl": "/cases/images/beauty-2-before.jpg",
    "recommendedStyle": "minimal"
  },
  {
    "id": "cafe-1",
    "category": "cafe",
    "categoryLabel": "咖啡探店",
    "originalUrl": "/cases/images/cafe-1-after.jpg",
    "enhancedUrl": "/cases/images/cafe-1-before.jpg",
    "recommendedStyle": "warmLuxury"
  },
  {
    "id": "cafe-2",
    "category": "cafe",
    "categoryLabel": "咖啡探店",
    "originalUrl": "/cases/images/cafe-2-after.jpg",
    "enhancedUrl": "/cases/images/cafe-2-before.jpg",
    "recommendedStyle": "morandi"
  },
  {
    "id": "food-1",
    "category": "food",
    "categoryLabel": "探店美食",
    "originalUrl": "/cases/images/food-1-after.jpg",
    "enhancedUrl": "/cases/images/food-1-before.jpg",
    "recommendedStyle": "warmLuxury"
  },
  {
    "id": "lifestyle-1",
    "category": "lifestyle",
    "categoryLabel": "生活方式",
    "originalUrl": "/cases/images/lifestyle-1-after.jpg",
    "enhancedUrl": "/cases/images/lifestyle-1-before.jpg",
    "recommendedStyle": "minimal"
  },
  {
    "id": "lifestyle-2",
    "category": "lifestyle",
    "categoryLabel": "生活方式",
    "originalUrl": "/cases/images/lifestyle-2-after.jpg",
    "enhancedUrl": "/cases/images/lifestyle-2-before.jpg",
    "recommendedStyle": "morandi"
  },
  {
    "id": "tech-1",
    "category": "tech",
    "categoryLabel": "数码产品",
    "originalUrl": "/cases/images/tech-1-after.jpg",
    "enhancedUrl": "/cases/images/tech-1-before.jpg",
    "recommendedStyle": "minimal"
  },
  {
    "id": "tech-2",
    "category": "tech",
    "categoryLabel": "数码产品",
    "originalUrl": "/cases/images/tech-2-after.jpg",
    "enhancedUrl": "/cases/images/tech-2-before.jpg",
    "recommendedStyle": "coolPro"
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
