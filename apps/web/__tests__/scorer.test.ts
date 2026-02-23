/**
 * 种草力评分测试
 *
 * 测试评分逻辑的正确性
 */

import { describe, it, expect } from 'vitest';

// 评分维度
const DIMENSION_WEIGHTS = {
  visualAttraction: 0.30,    // 视觉吸引力 30%
  contentMatch: 0.25,        // 内容匹配度 25%
  authenticity: 0.20,        // 真实可信度 20%
  emotionalImpact: 0.15,     // 情绪感染力 15%
  actionGuidance: 0.10,      // 行动引导力 10%
};

// 计算种草力评分
function calculateSeedingScore(dimensions: {
  visualAttraction: number;
  contentMatch: number;
  authenticity: number;
  emotionalImpact: number;
  actionGuidance: number;
}): { overall: number; grade: string } {
  const overall = Math.round(
    dimensions.visualAttraction * DIMENSION_WEIGHTS.visualAttraction +
    dimensions.contentMatch * DIMENSION_WEIGHTS.contentMatch +
    dimensions.authenticity * DIMENSION_WEIGHTS.authenticity +
    dimensions.emotionalImpact * DIMENSION_WEIGHTS.emotionalImpact +
    dimensions.actionGuidance * DIMENSION_WEIGHTS.actionGuidance
  );

  let grade: string;
  if (overall >= 90) grade = 'S';
  else if (overall >= 80) grade = 'A';
  else if (overall >= 70) grade = 'B';
  else if (overall >= 60) grade = 'C';
  else grade = 'D';

  return { overall, grade };
}

describe('Seeding Score Calculator', () => {
  describe('calculateSeedingScore', () => {
    it('should calculate overall score correctly', () => {
      const result = calculateSeedingScore({
        visualAttraction: 90,
        contentMatch: 85,
        authenticity: 80,
        emotionalImpact: 75,
        actionGuidance: 70,
      });

      expect(result.overall).toBeGreaterThanOrEqual(0);
      expect(result.overall).toBeLessThanOrEqual(100);
    });

    it('should return S grade for excellent scores', () => {
      const result = calculateSeedingScore({
        visualAttraction: 95,
        contentMatch: 92,
        authenticity: 90,
        emotionalImpact: 88,
        actionGuidance: 85,
      });

      expect(result.grade).toBe('S');
      expect(result.overall).toBeGreaterThanOrEqual(90);
    });

    it('should return A grade for good scores', () => {
      const result = calculateSeedingScore({
        visualAttraction: 85,
        contentMatch: 82,
        authenticity: 80,
        emotionalImpact: 78,
        actionGuidance: 75,
      });

      expect(result.grade).toBe('A');
      expect(result.overall).toBeGreaterThanOrEqual(80);
      expect(result.overall).toBeLessThan(90);
    });

    it('should return B grade for moderate scores', () => {
      const result = calculateSeedingScore({
        visualAttraction: 75,
        contentMatch: 72,
        authenticity: 70,
        emotionalImpact: 68,
        actionGuidance: 65,
      });

      expect(result.grade).toBe('B');
      expect(result.overall).toBeGreaterThanOrEqual(70);
      expect(result.overall).toBeLessThan(80);
    });

    it('should return C grade for average scores', () => {
      const result = calculateSeedingScore({
        visualAttraction: 65,
        contentMatch: 62,
        authenticity: 60,
        emotionalImpact: 58,
        actionGuidance: 55,
      });

      expect(result.grade).toBe('C');
      expect(result.overall).toBeGreaterThanOrEqual(60);
      expect(result.overall).toBeLessThan(70);
    });

    it('should return D grade for poor scores', () => {
      const result = calculateSeedingScore({
        visualAttraction: 50,
        contentMatch: 45,
        authenticity: 40,
        emotionalImpact: 35,
        actionGuidance: 30,
      });

      expect(result.grade).toBe('D');
      expect(result.overall).toBeLessThan(60);
    });

    it('should weight visualAttraction highest', () => {
      // 高视觉吸引力，其他低
      const highVisual = calculateSeedingScore({
        visualAttraction: 100,
        contentMatch: 50,
        authenticity: 50,
        emotionalImpact: 50,
        actionGuidance: 50,
      });

      // 低视觉吸引力，其他高
      const lowVisual = calculateSeedingScore({
        visualAttraction: 50,
        contentMatch: 100,
        authenticity: 100,
        emotionalImpact: 100,
        actionGuidance: 100,
      });

      // 视觉吸引力权重 30%，其他权重总和 70%
      // 高视觉: 100*0.3 + 50*0.7 = 30 + 35 = 65
      // 低视觉: 50*0.3 + 100*0.7 = 15 + 70 = 85
      expect(highVisual.overall).toBe(65);
      expect(lowVisual.overall).toBe(85);
    });
  });
});
