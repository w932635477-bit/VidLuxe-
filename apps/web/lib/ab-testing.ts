/**
 * A/B 测试框架
 *
 * 用于测试不同 prompt 版本的效果
 */

// 测试接口
export interface ABTest {
  id: string;
  name: string;
  variants: string[];
  results: TestResult[];
  getVariant(userId: string): string;
}

// 测试结果
export interface TestResult {
  userId: string;
  variant: string;
  score: number;
  timestamp: number;
}

// 内存存储
const tests = new Map<string, ABTest>();

/**
 * 创建 A/B 测试
 */
export function createABTest(name: string, variants: string[]): ABTest {
  const id = `test-${Date.now()}`;

  const test: ABTest = {
    id,
    name,
    variants,
    results: [],
    getVariant(userId: string): string {
      // 使用简单的哈希算法确保同一用户总是分配到同一变体
      const hash = userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      return variants[hash % variants.length];
    }
  };

  tests.set(id, test);
  return test;
}

/**
 * 记录测试结果
 */
export function recordResult(testId: string, userId: string, variant: string, score: number) {
  const test = tests.get(testId);
  if (test) {
    test.results.push({
      userId,
      variant,
      score,
      timestamp: Date.now()
    });
  }
}

/**
 * 获取测试结果
 */
export function getTestResults(testId: string): TestResult[] {
  return tests.get(testId)?.results || [];
}

/**
 * 获取测试统计信息
 */
export function getTestStats(testId: string) {
  const test = tests.get(testId);
  if (!test) return null;

  const variantStats = new Map<string, { count: number; totalScore: number; scores: number[] }>();

  for (const result of test.results) {
    const existing = variantStats.get(result.variant) || {
      count: 0,
      totalScore: 0,
      scores: []
    };

    existing.count++;
    existing.totalScore += result.score;
    existing.scores.push(result.score);

    variantStats.set(result.variant, existing);
  }

  const stats: Record<string, { count: number; avgScore: number; scores: number[] }> = {};

  for (const [variant, data] of variantStats) {
    stats[variant] = {
      count: data.count,
      avgScore: data.count > 0 ? data.totalScore / data.count : 0,
      scores: data.scores
    };
  }

  return {
    testId: test.id,
    name: test.name,
    variants: test.variants,
    totalResults: test.results.length,
    stats
  };
}

/**
 * 确定获胜者
 */
export function determineWinner(testId: string): { variant: string; avgScore: number } | null {
  const stats = getTestStats(testId);
  if (!stats || stats.totalResults === 0) return null;

  let winner: { variant: string; avgScore: number } | null = null;

  for (const [variant, data] of Object.entries(stats.stats)) {
    if (!winner || data.avgScore > winner.avgScore) {
      winner = { variant, avgScore: data.avgScore };
    }
  }

  return winner;
}
