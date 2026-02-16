/**
 * VidLuxe Core - Premium Video Enhancement Engine
 *
 * @vidluxe/core
 */

// Analyzer
export { ColorAnalyzer } from './analyzer/color-analyzer';
export type { ColorAnalyzerConfig } from './analyzer/color-analyzer';

// Scorer
export { PremiumScorer } from './scorer/premium-scorer';
export type { PremiumScorerConfig } from './scorer/premium-scorer';

// Rules
export {
  saturationRules,
  colorCountRules,
  colorHarmonyRules,
  contrastRules,
  allColorRules,
} from './rules/color-rules';
export type { ColorRule } from './rules/color-rules';

// Re-export types
export type {
  PremiumScore,
  PremiumGrade,
  DimensionScore,
  ColorAnalysis,
  RGBColor,
  PremiumStyle,
  PremiumProfile,
  VideoAnalysisInput,
  VideoAnalysisOutput,
  EnhancementOptions,
  EnhancementResult,
} from '@vidluxe/types';

export { GRADE_THRESHOLDS, PREMIUM_PROFILES } from '@vidluxe/types';
