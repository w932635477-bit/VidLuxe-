/**
 * B-LoRA 风格提取模块
 *
 * 从参考图片中提取风格特征
 * 用于实现"上传参考图学习风格"功能
 */

import type { PresetStyle } from './style-prompts';
import { STYLE_PRESETS, getStyleConfig } from './style-prompts';

// 风格 Profile
export interface StyleProfile {
  id: string;
  source: 'reference' | 'preset';
  // 风格特征
  features: {
    colorTone: string;
    lighting: string;
    mood: string;
    texture: string;
  };
  // 生成的 Prompt
  prompt: string;
  // 参考图 URL（如果有）
  referenceUrl?: string;
  // 预设风格 ID（如果有）
  presetStyle?: PresetStyle;
}

// B-LoRA API 配置
const BLORA_CONFIG = {
  // API 端点（待确认）
  baseUrl: process.env.BLORA_API_URL || 'https://api.evolink.ai',
  apiKey: process.env.BLORA_API_KEY || process.env.NEXT_PUBLIC_NANO_BANANA_API_KEY,
  // 超时时间
  timeout: 60000,
};

/**
 * 从参考图片提取风格特征
 *
 * MVP 阶段：使用简化的特征提取
 * 生产环境：接入 B-LoRA API
 */
export async function extractStyleFromReference(
  referenceUrl: string
): Promise<StyleProfile> {
  try {
    // 获取参考图片信息
    const response = await fetch(referenceUrl, { method: 'HEAD' });
    const contentType = response.headers.get('content-type') || '';

    // MVP 阶段：基于图片 URL 生成风格特征
    // 生产环境应调用 B-LoRA API 进行真正的风格提取
    const features = await analyzeReferenceImage(referenceUrl);

    // 生成风格 Prompt
    const prompt = buildStylePrompt(features);

    return {
      id: `style_ref_${Date.now()}`,
      source: 'reference',
      features,
      prompt,
      referenceUrl,
    };
  } catch (error) {
    console.error('[StyleProfile] Failed to extract style:', error);
    // 返回默认风格
    return getDefaultStyleProfile();
  }
}

/**
 * 从预设获取风格 Profile
 */
export function getStyleProfileFromPreset(style: PresetStyle): StyleProfile {
  const config = getStyleConfig(style);

  // 解析预设的 Prompt 提取特征
  const features = parsePromptToFeatures(config.prompt);

  return {
    id: `style_preset_${style}`,
    source: 'preset',
    features,
    prompt: config.prompt,
    presetStyle: style,
  };
}

/**
 * 获取风格 Profile（统一入口）
 */
export async function getStyleProfile(params: {
  sourceType: 'reference' | 'preset';
  referenceUrl?: string;
  presetStyle?: PresetStyle;
}): Promise<StyleProfile> {
  if (params.sourceType === 'reference' && params.referenceUrl) {
    return extractStyleFromReference(params.referenceUrl);
  } else if (params.sourceType === 'preset' && params.presetStyle) {
    return getStyleProfileFromPreset(params.presetStyle);
  }

  // 默认返回 magazine 风格
  return getStyleProfileFromPreset('magazine');
}

/**
 * 分析参考图片（简化版）
 */
async function analyzeReferenceImage(imageUrl: string): Promise<StyleProfile['features']> {
  // MVP 阶段：基于 URL 生成稳定的风格特征
  // 生产环境应使用 CV 模型分析图片

  const hash = simpleHash(imageUrl);

  // 色调选项
  const colorTones = [
    'warm golden tones',
    'cool blue tones',
    'soft pastel tones',
    'rich brown tones',
    'neutral gray tones',
  ];

  // 光线选项
  const lightings = [
    'soft diffused lighting',
    'dramatic side lighting',
    'natural window light',
    'warm golden hour light',
    'studio softbox lighting',
  ];

  // 氛围选项
  const moods = [
    'elegant and sophisticated',
    'warm and inviting',
    'clean and minimal',
    'artistic and creative',
    'professional and polished',
  ];

  // 质感选项
  const textures = [
    'smooth and refined',
    'grainy film texture',
    'soft matte finish',
    'glossy and polished',
    'natural organic feel',
  ];

  return {
    colorTone: colorTones[Math.abs(hash) % colorTones.length],
    lighting: lightings[Math.abs(hash >> 4) % lightings.length],
    mood: moods[Math.abs(hash >> 8) % moods.length],
    texture: textures[Math.abs(hash >> 12) % textures.length],
  };
}

/**
 * 根据特征构建风格 Prompt
 */
function buildStylePrompt(features: StyleProfile['features']): string {
  return `
    Premium photography style, ${features.colorTone},
    ${features.lighting}, ${features.mood},
    ${features.texture}, high quality, professional,
    magazine editorial aesthetic, refined composition
  `.trim().replace(/\s+/g, ' ');
}

/**
 * 从 Prompt 解析特征
 */
function parsePromptToFeatures(prompt: string): StyleProfile['features'] {
  // 简单的特征提取
  const features: StyleProfile['features'] = {
    colorTone: 'balanced tones',
    lighting: 'professional lighting',
    mood: 'refined and elegant',
    texture: 'high quality finish',
  };

  const lowerPrompt = prompt.toLowerCase();

  // 提取色调
  if (lowerPrompt.includes('warm') || lowerPrompt.includes('golden')) {
    features.colorTone = 'warm golden tones';
  } else if (lowerPrompt.includes('cool') || lowerPrompt.includes('blue')) {
    features.colorTone = 'cool blue tones';
  } else if (lowerPrompt.includes('muted') || lowerPrompt.includes('pastel')) {
    features.colorTone = 'soft pastel tones';
  }

  // 提取光线
  if (lowerPrompt.includes('soft') || lowerPrompt.includes('diffused')) {
    features.lighting = 'soft diffused lighting';
  } else if (lowerPrompt.includes('dramatic')) {
    features.lighting = 'dramatic lighting';
  } else if (lowerPrompt.includes('natural')) {
    features.lighting = 'natural lighting';
  }

  return features;
}

/**
 * 获取默认风格 Profile
 */
function getDefaultStyleProfile(): StyleProfile {
  return getStyleProfileFromPreset('magazine');
}

/**
 * 简单的字符串 hash
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return hash;
}
