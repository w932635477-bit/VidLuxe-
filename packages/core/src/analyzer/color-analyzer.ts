/**
 * ColorAnalyzer - Premium Color Analysis Engine
 *
 * Analyzes video frames for premium color quality metrics
 */

import type {
  ColorAnalysis,
  RGBColor,
  PremiumStyle,
  PremiumProfile,
  PREMIUM_PROFILES,
} from '@vidluxe/types';
import { PREMIUM_PROFILES as profiles } from '@vidluxe/types';

// ============================================================================
// Configuration
// ============================================================================

export interface ColorAnalyzerConfig {
  sampleFrames?: number;      // 采样帧数，默认 30
  histogramBins?: number;     // 直方图桶数，默认 256
  logger?: Console;
}

// ============================================================================
// Color Analyzer
// ============================================================================

export class ColorAnalyzer {
  private readonly config: Required<ColorAnalyzerConfig>;

  constructor(config: ColorAnalyzerConfig = {}) {
    this.config = {
      sampleFrames: config.sampleFrames ?? 30,
      histogramBins: config.histogramBins ?? 256,
      logger: config.logger ?? console,
    };
  }

  /**
   * Analyze a single frame (ImageData)
   * This is the main entry point for browser/Remotion usage
   */
  analyzeFrame(imageData: ImageData): ColorAnalysis {
    const data = imageData.data;
    const pixelCount = data.length / 4;

    // 计算基础统计
    const saturation = this.calculateSaturation(data, pixelCount);
    const brightness = this.calculateBrightness(data, pixelCount);
    const contrast = this.calculateContrast(brightness);
    const dominantColors = this.extractDominantColors(data, pixelCount, 5);

    // 计算高级指标
    const colorHarmony = this.calculateColorHarmony(dominantColors);
    const colorTemperature = this.estimateColorTemperature(dominantColors);

    // 生成评分和建议
    const { score, issues, suggestions } = this.evaluatePremiumQuality({
      saturation,
      brightness,
      contrast,
      dominantColors,
      colorHarmony,
      colorTemperature,
      colorConsistency: 1.0, // 单帧分析，默认为1
    });

    return {
      saturation,
      brightness,
      contrast,
      dominantColors,
      colorCount: dominantColors.length,
      colorTemperature,
      colorHarmony,
      colorConsistency: 1.0,
      premiumScore: score,
      issues,
      suggestions,
    };
  }

  /**
   * Analyze multiple frames for video-level analysis
   */
  analyzeFrames(frames: ImageData[]): ColorAnalysis {
    if (frames.length === 0) {
      throw new Error('No frames to analyze');
    }

    const analyses = frames.map(frame => this.analyzeFrame(frame));

    // 聚合所有帧的统计数据
    const saturation = this.aggregateMetric(analyses.map(a => a.saturation));
    const brightness = this.aggregateMetric(analyses.map(a => a.brightness));

    // 计算帧间一致性
    const colorConsistency = this.calculateFrameConsistency(analyses);

    // 使用中间帧的颜色分析
    const midFrame = analyses[Math.floor(analyses.length / 2)];

    const contrast = {
      ratio: midFrame.contrast.ratio,
      score: midFrame.contrast.score,
    };

    const dominantColors = midFrame.dominantColors;
    const colorHarmony = analyses.reduce((sum, a) => sum + a.colorHarmony, 0) / analyses.length;
    const colorTemperature = midFrame.colorTemperature;

    // 生成评分和建议
    const { score, issues, suggestions } = this.evaluatePremiumQuality({
      saturation,
      brightness,
      contrast,
      dominantColors,
      colorHarmony,
      colorTemperature,
      colorConsistency,
    });

    return {
      saturation,
      brightness,
      contrast,
      dominantColors,
      colorCount: dominantColors.length,
      colorTemperature,
      colorHarmony,
      colorConsistency,
      premiumScore: score,
      issues,
      suggestions,
    };
  }

  // ===========================================================================
  // Private Methods - Metric Calculations
  // ===========================================================================

  private calculateSaturation(data: Uint8ClampedArray, pixelCount: number) {
    let sum = 0;
    let sumSq = 0;
    let highCount = 0;
    const threshold = 0.6;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const l = (max + min) / 2;

      let s = 0;
      if (max !== min) {
        s = l > 0.5
          ? (max - min) / (2 - max - min)
          : (max - min) / (max + min);
      }

      sum += s;
      sumSq += s * s;
      if (s > threshold) highCount++;
    }

    const mean = sum / pixelCount;
    const std = Math.sqrt(sumSq / pixelCount - mean * mean);
    const highRatio = highCount / pixelCount;

    return { mean, std, highRatio };
  }

  private calculateBrightness(data: Uint8ClampedArray, pixelCount: number) {
    let sum = 0;
    let sumSq = 0;

    for (let i = 0; i < data.length; i += 4) {
      // 使用感知亮度公式
      const b = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
      sum += b;
      sumSq += b * b;
    }

    const mean = sum / pixelCount;
    const std = Math.sqrt(sumSq / pixelCount - mean * mean);

    return { mean, std };
  }

  private calculateContrast(brightness: { mean: number; std: number }) {
    // 使用标准差作为对比度的近似
    const ratio = brightness.std * 4; // 简化的对比度比率

    // 评分：对比度在 0.15-0.35 之间最佳
    let score = 100;
    if (brightness.std < 0.1) {
      score = 40 + (brightness.std / 0.1) * 30;
    } else if (brightness.std > 0.35) {
      score = 100 - ((brightness.std - 0.35) / 0.2) * 40;
    }

    return { ratio: Math.min(ratio, 21), score: Math.max(0, Math.min(100, score)) };
  }

  private extractDominantColors(
    data: Uint8ClampedArray,
    pixelCount: number,
    maxColors: number
  ): RGBColor[] {
    // 简化的颜色提取 - 使用颜色量化
    const colorMap = new Map<string, { count: number; r: number; g: number; b: number }>();
    const quantization = 32; // 量化步长

    for (let i = 0; i < data.length; i += 4) {
      const r = Math.floor(data[i] / quantization) * quantization;
      const g = Math.floor(data[i + 1] / quantization) * quantization;
      const b = Math.floor(data[i + 2] / quantization) * quantization;

      // 跳过接近黑色或白色的颜色
      const brightness = (r + g + b) / 3;
      if (brightness < 20 || brightness > 235) continue;

      const key = `${r},${g},${b}`;
      const existing = colorMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        colorMap.set(key, { count: 1, r, g, b });
      }
    }

    // 排序并取前 N 个颜色
    const sortedColors = Array.from(colorMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, maxColors * 2); // 取多一些然后去重

    // 去除相似颜色
    const result: RGBColor[] = [];
    for (const color of sortedColors) {
      if (result.length >= maxColors) break;

      const isSimilar = result.some(existing => {
        const diff = Math.abs(existing.r - color.r) +
                     Math.abs(existing.g - color.g) +
                     Math.abs(existing.b - color.b);
        return diff < 64; // 颜色差异阈值
      });

      if (!isSimilar) {
        result.push({
          r: color.r,
          g: color.g,
          b: color.b,
          hex: this.rgbToHex(color.r, color.g, color.b),
        });
      }
    }

    return result;
  }

  private calculateColorHarmony(colors: RGBColor[]): number {
    if (colors.length < 2) return 1;

    // 简化的色彩和谐度计算
    // 基于颜色之间的角度差异
    const hues = colors.map(c => this.rgbToHsl(c.r, c.g, c.b).h);

    // 计算色调差异的标准差
    const mean = hues.reduce((a, b) => a + b, 0) / hues.length;
    const variance = hues.reduce((sum, h) => sum + Math.pow(h - mean, 2), 0) / hues.length;
    const std = Math.sqrt(variance);

    // 标准差越小，颜色越和谐
    // 0-60 度为高度和谐，60-120 为中度，>120 为不和谐
    if (std < 30) return 0.9 + (30 - std) / 300;
    if (std < 60) return 0.7 + (60 - std) / 100;
    return Math.max(0.3, 0.7 - (std - 60) / 200);
  }

  private estimateColorTemperature(colors: RGBColor[]): number {
    if (colors.length === 0) return 5500;

    // 基于主色调估计色温
    const avgR = colors.reduce((sum, c) => sum + c.r, 0) / colors.length;
    const avgB = colors.reduce((sum, c) => sum + c.b, 0) / colors.length;

    // 简化的色温估计
    // 暖色（红 > 蓝）对应低色温，冷色（蓝 > 红）对应高色温
    const ratio = avgR / (avgB + 1);
    if (ratio > 1.5) return 4500;  // 暖色
    if (ratio < 0.8) return 6500;  // 冷色
    return 5500; // 中性
  }

  private calculateFrameConsistency(analyses: ColorAnalysis[]): number {
    if (analyses.length < 2) return 1;

    // 计算帧间饱和度和亮度的变化
    const satMeans = analyses.map(a => a.saturation.mean);
    const brightMeans = analyses.map(a => a.brightness.mean);

    const satVariance = this.calculateVariance(satMeans);
    const brightVariance = this.calculateVariance(brightMeans);

    // 变化越小，一致性越高
    const consistency = 1 - Math.min(1, (satVariance + brightVariance) * 10);
    return Math.max(0, consistency);
  }

  private aggregateMetric(metrics: { mean: number; std: number }[]) {
    const means = metrics.map(m => m.mean);
    const stds = metrics.map(m => m.std);

    return {
      mean: means.reduce((a, b) => a + b, 0) / means.length,
      std: stds.reduce((a, b) => a + b, 0) / stds.length,
    };
  }

  // ===========================================================================
  // Private Methods - Quality Evaluation
  // ===========================================================================

  private evaluatePremiumQuality(params: {
    saturation: { mean: number; std: number; highRatio?: number };
    brightness: { mean: number; std: number };
    contrast: { ratio: number; score: number };
    dominantColors: RGBColor[];
    colorHarmony: number;
    colorTemperature: number;
    colorConsistency: number;
  }): { score: number; issues: string[]; suggestions: string[] } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // 1. 饱和度评估 (权重 30%)
    const satScore = this.evaluateSaturation(params.saturation.mean, issues, suggestions);
    score += satScore * 0.30;

    // 2. 颜色数量评估 (权重 20%)
    const colorCountScore = this.evaluateColorCount(
      params.dominantColors.length,
      issues,
      suggestions
    );
    score += colorCountScore * 0.20;

    // 3. 色彩和谐度评估 (权重 25%)
    const harmonyScore = params.colorHarmony * 100;
    if (params.colorHarmony < 0.6) {
      issues.push('色彩不够和谐，颜色之间缺乏统一感');
      suggestions.push('建议使用相邻色或互补色搭配');
    }
    score += harmonyScore * 0.25;

    // 4. 对比度评估 (权重 15%)
    score += params.contrast.score * 0.15;
    if (params.contrast.score < 60) {
      issues.push(`对比度不佳 (${params.contrast.ratio.toFixed(1)}:1)`);
      suggestions.push('建议调整高光和阴影，增加画面层次感');
    }

    // 5. 帧间一致性评估 (权重 10%)
    score += params.colorConsistency * 100 * 0.10;
    if (params.colorConsistency < 0.8) {
      issues.push('帧间色彩变化较大，风格不够统一');
      suggestions.push('建议应用统一的色彩分级');
    }

    return {
      score: Math.round(score),
      issues,
      suggestions,
    };
  }

  private evaluateSaturation(
    saturation: number,
    issues: string[],
    suggestions: string[]
  ): number {
    // 高级感饱和度范围：0.35 - 0.55
    if (saturation < 0.35) {
      issues.push(`饱和度过低 (${(saturation * 100).toFixed(0)}%)，画面显得平淡`);
      suggestions.push('建议适当提高饱和度至 40-50%');
      return 60 + (saturation / 0.35) * 20;
    }
    if (saturation > 0.55) {
      issues.push(`饱和度过高 (${(saturation * 100).toFixed(0)}%)，画面显得艳俗`);
      suggestions.push('建议降低饱和度至 40-50%，更显高级');
      return Math.max(40, 100 - (saturation - 0.55) * 200);
    }
    // 最佳范围
    if (saturation >= 0.40 && saturation <= 0.50) {
      return 100;
    }
    return 90;
  }

  private evaluateColorCount(
    count: number,
    issues: string[],
    suggestions: string[]
  ): number {
    if (count > 5) {
      issues.push(`颜色种类过多 (${count}种)，画面显得杂乱`);
      suggestions.push('建议精简颜色，主色调控制在3种以内');
      return Math.max(40, 100 - (count - 5) * 15);
    }
    if (count <= 3) {
      return 100;
    }
    return 85;
  }

  // ===========================================================================
  // Private Methods - Utilities
  // ===========================================================================

  private rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return { h: h * 360, s: l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min), l };
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }
}
