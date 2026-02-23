// 种草内容增强 - 类型定义

// 品类类型 (8种)
export type CategoryType =
  | 'fashion'   // 穿搭
  | 'beauty'    // 美妆
  | 'food'      // 美食
  | 'cafe'      // 探店
  | 'home'      // 家居
  | 'travel'    // 旅行
  | 'tech'      // 数码
  | 'fitness';  // 健身

// 种草类型 (3种)
export type SeedingType =
  | 'product'      // 种草商品 - 让读者想买
  | 'location'     // 种草地点 - 让读者想去
  | 'lifestyle';   // 种草生活方式 - 让读者想成为

// 品类配置
export interface CategoryConfig {
  id: CategoryType;
  label: string;
  icon: string;
}

// 种草类型配置
export interface SeedingTypeConfig {
  id: SeedingType;
  label: string;
  description: string;
  enhancementFocus: string;
}

// AI 识别结果
export interface AIRecognitionResult {
  category: CategoryType;
  categoryConfidence: number;
  seedingType: SeedingType;
  seedingTypeConfidence: number;
  suggestedStyles: string[];
}

// 种草力评分 (5维)
export interface SeedingScore {
  overall: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  dimensions: {
    visualAttraction: number;    // 视觉吸引力 30%
    contentMatch: number;        // 内容匹配度 25%
    authenticity: number;        // 真实可信度 20%
    emotionalImpact: number;     // 情绪感染力 15%
    actionGuidance: number;      // 行动引导力 10%
  };
}
