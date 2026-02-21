/**
 * 风格 Prompt 模板
 *
 * 定义 5 种预设风格的 Prompt 模板
 * 用于 Nano Banana API 调用
 */

// 预设风格类型
export type PresetStyle = 'magazine' | 'soft' | 'urban' | 'minimal' | 'vintage';

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

// 5 种预设风格配置
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

  minimal: {
    id: 'minimal',
    name: '高级极简',
    nameEn: 'Minimal',
    description: '极简干净，Apple 风格',
    prompt: `
      Apple product photography style, pure minimal background,
      dramatic lighting, high contrast, clean composition,
      generous negative space, elegant and refined,
      charcoal to soft gray gradient, professional studio quality
    `.trim().replace(/\s+/g, ' '),
    negativePrompt: `
      cluttered, busy, colorful, textured, patterned,
      ornate, decorative, complex
    `.trim().replace(/\s+/g, ' '),
    colors: ['#8E8E93', '#636366', '#AEAEB2'],
    suitableFor: ['产品展示', '静物', '护肤品', '数码产品'],
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
 */
export function buildEnhancePrompt(params: {
  style: PresetStyle;
  contentType: 'image' | 'video';
  customKeywords?: string[];
}): string {
  const { style, contentType, customKeywords = [] } = params;
  const styleConfig = getStyleConfig(style);

  const basePrompt = styleConfig.prompt;

  // 根据内容类型添加额外描述
  const contentTypePrompt = contentType === 'video'
    ? 'suitable for video background, consistent style across frames'
    : 'high resolution, detailed';

  // 添加自定义关键词
  const keywordsPrompt = customKeywords.length > 0
    ? customKeywords.join(', ')
    : '';

  return [basePrompt, contentTypePrompt, keywordsPrompt]
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
