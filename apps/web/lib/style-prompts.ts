/**
 * 风格 Prompt 模板
 *
 * 定义 4 种预设风格的 Prompt 模板
 * 用于 Nano Banana API 调用
 */

import type { ContentType } from './content-types';

// 预设风格类型
export type PresetStyle = 'magazine' | 'soft' | 'urban' | 'vintage';

// 风格配置
export interface StyleConfig {
  id: PresetStyle;
  name: string;
  nameEn: string;
  description: string;
  prompt: string;
  negativePrompt: string;
  colors: string[];
  suitableFor: string[];
}

// 4 种主要预设风格配置（前端批量生成使用）
export const STYLE_PRESETS: Record<PresetStyle, StyleConfig> = {
  magazine: {
    id: 'magazine',
    name: '杂志大片',
    nameEn: 'Magazine',
    description: '时尚杂志封面质感，高级奢华',
    prompt: `
      Vogue magazine editorial style, luxury fashion aesthetic,
      warm golden lighting, sophisticated and elegant,
      professional model photography, high-end beauty editorial,
      warm beige and champagne tones, cinematic background,
      soft studio lighting, premium quality, editorial composition
    `.trim().replace(/\s+/g, ' '),
    negativePrompt: `
      amateur, low quality, blurry, distorted, ugly,
      bad anatomy, bad proportions, watermark, signature
    `.trim().replace(/\s+/g, ' '),
    colors: ['#D4AF37', '#8B6914', '#2C1810'],
    suitableFor: ['穿搭', '美妆', '奢侈品', '时尚博主'],
  },

  soft: {
    id: 'soft',
    name: '温柔日系',
    nameEn: 'Soft',
    description: '清新温柔，文艺治愈感',
    prompt: `
      Japanese lifestyle magazine style, soft natural lighting,
      muted pastel colors, Kinfolk aesthetic, dreamy atmosphere,
      gentle and warm, artistic and refined, low saturation,
      earthy tones, natural and authentic, editorial quality
    `.trim().replace(/\s+/g, ' '),
    negativePrompt: `
      harsh lighting, high contrast, neon colors,
      artificial, flashy, bold, aggressive
    `.trim().replace(/\s+/g, ' '),
    colors: ['#B8A99A', '#9A8A7A', '#D4C5B9'],
    suitableFor: ['生活方式', '探店', '美食', '家居'],
  },

  urban: {
    id: 'urban',
    name: '都市职场',
    nameEn: 'Urban',
    description: '专业干练，可信赖感',
    prompt: `
      Apple keynote style, clean professional background,
      cool blue-gray tones, corporate executive aesthetic,
      modern minimalist, trustworthy and authoritative,
      soft diffused lighting, sharp details, premium corporate style
    `.trim().replace(/\s+/g, ' '),
    negativePrompt: `
      casual, messy, warm tones, rustic, vintage,
      playful, informal, cluttered
    `.trim().replace(/\s+/g, ' '),
    colors: ['#5E7A99', '#3D5A80', '#6B8AAD'],
    suitableFor: ['职场', '知识分享', '科技', '财经'],
  },

  vintage: {
    id: 'vintage',
    name: '复古胶片',
    nameEn: 'Vintage',
    description: '复古怀旧，电影氛围感',
    prompt: `
      Kodak Portra 400 film look, vintage aesthetic,
      warm film grain, cinematic color grading,
      nostalgic atmosphere, retro style, artistic,
      soft highlights, subtle vignette, analog photography feel
    `.trim().replace(/\s+/g, ' '),
    negativePrompt: `
      digital, sharp, clean, modern, sterile,
      oversaturated, HDR, artificial lighting
    `.trim().replace(/\s+/g, ' '),
    colors: ['#C9A86C', '#8B7355', '#D4B896'],
    suitableFor: ['人像', '旅行', '文艺内容', '复古穿搭'],
  },
};

/**
 * 获取风格配置
 */
export function getStyleConfig(style: PresetStyle): StyleConfig {
  return STYLE_PRESETS[style] || STYLE_PRESETS.magazine;
}

/**
 * 获取风格 Prompt
 */
export function getStylePrompt(style: PresetStyle): string {
  return getStyleConfig(style).prompt;
}

/**
 * 获取负面 Prompt
 */
export function getNegativePrompt(style: PresetStyle): string {
  return getStyleConfig(style).negativePrompt;
}

/**
 * 构建完整的图片升级 Prompt
 * 支持内容类型增强词
 */
export function buildEnhancePrompt(params: {
  style: PresetStyle;
  contentType?: ContentType;
  mediaType?: 'image' | 'video';
  customKeywords?: string[];
}): string {
  const { style, contentType, mediaType = 'image', customKeywords = [] } = params;
  const styleConfig = getStyleConfig(style);

  // 基础风格 Prompt
  const basePrompt = styleConfig.prompt;

  // 内容类型增强词
  let contentPrompt = '';
  if (contentType) {
    const { getContentTypeConfig } = require('./content-types');
    const contentConfig = getContentTypeConfig(contentType);
    contentPrompt = contentConfig.keywords;
  }

  // 媒体类型描述
  const mediaPrompt = mediaType === 'video'
    ? 'suitable for video background, consistent style across frames'
    : '';

  // 质量保证词
  const qualityPrompt = '8K, high resolution, professional photography, premium quality, sharp details';

  // 自定义关键词
  const keywordsPrompt = customKeywords.length > 0 ? customKeywords.join(', ') : '';

  return [basePrompt, contentPrompt, mediaPrompt, qualityPrompt, keywordsPrompt]
    .filter(Boolean)
    .join(', ');
}

/**
 * 构建增强版负面 Prompt
 * 支持内容类型负面词
 */
export function buildEnhanceNegativePrompt(params: {
  style: PresetStyle;
  contentType?: ContentType;
}): string {
  const { style, contentType } = params;
  const styleConfig = getStyleConfig(style);

  // 基础负面 Prompt
  const baseNegative = styleConfig.negativePrompt;

  // 内容类型负面词
  let contentNegative = '';
  if (contentType) {
    const { getContentTypeConfig } = require('./content-types');
    const contentConfig = getContentTypeConfig(contentType);
    contentNegative = contentConfig.negativeKeywords;
  }

  // 通用负面词
  const generalNegative = 'low quality, blurry, distorted, watermark, signature, amateur, bad anatomy';

  return [baseNegative, contentNegative, generalNegative]
    .filter(Boolean)
    .join(', ');
}

/**
 * 构建视频背景生成 Prompt
 */
export function buildVideoBackgroundPrompt(params: {
  style: PresetStyle;
  keywords?: string[];
}): string {
  const { style, keywords = [] } = params;
  const styleConfig = getStyleConfig(style);

  return `
    ${styleConfig.prompt},
    video background, 9:16 vertical format,
    no text, no people, abstract or scenic,
    suitable for overlay content,
    ${keywords.join(', ')}
  `.trim().replace(/\s+/g, ' ');
}

/**
 * 风格描述文本（用于 UI 显示）
 */
export function getStyleDescription(style: PresetStyle): string {
  const config = getStyleConfig(style);
  return `${config.name} · ${config.description}`;
}
