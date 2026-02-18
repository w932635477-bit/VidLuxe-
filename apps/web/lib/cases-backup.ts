// 案例数据类型和存储
// 这个文件用于存储生成的案例图片 URL

export interface Case {
  id: string;
  category: string;
  categoryLabel: string;
  beforeUrl: string;  // 升级后
  afterUrl: string;   // 原片
  recommendedStyle: 'minimal' | 'warmLuxury' | 'coolPro' | 'morandi';
}

// 使用 picsum 作为占位图（开发阶段）
// 实际部署时替换为 Nano Banana 生成的图片
export const CASES: Case[] = [
  {
    id: 'fashion-1',
    category: 'fashion',
    categoryLabel: '穿搭 OOTD',
    beforeUrl: 'https://picsum.photos/seed/vidluxe-fashion1-up/540/960',
    afterUrl: 'https://picsum.photos/seed/vidluxe-fashion1-orig/540/960',
    recommendedStyle: 'warmLuxury',
  },
  {
    id: 'fashion-2',
    category: 'fashion',
    categoryLabel: '穿搭 OOTD',
    beforeUrl: 'https://picsum.photos/seed/vidluxe-fashion2-up/540/960',
    afterUrl: 'https://picsum.photos/seed/vidluxe-fashion2-orig/540/960',
    recommendedStyle: 'minimal',
  },
  {
    id: 'fashion-3',
    category: 'fashion',
    categoryLabel: '穿搭 OOTD',
    beforeUrl: 'https://picsum.photos/seed/vidluxe-fashion3-up/540/960',
    afterUrl: 'https://picsum.photos/seed/vidluxe-fashion3-orig/540/960',
    recommendedStyle: 'warmLuxury',
  },
  {
    id: 'beauty-1',
    category: 'beauty',
    categoryLabel: '美妆护肤',
    beforeUrl: 'https://picsum.photos/seed/vidluxe-beauty1-up/540/960',
    afterUrl: 'https://picsum.photos/seed/vidluxe-beauty1-orig/540/960',
    recommendedStyle: 'warmLuxury',
  },
  {
    id: 'beauty-2',
    category: 'beauty',
    categoryLabel: '美妆护肤',
    beforeUrl: 'https://picsum.photos/seed/vidluxe-beauty2-up/540/960',
    afterUrl: 'https://picsum.photos/seed/vidluxe-beauty2-orig/540/960',
    recommendedStyle: 'minimal',
  },
  {
    id: 'beauty-3',
    category: 'beauty',
    categoryLabel: '美妆护肤',
    beforeUrl: 'https://picsum.photos/seed/vidluxe-beauty3-up/540/960',
    afterUrl: 'https://picsum.photos/seed/vidluxe-beauty3-orig/540/960',
    recommendedStyle: 'coolPro',
  },
  {
    id: 'cafe-1',
    category: 'cafe',
    categoryLabel: '咖啡探店',
    beforeUrl: 'https://picsum.photos/seed/vidluxe-cafe1-up/540/960',
    afterUrl: 'https://picsum.photos/seed/vidluxe-cafe1-orig/540/960',
    recommendedStyle: 'warmLuxury',
  },
  {
    id: 'cafe-2',
    category: 'cafe',
    categoryLabel: '咖啡探店',
    beforeUrl: 'https://picsum.photos/seed/vidluxe-cafe2-up/540/960',
    afterUrl: 'https://picsum.photos/seed/vidluxe-cafe2-orig/540/960',
    recommendedStyle: 'morandi',
  },
  {
    id: 'cafe-3',
    category: 'cafe',
    categoryLabel: '咖啡探店',
    beforeUrl: 'https://picsum.photos/seed/vidluxe-cafe3-up/540/960',
    afterUrl: 'https://picsum.photos/seed/vidluxe-cafe3-orig/540/960',
    recommendedStyle: 'warmLuxury',
  },
  {
    id: 'food-1',
    category: 'food',
    categoryLabel: '探店美食',
    beforeUrl: 'https://picsum.photos/seed/vidluxe-food1-up/540/960',
    afterUrl: 'https://picsum.photos/seed/vidluxe-food1-orig/540/960',
    recommendedStyle: 'warmLuxury',
  },
  {
    id: 'food-2',
    category: 'food',
    categoryLabel: '探店美食',
    beforeUrl: 'https://picsum.photos/seed/vidluxe-food2-up/540/960',
    afterUrl: 'https://picsum.photos/seed/vidluxe-food2-orig/540/960',
    recommendedStyle: 'minimal',
  },
  {
    id: 'lifestyle-1',
    category: 'lifestyle',
    categoryLabel: '生活方式',
    beforeUrl: 'https://picsum.photos/seed/vidluxe-life1-up/540/960',
    afterUrl: 'https://picsum.photos/seed/vidluxe-life1-orig/540/960',
    recommendedStyle: 'minimal',
  },
  {
    id: 'lifestyle-2',
    category: 'lifestyle',
    categoryLabel: '生活方式',
    beforeUrl: 'https://picsum.photos/seed/vidluxe-life2-up/540/960',
    afterUrl: 'https://picsum.photos/seed/vidluxe-life2-orig/540/960',
    recommendedStyle: 'morandi',
  },
  {
    id: 'tech-1',
    category: 'tech',
    categoryLabel: '数码产品',
    beforeUrl: 'https://picsum.photos/seed/vidluxe-tech1-up/540/960',
    afterUrl: 'https://picsum.photos/seed/vidluxe-tech1-orig/540/960',
    recommendedStyle: 'minimal',
  },
  {
    id: 'tech-2',
    category: 'tech',
    categoryLabel: '数码产品',
    beforeUrl: 'https://picsum.photos/seed/vidluxe-tech2-up/540/960',
    afterUrl: 'https://picsum.photos/seed/vidluxe-tech2-orig/540/960',
    recommendedStyle: 'coolPro',
  },
];

// 获取指定分类的案例
export function getCasesByCategory(category: string): Case[] {
  return CASES.filter((c) => c.category === category);
}

// 获取 Hero 展示用的案例
export function getHeroCases(count: number = 3): Case[] {
  return CASES.slice(0, count);
}

// 分类信息
export const CATEGORIES = [
  { id: 'fashion', label: '穿搭 OOTD', icon: '👗' },
  { id: 'beauty', label: '美妆护肤', icon: '💄' },
  { id: 'cafe', label: '咖啡探店', icon: '☕' },
  { id: 'food', label: '探店美食', icon: '🍽️' },
  { id: 'lifestyle', label: '生活方式', icon: '🌿' },
  { id: 'tech', label: '数码产品', icon: '📱' },
] as const;

export type CategoryId = typeof CATEGORIES[number]['id'];
