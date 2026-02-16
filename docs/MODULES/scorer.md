# VidLuxe 评分引擎

## 概述

评分引擎负责将各维度的分析结果综合转换为统一的 PremiumScore，包括总分计算、等级评定和对比分析。

---

## 评分模型

### 等级系统

```typescript
export type PremiumGrade = 'S' | 'A' | 'B' | 'C' | 'D';

export const GRADE_THRESHOLDS: Record<PremiumGrade, number> = {
  'S': 85,  // 顶级
  'A': 75,  // 优秀
  'B': 65,  // 良好
  'C': 55,  // 普通
  'D': 0,   // 需改进
};
```

### 维度权重

```typescript
const DEFAULT_WEIGHTS = {
  color: 0.25,        // 色彩协调度
  typography: 0.20,   // 排版舒适度
  composition: 0.20,  // 构图美感度
  motion: 0.15,       // 动效流畅度
  audio: 0.10,        // 音频品质度
  detail: 0.10,       // 细节精致度
};
```

### 评分结构

```typescript
export interface PremiumScore {
  // 总分
  total: number;       // 0-100
  grade: PremiumGrade; // S/A/B/C/D

  // 各维度得分
  dimensions: {
    color: DimensionScore;
    typography: DimensionScore;
    composition: DimensionScore;
    motion: DimensionScore;
    audio: DimensionScore;
    detail: DimensionScore;
  };

  // 对比数据（可选）
  comparison?: {
    before: number;       // 增强前分数
    after: number;        // 增强后分数
    improvement: number;  // 提升幅度
    peerAverage: number;  // 同行平均
    topCreator: number;   // 顶级创作者
  };

  timestamp: string;
}

export interface DimensionScore {
  score: number;         // 0-100
  weight: number;        // 权重
  issues: string[];      // 问题列表
  suggestions: string[]; // 优化建议
}
```

---

## PremiumScorer 类

### 当前实现

```typescript
// packages/core/src/scorer/premium-scorer.ts

export class PremiumScorer {
  private readonly weights: typeof DEFAULT_WEIGHTS;

  constructor(config: PremiumScorerConfig = {}) {
    this.weights = config.weights ?? DEFAULT_WEIGHTS;

    // 验证权重总和为 1
    const total = Object.values(this.weights).reduce((a, b) => a + b, 0);
    if (Math.abs(total - 1) > 0.001) {
      throw new Error(`Weights must sum to 1, got ${total}`);
    }
  }

  /**
   * 从色彩分析计算综合评分
   * MVP 阶段：只实现色彩维度
   */
  calculateFromColor(colorAnalysis: ColorAnalysis): PremiumScore {
    const colorScore = this.scoreColor(colorAnalysis);
    const defaultScore = this.createDefaultDimensionScore();

    const dimensions = {
      color: colorScore,
      typography: defaultScore,
      composition: defaultScore,
      motion: defaultScore,
      audio: defaultScore,
      detail: defaultScore,
    };

    // 计算总分
    let total = 0;
    total += colorScore.score * this.weights.color;

    // 其他维度使用基准分
    const baseScore = 70;
    total += baseScore * (1 - this.weights.color);

    const grade = this.calculateGrade(total);

    return {
      total: Math.round(total),
      grade,
      dimensions,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 计算等级
   */
  calculateGrade(score: number): PremiumGrade {
    if (score >= GRADE_THRESHOLDS.S) return 'S';
    if (score >= GRADE_THRESHOLDS.A) return 'A';
    if (score >= GRADE_THRESHOLDS.B) return 'B';
    if (score >= GRADE_THRESHOLDS.C) return 'C';
    return 'D';
  }

  /**
   * 获取等级颜色（UI 展示）
   */
  getGradeColor(grade: PremiumGrade): string {
    const colors: Record<PremiumGrade, string> = {
      'S': '#FFD700',  // 金色
      'A': '#4CAF50',  // 绿色
      'B': '#2196F3',  // 蓝色
      'C': '#FF9800',  // 橙色
      'D': '#F44336',  // 红色
    };
    return colors[grade];
  }

  /**
   * 获取等级标签（UI 展示）
   */
  getGradeLabel(grade: PremiumGrade): string {
    const labels: Record<PremiumGrade, string> = {
      'S': '顶级',
      'A': '优秀',
      'B': '良好',
      'C': '普通',
      'D': '需改进',
    };
    return labels[grade];
  }

  private scoreColor(analysis: ColorAnalysis): DimensionScore {
    return {
      score: analysis.premiumScore,
      weight: this.weights.color,
      issues: analysis.issues,
      suggestions: analysis.suggestions,
    };
  }

  private createDefaultDimensionScore(): DimensionScore {
    return {
      score: 70,
      weight: 0,
      issues: ['此维度分析尚未实现'],
      suggestions: ['敬请期待后续更新'],
    };
  }
}
```

---

## 扩展设计

### PremiumScorerV2

```typescript
// packages/core/src/scorer/premium-scorer-v2.ts

export interface PremiumScorerV2Config extends PremiumScorerConfig {
  // 行业基准数据
  benchmarks?: {
    [industry: string]: {
      average: number;
      top10: number;
      top1: number;
    };
  };

  // 历史趋势窗口
  trendWindow?: number; // days
}

export class PremiumScorerV2 extends PremiumScorer {
  private benchmarks: Map<string, BenchmarkData>;
  private trendWindow: number;

  constructor(config: PremiumScorerV2Config = {}) {
    super(config);
    this.benchmarks = new Map(Object.entries(config.benchmarks ?? {}));
    this.trendWindow = config.trendWindow ?? 30;
  }

  /**
   * 全维度计算
   */
  calculate(analysis: VideoAnalysisOutput): PremiumScore {
    const dimensions = {
      color: this.scoreColor(analysis.color),
      typography: this.scoreTypography(analysis.typography),
      composition: this.scoreComposition(analysis.composition),
      motion: this.scoreMotion(analysis.motion),
      audio: this.scoreAudio(analysis.audio),
      detail: this.scoreDetail(analysis.detail),
    };

    // 计算加权总分
    let total = 0;
    for (const [key, dim] of Object.entries(dimensions)) {
      total += dim.score * this.weights[key as DimensionKey];
    }

    return {
      total: Math.round(total),
      grade: this.calculateGrade(total),
      dimensions,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 与同行对比
   */
  compareWithPeers(
    score: PremiumScore,
    industry: string
  ): ComparisonResult {
    const benchmark = this.benchmarks.get(industry);

    if (!benchmark) {
      return {
        percentile: null,
        comparison: 'unknown',
      };
    }

    const percentile = this.calculatePercentile(
      score.total,
      benchmark
    );

    return {
      percentile,
      comparison: {
        vsAverage: score.total - benchmark.average,
        vsTop10: score.total - benchmark.top10,
        vsTop1: score.total - benchmark.top1,
      },
      recommendation: this.getRecommendation(percentile),
    };
  }

  /**
   * 获取分数趋势
   */
  async getTrend(projectId: string): Promise<ScoreTrend> {
    const history = await this.fetchScoreHistory(
      projectId,
      this.trendWindow
    );

    return {
      current: history[history.length - 1],
      previous: history[0],
      change: history[history.length - 1] - history[0],
      trend: this.calculateTrend(history),
      dataPoints: history,
    };
  }

  /**
   * 获取改进潜力
   */
  getImprovementPotential(score: PremiumScore): ImprovementPotential {
    const dimensions = Object.entries(score.dimensions)
      .map(([key, dim]) => ({
        dimension: key,
        current: dim.score,
        potential: 100 - dim.score,
        impact: (100 - dim.score) * this.weights[key as DimensionKey],
      }))
      .sort((a, b) => b.impact - a.impact);

    return {
      totalPotential: 100 - score.total,
      topImprovements: dimensions.slice(0, 3),
      quickWins: dimensions.filter(d => d.potential > 20 && d.impact > 5),
    };
  }
}
```

---

## 评分规则

### 色彩评分规则

```typescript
// packages/core/src/rules/color-rules.ts

export interface ColorRule {
  id: string;
  name: string;
  description: string;
  check: (value: number) => { passed: boolean; score: number; message: string };
}

// 饱和度规则
export const saturationRules: ColorRule[] = [
  {
    id: 'saturation_premium_range',
    name: '高级感饱和度范围',
    description: '高级感视频的饱和度通常在 35%-55% 之间',
    check: (value: number) => {
      if (value >= 0.35 && value <= 0.55) {
        const optimal = value >= 0.40 && value <= 0.50;
        return {
          passed: true,
          score: optimal ? 100 : 85,
          message: optimal
            ? '饱和度完美，符合高级感标准'
            : '饱和度在合理范围内',
        };
      }
      if (value < 0.35) {
        return {
          passed: false,
          score: Math.max(40, 60 + (value - 0.20) * 100),
          message: `饱和度过低 (${(value * 100).toFixed(0)}%)，建议提升至 40-50%`,
        };
      }
      return {
        passed: false,
        score: Math.max(30, 100 - (value - 0.55) * 200),
        message: `饱和度过高 (${(value * 100).toFixed(0)}%)，建议降低至 40-50%`,
      };
    },
  },
];

// 颜色数量规则
export const colorCountRules: ColorRule[] = [
  {
    id: 'color_count_limited',
    name: '颜色种类克制',
    description: '高级感视频的主色调通常不超过 3-4 种',
    check: (value: number) => {
      if (value <= 3) {
        return {
          passed: true,
          score: 100,
          message: '颜色种类克制，符合高级感标准',
        };
      }
      if (value <= 4) {
        return {
          passed: true,
          score: 85,
          message: '颜色种类在合理范围内',
        };
      }
      return {
        passed: false,
        score: Math.max(30, 100 - (value - 4) * 15),
        message: `颜色种类过多 (${value}种)，建议精简至 3 种以内`,
      };
    },
  },
];

// 色彩和谐度规则
export const colorHarmonyRules: ColorRule[] = [
  {
    id: 'color_harmony_high',
    name: '色彩和谐度高',
    description: '高级感视频的色彩和谐度通常在 0.7 以上',
    check: (value: number) => {
      if (value >= 0.8) {
        return {
          passed: true,
          score: 100,
          message: '色彩和谐度优秀',
        };
      }
      if (value >= 0.7) {
        return {
          passed: true,
          score: 85,
          message: '色彩和谐度良好',
        };
      }
      return {
        passed: false,
        score: Math.max(40, value * 100),
        message: `色彩和谐度不足 (${(value * 100).toFixed(0)}%)，建议使用相邻色或互补色搭配`,
      };
    },
  },
];

// 对比度规则
export const contrastRules: ColorRule[] = [
  {
    id: 'contrast_balanced',
    name: '对比度适中',
    description: '高级感视频的对比度通常在 0.15-0.35 之间',
    check: (value: number) => {
      if (value >= 0.15 && value <= 0.35) {
        return {
          passed: true,
          score: 100,
          message: '对比度适中，画面层次感好',
        };
      }
      if (value < 0.15) {
        return {
          passed: false,
          score: Math.max(50, (value / 0.15) * 80),
          message: '对比度过低，画面显得平淡',
        };
      }
      return {
        passed: false,
        score: Math.max(50, 100 - (value - 0.35) * 100),
        message: '对比度过高，可能显得生硬',
      };
    },
  },
];
```

---

## 使用示例

### 基础使用

```typescript
import { ColorAnalyzer, PremiumScorer } from '@vidluxe/core';

const analyzer = new ColorAnalyzer();
const scorer = new PremiumScorer();

// 分析视频
const frames = await extractFrames(video);
const colorResult = analyzer.analyzeFrames(frames);

// 计算评分
const score = scorer.calculateFromColor(colorResult);

console.log(`Total Score: ${score.total}`);
console.log(`Grade: ${score.grade}`);
console.log(`Color Score: ${score.dimensions.color.score}`);
console.log(`Issues: ${score.dimensions.color.issues}`);
```

### 自定义权重

```typescript
const customScorer = new PremiumScorer({
  weights: {
    color: 0.35,        // 提高色彩权重
    typography: 0.15,
    composition: 0.20,
    motion: 0.15,
    audio: 0.10,
    detail: 0.05,
  },
});
```

### 行业对比（V2）

```typescript
const scorerV2 = new PremiumScorerV2({
  benchmarks: {
    'luxury-fashion': {
      average: 72,
      top10: 85,
      top1: 92,
    },
    'tech-product': {
      average: 68,
      top10: 80,
      top1: 88,
    },
  },
});

const comparison = scorerV2.compareWithPeers(score, 'luxury-fashion');
console.log(`Percentile: ${comparison.percentile}`);
console.log(`vs Top 10%: ${comparison.comparison.vsTop10}`);
```

---

## 可视化

### 评分雷达图

```typescript
// 前端组件示例
function ScoreRadar({ score }: { score: PremiumScore }) {
  const data = Object.entries(score.dimensions).map(([key, dim]) => ({
    dimension: key,
    score: dim.score,
  }));

  return (
    <RadarChart data={data}>
      <PolarGrid />
      <PolarAngleAxis dataKey="dimension" />
      <PolarRadiusAxis domain={[0, 100]} />
      <Radar
        name="Score"
        dataKey="score"
        stroke={scorer.getGradeColor(score.grade)}
        fill={scorer.getGradeColor(score.grade)}
        fillOpacity={0.5}
      />
    </RadarChart>
  );
}
```

### 评分卡片

```typescript
function ScoreCard({ score }: { score: PremiumScore }) {
  return (
    <div className="score-card">
      <div className="score-total">
        <span className="score-number">{score.total}</span>
        <span className="score-grade" style={{
          color: scorer.getGradeColor(score.grade)
        }}>
          {score.grade}
        </span>
      </div>
      <div className="score-label">
        {scorer.getGradeLabel(score.grade)}
      </div>
      <div className="score-dimensions">
        {Object.entries(score.dimensions).map(([key, dim]) => (
          <div key={key} className="dimension">
            <span className="dimension-name">{key}</span>
            <div className="dimension-bar">
              <div style={{ width: `${dim.score}%` }} />
            </div>
            <span className="dimension-score">{dim.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 下一步

- [处理引擎](./processor.md)
- [增强引擎](./enhancer.md)
- [API 设计](../API.md)
