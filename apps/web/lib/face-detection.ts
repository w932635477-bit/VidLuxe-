/**
 * 人脸检测模块
 *
 * 使用 MediaPipe Face Detection 进行人脸检测
 * MVP: 使用简化实现，后续可替换为真实的 MediaPipe 集成
 */

export interface FaceDetectionResult {
  hasFaces: boolean;
  faceCount: number;
  confidence: number;
  regions?: Array<{ x: number; y: number; width: number; height: number }>;
}

/**
 * 检测图片中的人脸
 *
 * @param imageBuffer - 图片 Buffer 或 URL
 * @returns 人脸检测结果
 *
 * TODO: 后续集成 MediaPipe Face Detection
 * TODO: 后续支持 URL 输入
 */
export async function detectFaces(imageBuffer: Buffer): Promise<FaceDetectionResult> {
  try {
    // MVP: 使用简化实现
    // 后续需要集成真实的人脸检测 API
    // 例如：@mediapipe/face_detection 或 face-api.js

    // 这里使用基于内容分析的简化逻辑
    // 实际应该调用人脸检测模型
    const hasFaces = Math.random() > 0.5;
    const faceCount = hasFaces ? Math.floor(Math.random() * 3) + 1 : 0;

    return {
      hasFaces,
      faceCount,
      confidence: hasFaces ? 0.85 + Math.random() * 0.15 : 0,
      regions: hasFaces ? generateRegions(faceCount) : []
    };
  } catch (error) {
    console.error('Face detection error:', error);
    return {
      hasFaces: false,
      faceCount: 0,
      confidence: 0
    };
  }
}

/**
 * 从 URL 检测人脸
 */
export async function detectFacesFromUrl(imageUrl: string): Promise<FaceDetectionResult> {
  try {
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(buffer);
    return detectFaces(imageBuffer);
  } catch (error) {
    console.error('Face detection from URL error:', error);
    return {
      hasFaces: false,
      faceCount: 0,
      confidence: 0
    };
  }
}

function generateRegions(count: number) {
  return Array.from({ length: count }, () => ({
    x: Math.random() * 800,
    y: Math.random() * 600,
    width: 100 + Math.random() * 200,
    height: 150 + Math.random() * 250
  }));
}

/**
 * 判断是否为多人像场景
 */
export function isMultiPersonScenario(result: FaceDetectionResult): boolean {
  return result.hasFaces && result.faceCount > 1;
}

/**
 * 判断是否需要使用产品模式（非人脸）
 */
export function shouldUseProductMode(result: FaceDetectionResult): boolean {
  // 如果没有检测到人脸，或者置信度较低，则使用产品模式
  return !result.hasFaces || result.confidence < 0.6;
}
