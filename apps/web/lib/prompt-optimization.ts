/**
 * 持续优化引擎
 *
 * 基于反馈自动优化 prompt
 */

// 优化结果
export interface OptimizationResult {
  originalPrompt: string;
  optimizedPrompt: string;
  improvementScore: number;
  timestamp: number;
}

// 反馈数据
export interface FeedbackData {
  score: number;
  feedback: string;
}

// 内存存储
const optimizationHistory: OptimizationResult[] = [];

/**
 * 根据反馈优化 prompt
 */
export async function optimizePrompt(
  prompt: string,
  feedbackList: FeedbackData[]
): Promise<string> {
  const avgScore = feedbackList.reduce((a, b) => a + b.score, 0) / feedbackList.length;

  // 基于反馈优化 prompt
  let optimized = prompt;

  if (avgScore < 70) {
    // 低分：大幅改进
    optimized = `${prompt} | enhance quality and detail, sharp focus, professional lighting`;
  } else if (avgScore < 80) {
    // 中分：中等改进
    optimized = `${prompt} | improve composition, better color grading`;
  } else {
    // 高分：保持
    optimized = `${prompt} | maintain excellence, consistent quality`;
  }

  const result: OptimizationResult = {
    originalPrompt: prompt,
    optimizedPrompt: optimized,
    improvementScore: avgScore,
    timestamp: Date.now()
  };

  optimizationHistory.push(result);
  return optimized;
}

/**
 * 获取优化统计
 */
export function getOptimizationStats(): {
  totalOptimizations: number;
  averageImprovement: number;
  history: OptimizationResult[];
} {
  const avgImprovement = optimizationHistory.length > 0
    ? optimizationHistory.reduce((a, b) => a + b.improvementScore, 0) / optimizationHistory.length
    : 0;

  return {
    totalOptimizations: optimizationHistory.length,
    averageImprovement: avgImprovement,
    history: optimizationHistory
  };
}

/**
 * 批量优化 prompt
 */
export async function batchOptimize(
  prompts: { prompt: string; feedbackList: FeedbackData[] }[]
): Promise<{ original: string; optimized: string }[]> {
  const results: { original: string; optimized: string }[] = [];

  for (const { prompt, feedbackList } of prompts) {
    const optimized = await optimizePrompt(prompt, feedbackList);
    results.push({ original: prompt, optimized });
  }

  return results;
}

/**
 * 获取最近的优化历史
 */
export function getRecentOptimizations(count: number = 10): OptimizationResult[] {
  return optimizationHistory.slice(-count);
}

/**
 * 获取最佳 prompt
 */
export function getBestPrompt(): OptimizationResult | null {
  if (optimizationHistory.length === 0) return null;

  return optimizationHistory.reduce((best, current) =>
    current.improvementScore > best.improvementScore ? current : best
  );
}
