// Nano Banana API 客户端（国内代理 evolink.ai）

export interface NanoBananaConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export interface ImageGenerationRequest {
  prompt: string;
  size?: 'auto' | '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';
  quality?: '1K' | '2K' | '4K';
  imageUrls?: string[];
  callbackUrl?: string;
}

export interface TaskResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  created: number;
  model: string;
  type: 'image' | 'video' | 'audio' | 'text';
  object: string;
  taskInfo?: {
    canCancel: boolean;
    estimatedTime?: number;
  };
  usage?: {
    billingRule: string;
    creditsReserved: number;
    userGroup: string;
  };
}

export interface TaskResult extends TaskResponse {
  results?: string[];
}

export class NanoBananaClient {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(config: NanoBananaConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.evolink.ai';
    this.model = config.model || 'nano-banana-2-lite';
  }

  /**
   * 创建图片生成任务
   */
  async createImageTask(request: ImageGenerationRequest): Promise<TaskResponse> {
    const response = await fetch(`${this.baseUrl}/v1/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        prompt: request.prompt,
        size: request.size || '9:16', // 默认竖版
        quality: request.quality || '2K',
        image_urls: request.imageUrls,
        callback_url: request.callbackUrl,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new NanoBananaError(error.error?.message || 'Failed to create task', response.status);
    }

    return response.json();
  }

  /**
   * 查询任务状态
   */
  async getTaskStatus(taskId: string): Promise<TaskResult> {
    const response = await fetch(`${this.baseUrl}/v1/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new NanoBananaError(error.error?.message || 'Failed to get task status', response.status);
    }

    return response.json();
  }

  /**
   * 轮询等待任务完成
   */
  async waitForCompletion(
    taskId: string,
    options?: {
      pollInterval?: number;
      timeout?: number;
      onProgress?: (progress: number) => void;
    }
  ): Promise<TaskResult> {
    const pollInterval = options?.pollInterval || 2000;
    const timeout = options?.timeout || 120000; // 2 minutes
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const result = await this.getTaskStatus(taskId);

      if (options?.onProgress) {
        options.onProgress(result.progress);
      }

      if (result.status === 'completed') {
        return result;
      }

      if (result.status === 'failed') {
        throw new NanoBananaError('Task failed', 500);
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new NanoBananaError('Task timeout', 408);
  }

  /**
   * 升级图片（便捷方法）
   */
  async enhanceImage(
    imageUrl: string,
    style: StyleType,
    options?: {
      onProgress?: (progress: number) => void;
    }
  ): Promise<string> {
    const prompt = getStylePrompt(style);

    const task = await this.createImageTask({
      prompt,
      imageUrls: [imageUrl],
      size: '9:16',
      quality: '2K',
    });

    const result = await this.waitForCompletion(task.id, {
      onProgress: options?.onProgress,
    });

    if (!result.results || result.results.length === 0) {
      throw new NanoBananaError('No results returned', 500);
    }

    return result.results[0];
  }
}

export class NanoBananaError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = 'NanoBananaError';
  }
}

// 风格类型
export type StyleType = 'magazine' | 'soft' | 'urban' | 'vintage';

// 风格对应的 Prompt
export function getStylePrompt(style: StyleType): string {
  const prompts: Record<StyleType, string> = {
    magazine: `
      Vogue magazine editorial style, luxury fashion aesthetic,
      warm golden lighting, sophisticated and elegant,
      professional model photography, high-end beauty editorial,
      warm beige and champagne tones, cinematic background,
      soft studio lighting, premium quality, editorial composition
    `,
    soft: `
      Japanese lifestyle magazine style, soft natural lighting,
      muted pastel colors, Kinfolk aesthetic, dreamy atmosphere,
      gentle and warm, artistic and refined, low saturation,
      earthy tones, natural and authentic, editorial quality
    `,
    urban: `
      Apple keynote style, clean professional background,
      cool blue-gray tones, corporate executive aesthetic,
      modern minimalist, trustworthy and authoritative,
      soft diffused lighting, sharp details, premium corporate style
    `,
    vintage: `
      Kodak Portra 400 film look, vintage aesthetic,
      warm film grain, cinematic color grading,
      nostalgic atmosphere, retro style, artistic,
      soft highlights, subtle vignette, analog photography feel
    `,
  };

  return prompts[style].trim().replace(/\s+/g, ' ');
}

// 单例实例
let nanoBananaClient: NanoBananaClient | null = null;

export function getNanoBananaClient(): NanoBananaClient {
  if (!nanoBananaClient) {
    const apiKey = process.env.NEXT_PUBLIC_NANO_BANANA_API_KEY;
    if (!apiKey) {
      throw new Error('NEXT_PUBLIC_NANO_BANANA_API_KEY is not set');
    }
    nanoBananaClient = new NanoBananaClient({ apiKey });
  }
  return nanoBananaClient;
}
