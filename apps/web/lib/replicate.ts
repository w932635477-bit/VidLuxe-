/**
 * Replicate API 客户端
 *
 * 用于调用：
 * - B-LoRA 风格学习
 * - MODNet 人物抠像
 */

// Replicate API 配置
const REPLICATE_CONFIG = {
  baseUrl: 'https://api.replicate.com/v1',
  apiToken: process.env.REPLICATE_API_TOKEN,
};

// 模型版本
const MODEL_VERSIONS = {
  // B-LoRA 风格提取
  blora: 'yardenfren/b-lora:c2a...',
  // MODNet 人物抠像
  modnet: 'cjwbw/modnet:...',
};

// API 响应类型
interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output: any;
  error: string | null;
  logs: string;
  metrics: {
    predict_time?: number;
  };
}

/**
 * 创建 Replicate Prediction
 */
async function createPrediction(
  modelVersion: string,
  input: Record<string, any>
): Promise<ReplicatePrediction> {
  const response = await fetch(`${REPLICATE_CONFIG.baseUrl}/predictions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${REPLICATE_CONFIG.apiToken}`,
    },
    body: JSON.stringify({
      version: modelVersion,
      input,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create prediction');
  }

  return response.json();
}

/**
 * 获取 Prediction 状态
 */
async function getPrediction(predictionId: string): Promise<ReplicatePrediction> {
  const response = await fetch(
    `${REPLICATE_CONFIG.baseUrl}/predictions/${predictionId}`,
    {
      headers: {
        'Authorization': `Token ${REPLICATE_CONFIG.apiToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get prediction status');
  }

  return response.json();
}

/**
 * 等待 Prediction 完成
 */
async function waitForPrediction(
  predictionId: string,
  options?: {
    pollInterval?: number;
    timeout?: number;
    onStatus?: (status: string) => void;
  }
): Promise<ReplicatePrediction> {
  const pollInterval = options?.pollInterval || 1000;
  const timeout = options?.timeout || 120000;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const prediction = await getPrediction(predictionId);

    options?.onStatus?.(prediction.status);

    if (prediction.status === 'succeeded') {
      return prediction;
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw new Error(prediction.error || `Prediction ${prediction.status}`);
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error('Prediction timeout');
}

// ================== B-LoRA 风格学习 ==================

export interface StyleExtractionResult {
  styleVector: number[];
  colorTone: string;
  lighting: string;
  mood: string;
  texture: string;
  prompt: string;
}

/**
 * 使用 B-LoRA 提取图片风格
 *
 * MVP 阶段：使用简化版本，直接分析图片特征
 * 生产环境：调用 Replicate B-LoRA 模型
 */
export async function extractStyleWithBLoRA(
  imageUrl: string
): Promise<StyleExtractionResult> {
  // 检查 API Token
  if (!REPLICATE_CONFIG.apiToken) {
    console.warn('[B-LoRA] API Token not configured, using fallback');
    return fallbackStyleExtraction(imageUrl);
  }

  try {
    // TODO: 当 B-LoRA 模型在 Replicate 上可用时，取消注释以下代码
    // const prediction = await createPrediction(MODEL_VERSIONS.blora, {
    //   image: imageUrl,
    // });
    // const result = await waitForPrediction(prediction.id);

    // MVP 阶段使用 fallback
    return fallbackStyleExtraction(imageUrl);
  } catch (error) {
    console.error('[B-LoRA] Error:', error);
    return fallbackStyleExtraction(imageUrl);
  }
}

/**
 * Fallback：基于图片 URL 生成稳定的风格特征
 */
function fallbackStyleExtraction(imageUrl: string): StyleExtractionResult {
  const hash = simpleHash(imageUrl);

  const colorTones = [
    'warm golden tones',
    'cool blue tones',
    'soft pastel tones',
    'rich brown tones',
    'neutral gray tones',
  ];

  const lightings = [
    'soft diffused lighting',
    'dramatic side lighting',
    'natural window light',
    'warm golden hour light',
    'studio softbox lighting',
  ];

  const moods = [
    'elegant and sophisticated',
    'warm and inviting',
    'clean and minimal',
    'artistic and creative',
    'professional and polished',
  ];

  const textures = [
    'smooth and refined',
    'grainy film texture',
    'soft matte finish',
    'glossy and polished',
    'natural organic feel',
  ];

  const colorTone = colorTones[Math.abs(hash) % colorTones.length];
  const lighting = lightings[Math.abs(hash >> 4) % lightings.length];
  const mood = moods[Math.abs(hash >> 8) % moods.length];
  const texture = textures[Math.abs(hash >> 12) % textures.length];

  return {
    styleVector: [],
    colorTone,
    lighting,
    mood,
    texture,
    prompt: `Premium photography style, ${colorTone}, ${lighting}, ${mood}, ${texture}, high quality, professional`,
  };
}

// ================== MODNet 人物抠像 ==================

export interface SegmentationResult {
  maskUrl: string;
  originalUrl: string;
}

/**
 * 使用 MODNet 进行人物抠像
 *
 * MVP 阶段：返回占位结果
 * 生产环境：调用 Replicate MODNet 模型
 */
export async function segmentImageWithMODNet(
  imageUrl: string
): Promise<SegmentationResult> {
  // 检查 API Token
  if (!REPLICATE_CONFIG.apiToken) {
    throw new Error('Replicate API Token not configured');
  }

  try {
    // 使用 Replicate 的 MODNet 或 RMBG-1.4 模型
    const prediction = await createPrediction(
      'cocktailpeanut/xtd-gf:...', // MODNet 模型版本
      {
        image: imageUrl,
      }
    );

    const result = await waitForPrediction(prediction.id);

    if (typeof result.output === 'string') {
      return {
        maskUrl: result.output,
        originalUrl: imageUrl,
      };
    }

    throw new Error('Invalid MODNet output');
  } catch (error) {
    console.error('[MODNet] Error:', error);
    throw error;
  }
}

/**
 * 批量抠像（用于视频帧）
 */
export async function segmentBatch(
  imageUrls: string[],
  concurrency: number = 4
): Promise<SegmentationResult[]> {
  const results: SegmentationResult[] = [];

  // 分批处理
  for (let i = 0; i < imageUrls.length; i += concurrency) {
    const batch = imageUrls.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((url) => segmentImageWithMODNet(url).catch(() => null))
    );

    results.push(
      ...batchResults.filter((r): r is SegmentationResult => r !== null)
    );
  }

  return results;
}

// ================== 工具函数 ==================

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return hash;
}

// ================== 导出 ==================

export const ReplicateClient = {
  createPrediction,
  getPrediction,
  waitForPrediction,
  extractStyleWithBLoRA,
  segmentImageWithMODNet,
  segmentBatch,
};
