/**
 * 评分系统模块
 *
 * 计算5维种草力评分：视觉吸引力、内容匹配度、真实可信度、情绪感染力、行动引导力
 *
 * v2.0 改进：
 * - 支持三种评分模式：AI Vision / 本地分析 / 回退方案
 * - 基于种草类型动态调整评分权重
 * - 提供具体的改进建议
 * - 支持品类特定的评估标准
 *
 * 使用方法：
 * - 配置 OPENAI_API_KEY 可启用 AI Vision 分析
 * - 未配置时自动使用本地分析算法
 */

// 导出 v2.0 增强评分系统
export {
  calculateEnhancedScore as calculateScore,
  compareEnhancedScores as compareScores,
} from './scorer-v2';

// 重新导出类型
export type { ScoreResult } from './scorer-v2';
