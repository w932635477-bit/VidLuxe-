/**
 * 效果预设配置模块
 *
 * 定义视觉化效果库，替代原有的 4 种固定风格
 */

import type { ContentType } from './content-types';

/**
 * 效果预设接口
 */
export interface EffectPreset {
  id: string;
  name: string;              // 完整名称 "韩系高级 · 奶茶色调"
  shortName: string;         // 缩略名称 "韩系高级" (缩略图显示)
  contentType: ContentType;  // 内容类型

  // 预览图
  preview: {
    before: string;          // 原图 URL
    after: string;           // 效果图 URL
  };

  // Prompt 模板
  promptTemplate: string;
  negativePrompt: string;

  // 元数据
  popularity: number;        // 使用次数（用于排序）
  isHot: boolean;            // 是否热门推荐
  accentColor: string;       // 主题色
}

/**
 * 穿搭效果预设 (12个)
 */
export const OUTFIT_EFFECTS: EffectPreset[] = [
  {
    id: 'outfit-magazine',
    name: '杂志大片 · 高级奢华',
    shortName: '杂志大片',
    contentType: 'outfit',
    preview: {
      before: '/hero/hero-new-before.jpg',
      after: '/hero/hero-new-after.jpg',
    },
    promptTemplate: 'Vogue magazine cover style, Haute Couture fashion aesthetic, with elegant English text overlay, "VOGUE" masthead at top in bold Didot typography, "FALL ESSENTIALS" subtitle text, "THE NEW CLASSICS" headline at bottom, warm golden champagne lighting, sophisticated and refined, supermodel photography quality, Hermès editorial elegance, warm beige and champagne gold tones, cinematic luxury background, soft studio lighting, premium quality, editorial composition, magazine cover typography design, fashion editorial text layout, 2K quality',
    negativePrompt: 'amateur, low quality, blurry, distorted, ugly, bad anatomy, bad proportions, watermark, signature',
    popularity: 1000,
    isHot: true,
    accentColor: '#D4AF37',
  },
  {
    id: 'outfit-soft',
    name: '日系温柔 · 清新治愈',
    shortName: '日系温柔',
    contentType: 'outfit',
    preview: {
      before: '/comparisons/fashion-1-original.jpg',
      after: '/comparisons/outfit-soft.jpg',
    },
    promptTemplate: 'Japanese lifestyle magazine style, MUJI aesthetic, soft morning natural lighting, muted pastel colors, Kinfolk editorial quality, dreamy atmosphere, gentle and warm, artistic and refined, soft fabric texture, low saturation, earthy tones, natural and authentic, premium paper quality, serene and peaceful, 2K quality',
    negativePrompt: 'harsh lighting, high contrast, neon colors, artificial, flashy, bold, aggressive',
    popularity: 850,
    isHot: true,
    accentColor: '#B8A99A',
  },
  {
    id: 'outfit-korean-premium',
    name: '韩系高级 · 奶茶色调',
    shortName: '韩系高级',
    contentType: 'outfit',
    preview: {
      before: '/comparisons/outfit-korean-before.jpg',
      after: '/comparisons/outfit-korean-after.jpg',
    },
    promptTemplate: 'Seoul Fashion Week photography, Korean premium aesthetic, soft beige and milk tea tones, elegant and sophisticated, dewy K-beauty skin, clean minimal background, natural lighting, high-end editorial, modern Korean style, subtle warmth, Gentle Monster aesthetic, refined luxury, 2K quality',
    negativePrompt: 'harsh, oversaturated, cluttered, amateur, low quality',
    popularity: 920,
    isHot: true,
    accentColor: '#C4A77D',
  },
  {
    id: 'outfit-vintage',
    name: '复古胶片 · 电影氛围',
    shortName: '复古胶片',
    contentType: 'outfit',
    preview: {
      before: '/comparisons/outfit-vintage-before.jpg',
      after: '/comparisons/outfit-vintage-after.jpg',
    },
    promptTemplate: 'Kodak Portra 400 film look, vintage cinematic aesthetic, warm film grain, cinematic color grading, nostalgic atmosphere, retro style, artistic, soft highlights, subtle vignette, analog photography feel, Wong Kar-wai film mood, storytelling quality, timeless elegance, 2K quality',
    negativePrompt: 'digital, sharp, clean, modern, sterile, oversaturated, HDR, artificial lighting',
    popularity: 780,
    isHot: false,
    accentColor: '#C9A86C',
  },
  {
    id: 'outfit-urban',
    name: '都市职场 · 专业干练',
    shortName: '都市职场',
    contentType: 'outfit',
    preview: {
      before: '/comparisons/outfit-urban-before.jpg',
      after: '/comparisons/outfit-urban-after.jpg',
    },
    promptTemplate: 'Apple keynote style, Fortune 500 executive portrait, clean professional background, cool blue-gray tones, corporate executive aesthetic, modern minimalist, trustworthy and authoritative, soft diffused lighting, sharp details, premium corporate style, LinkedIn professional quality, confident and poised, 2K quality',
    negativePrompt: 'casual, messy, warm tones, rustic, vintage, playful, informal, cluttered',
    popularity: 650,
    isHot: false,
    accentColor: '#5E7A99',
  },
  {
    id: 'outfit-street-cool',
    name: '街头酷感 · 高对比度',
    shortName: '街头酷感',
    contentType: 'outfit',
    preview: {
      before: '/comparisons/outfit-street-before.jpg',
      after: '/comparisons/outfit-street-after.jpg',
    },
    promptTemplate: 'High-fashion street photography, editorial streetwear aesthetic, high contrast, urban cool, bold shadows, gritty texture, dynamic composition, modern edge, fashion-forward, Off-White attitude, Supreme cool factor, bold statement, 2K quality',
    negativePrompt: 'soft, pastel, gentle, traditional, boring',
    popularity: 580,
    isHot: false,
    accentColor: '#2C3E50',
  },
  {
    id: 'outfit-minimal-clean',
    name: '极简纯净 · 高级灰',
    shortName: '极简纯净',
    contentType: 'outfit',
    preview: {
      before: '/comparisons/outfit-minimal-before.jpg',
      after: '/comparisons/outfit-minimal-after.jpg',
    },
    promptTemplate: 'Celine minimalist aesthetic, clean lines, neutral gray tones, Scandinavian style, pure and simple, high-key lighting, premium fabric texture, white space, elegant simplicity, Jil Sander refinement, modern editorial, soft diffused light, 2K quality',
    negativePrompt: 'cluttered, colorful, busy, chaotic, dark',
    popularity: 520,
    isHot: false,
    accentColor: '#9E9E9E',
  },
  {
    id: 'outfit-warm-cozy',
    name: '温暖惬意 · 秋日氛围',
    shortName: '温暖惬意',
    contentType: 'outfit',
    preview: {
      before: '/comparisons/outfit-warm-before.jpg',
      after: '/comparisons/outfit-warm-after.jpg',
    },
    promptTemplate: 'Kinfolk editorial style, warm autumn atmosphere, cozy premium feeling, golden hour lighting, earthy tones, brown and amber colors, comfortable and inviting, lifestyle magazine quality, natural warmth, hygge atmosphere, soft organic texture, 2K quality',
    negativePrompt: 'cold, blue, harsh, artificial, sterile',
    popularity: 480,
    isHot: false,
    accentColor: '#D4A574',
  },
  // 后续 4 个效果待预览图制作完成后添加
];

/**
 * 美妆效果预设 (8个)
 */
export const BEAUTY_EFFECTS: EffectPreset[] = [
  {
    id: 'beauty-magazine',
    name: '杂志大片 · 奢华质感',
    shortName: '杂志大片',
    contentType: 'beauty',
    preview: {
      before: '/hero/hero-beauty-before.jpg',
      after: '/comparisons/beauty-magazine.jpg',
    },
    promptTemplate: 'High-end beauty editorial, Vogue magazine cover style with elegant English text overlay, "VOGUE" masthead at top in bold sans-serif typography, "BEAUTY SECRETS" subtitle, "TIMELESS ELEGANCE" headline at bottom, luxury cosmetic aesthetic, flawless skin texture, professional studio lighting, glamour photography, premium beauty campaign, magazine cover typography design',
    negativePrompt: 'amateur, poor lighting, harsh shadows, unnatural colors',
    popularity: 900,
    isHot: true,
    accentColor: '#D4AF37',
  },
  {
    id: 'beauty-soft-glow',
    name: '柔光嫩肤 · 清透妆容',
    shortName: '柔光嫩肤',
    contentType: 'beauty',
    preview: {
      before: '/hero/hero-beauty-before.jpg',
      after: '/comparisons/beauty-soft.jpg',
    },
    promptTemplate: 'Soft glow beauty, dewy skin, natural makeup look, soft diffused lighting, fresh and radiant, Korean beauty aesthetic, gentle and pure',
    negativePrompt: 'harsh, oily, overexposed, artificial',
    popularity: 850,
    isHot: true,
    accentColor: '#FFD1DC',
  },
  {
    id: 'beauty-glass-skin',
    name: '韩系水光 · 透亮无瑕',
    shortName: '韩系水光',
    contentType: 'beauty',
    preview: {
      before: '/hero/hero-beauty-before.jpg',
      after: '/comparisons/beauty-glass-skin.jpg',
    },
    promptTemplate: 'K-beauty glass skin portrait, ultra dewy hydrated complexion, water-glow finish, poreless smooth skin, natural gradient lips in soft pink, straight Korean brows, subtle highlighter on cheekbones, soft diffused studio lighting, high-key bright aesthetic, clean minimalist background, Korean celebrity skincare endorsement style, fresh and radiant, plump hydrated skin texture, 2K quality',
    negativePrompt: 'matte, dry skin, heavy makeup, dark shadows, harsh lighting, overlined lips, dramatic contour',
    popularity: 880,
    isHot: true,
    accentColor: '#E8F4F8',
  },
  {
    id: 'beauty-japanese',
    name: '日系透明 · 清新氧气',
    shortName: '日系透明',
    contentType: 'beauty',
    preview: {
      before: '/hero/hero-beauty-before.jpg',
      after: '/comparisons/beauty-japanese.jpg',
    },
    promptTemplate: 'Japanese beauty aesthetic, transparent skin finish, airy and ethereal complexion, soft flushed cheeks placement, natural feathered brows, clear gloss lips, soft natural window light, dreamy bokeh background, lifestyle magazine quality, innocent and pure vibe, Fuji film color tone, soft pastel atmosphere, authentic J-beauty, 2K quality',
    negativePrompt: 'heavy foundation, bold colors, dramatic makeup, harsh lines, artificial look, overprocessed, high contrast',
    popularity: 820,
    isHot: true,
    accentColor: '#FFF0F5',
  },
  {
    id: 'beauty-retro-hk',
    name: '复古港风 · 经典红唇',
    shortName: '复古港风',
    contentType: 'beauty',
    preview: {
      before: '/hero/hero-beauty-before.jpg',
      after: '/comparisons/beauty-retro-hk.jpg',
    },
    promptTemplate: '1980s Hong Kong cinema beauty, classic vintage glamour, bold red matte lips, defined arched brows, soft winged eyeliner, warm golden film lighting, film grain texture, analog photography aesthetic, muted warm color palette, nostalgic atmosphere, elegant and sophisticated, Wong Kar-wai film mood, cinematic portrait, timeless beauty, 2K quality',
    negativePrompt: 'modern, digital sharp, cool tones, minimalist, clean background, natural makeup, fresh look',
    popularity: 750,
    isHot: false,
    accentColor: '#8B0000',
  },
  {
    id: 'beauty-editorial',
    name: '欧美高级 · 立体轮廓',
    shortName: '欧美高级',
    contentType: 'beauty',
    preview: {
      before: '/hero/hero-beauty-before.jpg',
      after: '/comparisons/beauty-editorial.jpg',
    },
    promptTemplate: 'High-fashion editorial beauty, Western magazine cover style, sculpted bone structure, defined contouring, sharp winged eyeliner, bold statement lips, butterfly lighting setup, dramatic shadows, dark gradient background, Vogue Harper\'s Bazaar aesthetic, professional studio photography, confident and powerful gaze, ultra-detailed skin texture, 2K quality',
    negativePrompt: 'cute, soft, natural, low contrast, flat lighting, amateur, casual, warm tones, gentle',
    popularity: 700,
    isHot: false,
    accentColor: '#4A4A4A',
  },
  {
    id: 'beauty-milky',
    name: '奶油肌底 · 温柔气质',
    shortName: '奶油肌底',
    contentType: 'beauty',
    preview: {
      before: '/hero/hero-beauty-before.jpg',
      after: '/comparisons/beauty-milky.jpg',
    },
    promptTemplate: 'Soft matte creamy skin finish, velvet texture complexion, warm beige and milk tones, gentle natural makeup, soft defined brows, nude pink lips, warm diffused lighting, cozy and inviting atmosphere, lifestyle beauty photography, elegant and approachable, subtle glow without shine, refined and polished, 2K quality',
    negativePrompt: 'oily, glossy, high contrast, bold colors, dramatic, harsh lighting, cold tones, artificial',
    popularity: 680,
    isHot: false,
    accentColor: '#F5E6D3',
  },
  {
    id: 'beauty-oriental',
    name: '新中式 · 国风雅韵',
    shortName: '新中式',
    contentType: 'beauty',
    preview: {
      before: '/hero/hero-beauty-before.jpg',
      after: '/comparisons/beauty-oriental.jpg',
    },
    promptTemplate: 'Modern Chinese beauty aesthetic, contemporary oriental elegance, porcelain skin with subtle luminosity, refined brow shape, soft red gradient lips, elegant and graceful, warm ambient lighting, traditional Chinese color palette with modern twist, cultural sophistication, C-beauty editorial style, timeless oriental charm, artistic composition, 2K quality',
    negativePrompt: 'western makeup style, heavy contour, dramatic, cool tones, minimalist modern, casual, vintage retro',
    popularity: 720,
    isHot: false,
    accentColor: '#C41E3A',
  },
];

/**
 * 探店效果预设 (8个)
 */
export const CAFE_EFFECTS: EffectPreset[] = [
  {
    id: 'cafe-soft',
    name: '日系温柔 · 治愈氛围',
    shortName: '日系温柔',
    contentType: 'cafe',
    preview: {
      before: '/comparisons/cafe-1-original.jpg',
      after: '/comparisons/cafe-soft.jpg',
    },
    promptTemplate: 'Japanese cafe aesthetic, soft natural lighting, cozy atmosphere, muted warm tones, lifestyle photography, Kinfolk style, inviting and comfortable',
    negativePrompt: 'harsh fluorescent lighting, cluttered, empty, sterile',
    popularity: 800,
    isHot: true,
    accentColor: '#B8A99A',
  },
  {
    id: 'cafe-urban',
    name: '都市简约 · 现代感',
    shortName: '都市简约',
    contentType: 'cafe',
    preview: {
      before: '/comparisons/cafe-1-original.jpg',
      after: '/comparisons/cafe-urban.jpg',
    },
    promptTemplate: 'Modern urban cafe, clean lines, minimalist interior, cool neutral tones, professional architectural photography, contemporary aesthetic',
    negativePrompt: 'cluttered, warm rustic, vintage, messy',
    popularity: 650,
    isHot: false,
    accentColor: '#5E7A99',
  },
  {
    id: 'cafe-vintage',
    name: '复古怀旧 · 文艺氛围',
    shortName: '复古怀旧',
    contentType: 'cafe',
    preview: {
      before: '/comparisons/cafe-1-original.jpg',
      after: '/comparisons/cafe-vintage.jpg',
    },
    promptTemplate: 'Vintage cafe aesthetic, film photography look, warm nostalgic tones, retro interior, cozy and charming, artistic atmosphere',
    negativePrompt: 'modern, sterile, cold, digital sharp look',
    popularity: 580,
    isHot: false,
    accentColor: '#C9A86C',
  },
  // 后续效果待预览图制作完成后添加
];

/**
 * 旅游效果预设 (6个)
 */
export const TRAVEL_EFFECTS: EffectPreset[] = [
  {
    id: 'travel-soft',
    name: '清新自然 · 治愈风景',
    shortName: '清新自然',
    contentType: 'travel',
    preview: {
      before: '/comparisons/lifestyle-1-original.jpg',
      after: '/comparisons/travel-soft.jpg',
    },
    promptTemplate: 'Natural travel photography, soft daylight, scenic beauty, wanderlust feeling, peaceful atmosphere, landscape editorial, authentic travel moment',
    negativePrompt: 'tourist traps, crowded, artificial, cliche',
    popularity: 750,
    isHot: true,
    accentColor: '#87CEEB',
  },
  {
    id: 'travel-vintage',
    name: '复古胶片 · 旅行记忆',
    shortName: '复古胶片',
    contentType: 'travel',
    preview: {
      before: '/comparisons/lifestyle-1-original.jpg',
      after: '/comparisons/travel-vintage.jpg',
    },
    promptTemplate: 'Travel photography film look, Kodak Portra style, nostalgic vacation memories, warm vintage tones, cinematic travel documentary',
    negativePrompt: 'digital, sharp, modern, sterile',
    popularity: 620,
    isHot: false,
    accentColor: '#C9A86C',
  },
  // 后续效果待预览图制作完成后添加
];

/**
 * 美食效果预设 (6个)
 */
export const FOOD_EFFECTS: EffectPreset[] = [
  {
    id: 'food-soft',
    name: '清新自然 · 舒适氛围',
    shortName: '清新自然',
    contentType: 'food',
    preview: {
      before: '/comparisons/food-1-original.jpg',
      after: '/comparisons/food-soft.jpg',
    },
    promptTemplate: 'Natural food photography, soft daylight, appetizing presentation, cozy restaurant atmosphere, lifestyle food editorial, warm and inviting',
    negativePrompt: 'unappetizing, harsh flash, messy plating, artificial colors',
    popularity: 700,
    isHot: true,
    accentColor: '#E8D5B7',
  },
  {
    id: 'food-magazine',
    name: '杂志大片 · 精致高级',
    shortName: '杂志大片',
    contentType: 'food',
    preview: {
      before: '/comparisons/food-1-original.jpg',
      after: '/comparisons/food-magazine.jpg',
    },
    promptTemplate: 'High-end food photography, gourmet magazine cover style with elegant English text overlay, "GOURMET" masthead at top in bold sans-serif typography, "CULINARY ART" subtitle, "TASTE OF LUXURY" headline at bottom, professional studio lighting, elegant plating, culinary art, premium restaurant quality, magazine cover typography design',
    negativePrompt: 'casual, messy, amateur, poor lighting',
    popularity: 680,
    isHot: false,
    accentColor: '#D4AF37',
  },
  // 后续效果待预览图制作完成后添加
];

/**
 * 所有效果预设（按内容类型分组）
 */
export const EFFECT_PRESETS_BY_TYPE: Record<ContentType, EffectPreset[]> = {
  outfit: OUTFIT_EFFECTS,
  beauty: BEAUTY_EFFECTS,
  cafe: CAFE_EFFECTS,
  travel: TRAVEL_EFFECTS,
  food: FOOD_EFFECTS,
};

/**
 * 获取指定内容类型的效果列表
 */
export function getEffectsByContentType(contentType: ContentType): EffectPreset[] {
  return EFFECT_PRESETS_BY_TYPE[contentType] || OUTFIT_EFFECTS;
}

/**
 * 获取指定内容类型的默认效果 ID
 */
export function getDefaultEffectId(contentType: ContentType): string {
  const effects = getEffectsByContentType(contentType);
  // 优先返回热门效果，否则返回第一个
  const hotEffect = effects.find(e => e.isHot);
  return hotEffect ? hotEffect.id : (effects[0]?.id || 'outfit-magazine');
}

/**
 * 获取热门效果（用于推荐）
 */
export function getHotEffects(contentType: ContentType): EffectPreset[] {
  const effects = getEffectsByContentType(contentType);
  return effects.filter(e => e.isHot);
}

/**
 * 根据 ID 获取效果
 */
export function getEffectById(id: string): EffectPreset | undefined {
  for (const effects of Object.values(EFFECT_PRESETS_BY_TYPE)) {
    const effect = effects.find(e => e.id === id);
    if (effect) return effect;
  }
  return undefined;
}

/**
 * 获取效果的 Prompt（支持强度调整）
 */
export function getEffectPrompt(effectId: string, intensity: number = 100): string {
  const effect = getEffectById(effectId);
  if (!effect) return '';

  // intensity: 0-100，影响 Prompt 的强度描述
  const intensityModifier = intensity < 50
    ? 'subtle, gentle '
    : intensity > 80
    ? 'strong, pronounced '
    : '';

  return `${intensityModifier}${effect.promptTemplate}`;
}

/**
 * 兼容旧 API：从旧的 StyleType 转换为新的 EffectPreset
 */
export function convertStyleToEffect(styleType: string, contentType: ContentType): EffectPreset {
  const mapping: Record<string, string> = {
    magazine: `${contentType}-magazine`,
    soft: `${contentType}-soft`,
    urban: `${contentType}-urban`,
    vintage: `${contentType}-vintage`,
  };

  const effectId = mapping[styleType] || `${contentType}-magazine`;
  return getEffectById(effectId) || OUTFIT_EFFECTS[0];
}
