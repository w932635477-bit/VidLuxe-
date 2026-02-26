/**
 * 品类修饰词配置
 *
 * 基于 MidJourney 和 Stable Diffusion 社区的最佳实践
 * 为不同品类定制提示词修饰词
 */

import type { CategoryType, SeedingType } from './types/seeding';
import type { MultiStyleType } from './stores/try-store';

// ============================================
// 品类修饰词定义
// ============================================

interface CategoryModifiers {
  base: string[];
  lighting: string[];
  details: string[];
  mood: string[];
}

const categoryModifiers: Record<CategoryType, CategoryModifiers> = {
  fashion: {
    base: ['fashion photography', 'editorial style', 'professional model pose'],
    lighting: ['soft studio lighting', 'natural daylight', 'golden hour glow'],
    details: ['texture detail', 'fabric close-up', 'outfit showcase'],
    mood: ['elegant and confident', 'effortless chic', 'sophisticated minimal'],
  },

  beauty: {
    base: ['beauty photography', 'macro beauty shot', 'flawless skin'],
    lighting: ['ring light', 'soft diffused light', 'beauty dish lighting'],
    details: ['makeup detail', 'skin texture', 'product close-up'],
    mood: ['radiant glow', 'fresh and natural', 'glamorous finish'],
  },

  food: {
    base: ['food photography', 'culinary art', 'appetizing presentation'],
    lighting: ['soft window light', 'backlit glow', 'warm ambient light'],
    details: ['texture detail', 'steam rising', 'fresh ingredients'],
    mood: ['cozy and inviting', 'fresh and vibrant', 'elegant dining'],
  },

  cafe: {
    base: ['interior photography', 'lifestyle shot', 'atmospheric space'],
    lighting: ['natural window light', 'warm cafe lighting', 'cozy ambient'],
    details: ['interior design detail', 'coffee art close-up', 'decor elements'],
    mood: ['cozy and welcoming', 'aesthetic minimal', 'relaxed ambiance'],
  },

  home: {
    base: ['interior design photography', 'home decor showcase', 'architectural detail'],
    lighting: ['natural daylight', 'warm home lighting', 'soft shadows'],
    details: ['texture material', 'decor arrangement', 'plant accents'],
    mood: ['calm and serene', 'modern minimalist', 'warm and lived-in'],
  },

  travel: {
    base: ['travel photography', 'destination showcase', 'landscape vista'],
    lighting: ['golden hour', 'blue hour', 'dramatic sky'],
    details: ['scenic view', 'local culture', 'adventure moment'],
    mood: ['wanderlust', 'serene and peaceful', 'adventurous spirit'],
  },

  tech: {
    base: ['product photography', 'tech gadget showcase', 'clean background'],
    lighting: ['studio lighting', 'gradient reflection', 'subtle rim light'],
    details: ['product detail', 'screen display', 'material finish'],
    mood: ['modern and sleek', 'professional tech', 'premium quality'],
  },

  fitness: {
    base: ['fitness photography', 'athletic portrait', 'dynamic movement'],
    lighting: ['dramatic lighting', 'gym lighting', 'natural outdoor'],
    details: ['muscle definition', 'form technique', 'equipment detail'],
    mood: ['energetic and powerful', 'healthy and fit', 'motivated and strong'],
  },
};

// ============================================
// 品类与风格推荐映射
// ============================================

export const styleRecommendations: Record<CategoryType, MultiStyleType[]> = {
  fashion: ['magazine', 'soft', 'urban'],
  beauty: ['soft', 'magazine', 'vintage'],
  food: ['soft', 'magazine', 'vintage'],
  cafe: ['soft', 'vintage', 'magazine'],
  home: ['soft', 'vintage', 'urban'],
  travel: ['soft', 'vintage', 'magazine'],
  tech: ['urban', 'magazine', 'soft'],
  fitness: ['urban', 'magazine', 'soft'],
};

// ============================================
// 种草类型提示词
// ============================================

const seedingTypePrompts: Record<SeedingType, string> = {
  product: 'product showcase, hero shot, centered composition',
  location: 'environmental portrait, location setting, contextual background',
  lifestyle: 'lifestyle moment, candid shot, natural interaction',
};

// ============================================
// 风格修饰词
// ============================================

const styleModifiers: Record<MultiStyleType, string[]> = {
  magazine: [
    'Vogue editorial style',
    'luxurious atmosphere',
    'fashion photography',
    'elegant lighting',
    'rich golden tones',
  ],
  soft: [
    'soft natural light',
    'gentle colors',
    'Japanese aesthetic',
    'dreamy atmosphere',
    'pastel tones',
  ],
  urban: [
    'cool blue tones',
    'professional look',
    'tech aesthetic',
    'clean modern',
    'gradient background',
  ],
  vintage: [
    'film grain texture',
    'warm retro tones',
    'Kodak Portra style',
    'nostalgic atmosphere',
    'cinematic color',
  ],
};

// ============================================
// 质量提升词
// ============================================

const qualityEnhancers = [
  'high quality',
  'professional photography',
  '8k resolution',
  'sharp focus',
  'detailed texture',
];

// ============================================
// 提示词构建函数
// ============================================

/**
 * 构建完整的提示词
 */
export function buildPrompt(
  category: CategoryType,
  seedingType: SeedingType,
  style: MultiStyleType,
  userDescription?: string
): string {
  const parts: string[] = [];

  // 1. 种草类型基础描述
  parts.push(seedingTypePrompts[seedingType]);

  // 2. 品类修饰词
  const catMods = categoryModifiers[category];
  parts.push(...catMods.base);
  parts.push(...catMods.lighting.slice(0, 1)); // 只用一个光线词

  // 3. 风格修饰词
  parts.push(...styleModifiers[style].slice(0, 3));

  // 4. 用户自定义描述
  if (userDescription) {
    parts.push(userDescription);
  }

  // 5. 质量提升词
  parts.push(...qualityEnhancers.slice(0, 3));

  return parts.join(', ');
}

/**
 * 获取品类的主要修饰词
 */
export function getCategoryModifiers(category: CategoryType): CategoryModifiers {
  return categoryModifiers[category];
}

/**
 * 获取推荐的风格列表
 */
export function getRecommendedStyles(category: CategoryType): MultiStyleType[] {
  return styleRecommendations[category];
}

/**
 * 获取风格修饰词
 */
export function getStyleModifiers(style: MultiStyleType): string[] {
  return styleModifiers[style];
}

/**
 * 获取种草类型提示词
 */
export function getSeedingTypePrompt(seedingType: SeedingType): string {
  return seedingTypePrompts[seedingType];
}
