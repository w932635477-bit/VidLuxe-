/**
 * Remotion Lambda 客户端
 *
 * 用于在云端渲染视频
 * MVP 阶段：本地渲染回退
 * 生产环境：AWS Lambda 渲染
 */

// 风格类型（与 StyleSelector 保持一致）
export type StyleType = 'magazine' | 'soft' | 'urban' | 'vintage';

// Remotion Lambda 配置
const REMOTION_CONFIG = {
  region: process.env.AWS_REGION || 'us-east-1',
  functionName: process.env.REMOTION_FUNCTION_NAME || 'vidluxe-render',
  bucketName: process.env.REMOTION_BUCKET_NAME || 'vidluxe-renders',
  // 是否使用 Lambda（需要有 AWS 配置）
  useLambda: Boolean(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.REMOTION_FUNCTION_NAME
  ),
};

// 视频渲染参数
export interface VideoRenderParams {
  backgroundUrl: string;
  foregroundUrl: string;
  styleType: StyleType;
  text?: {
    title?: string;
    subtitle?: string;
  };
  durationInSeconds?: number;
}

// 视频渲染结果
export interface VideoRenderResult {
  videoUrl: string;
  duration: number;
  size: number;
}

/**
 * 渲染视频
 *
 * 根据配置选择 Lambda 渲染或本地渲染
 */
export async function renderVideo(params: VideoRenderParams): Promise<VideoRenderResult> {
  if (REMOTION_CONFIG.useLambda) {
    return renderOnLambda(params);
  } else {
    // MVP 阶段：返回模拟结果或使用本地渲染
    return renderLocally(params);
  }
}

/**
 * Lambda 云端渲染
 */
async function renderOnLambda(params: VideoRenderParams): Promise<VideoRenderResult> {
  // 动态导入 @remotion/lambda（仅在需要时加载）
  const { renderMediaOnLambda } = await import('@remotion/lambda');

  const startTime = Date.now();

  // 调用 Lambda 渲染
  // Note: 类型使用 any 绕过版本差异，生产环境需要根据实际 Remotion 版本调整
  const result = await (renderMediaOnLambda as any)({
    region: REMOTION_CONFIG.region,
    functionName: REMOTION_CONFIG.functionName,
    serveUrl: getServeUrl(),
    composition: 'VidLuxeVideo',
    inputProps: {
      backgroundUrl: params.backgroundUrl,
      foregroundUrl: params.foregroundUrl,
      styleType: params.styleType,
      text: params.text,
    },
    codec: 'h264',
    maxRetries: 3,
  });

  // 兼容不同版本的返回格式
  const outputUrl = (result as any).url || (result as any).outputUrl || params.backgroundUrl;
  const outputSize = (result as any).size || (result as any).outputSize || 0;

  return {
    videoUrl: outputUrl,
    duration: (Date.now() - startTime) / 1000,
    size: outputSize,
  };
}

/**
 * 本地渲染（MVP 回退方案）
 */
async function renderLocally(params: VideoRenderParams): Promise<VideoRenderResult> {
  console.log('[Remotion] Local rendering not available in MVP, returning placeholder');

  // MVP 阶段：返回背景图作为"视频封面"
  // 实际视频渲染需要在生产环境使用 Lambda
  return {
    videoUrl: params.backgroundUrl,
    duration: params.durationInSeconds || 5,
    size: 0,
  };
}

/**
 * 获取 Remotion 项目部署 URL
 */
function getServeUrl(): string {
  // 生产环境：使用已部署的 S3 URL
  // 开发环境：需要先部署项目
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/api/remotion/serve`;
}

/**
 * 部署 Remotion 项目到 AWS
 *
 * 仅在生产环境初次设置时需要调用
 */
export async function deployRemotionProject(): Promise<string> {
  if (!REMOTION_CONFIG.useLambda) {
    throw new Error('AWS credentials not configured');
  }

  const { deploySite } = await import('@remotion/lambda');

  const result = await deploySite({
    region: REMOTION_CONFIG.region as any,
    bucketName: REMOTION_CONFIG.bucketName,
    entryPoint: './remotion/index.ts',
    siteName: 'vidluxe-video',
  });

  console.log('[Remotion] Site deployed:', result.serveUrl);
  return result.serveUrl;
}

/**
 * 检查 Remotion Lambda 配置状态
 */
export function getRemotionStatus(): {
  configured: boolean;
  region?: string;
  functionName?: string;
  bucketName?: string;
} {
  return {
    configured: REMOTION_CONFIG.useLambda,
    region: REMOTION_CONFIG.region,
    functionName: REMOTION_CONFIG.functionName,
    bucketName: REMOTION_CONFIG.bucketName,
  };
}

/**
 * 创建 Lambda 函数
 *
 * 仅在首次设置时需要调用
 */
export async function createLambdaFunction(): Promise<string> {
  const { deployFunction } = await import('@remotion/lambda');

  const result = await deployFunction({
    region: REMOTION_CONFIG.region as any,
    timeoutInSeconds: 120,
    memorySizeInMb: 2048,
    createCloudWatchLogGroup: true,
  });

  console.log('[Remotion] Function created:', result.functionName);
  return result.functionName;
}
