import { optimizePrompt, getOptimizationStats, type FeedbackData } from '../lib/prompt-optimization';

describe('Prompt Optimization Engine', () => {
  it('should optimize prompt based on feedback', async () => {
    const optimized = await optimizePrompt('original prompt', [
      { score: 85, feedback: 'good' },
      { score: 90, feedback: 'excellent' }
    ]);
    expect(optimized).toBeTruthy();
    expect(optimized.length).toBeGreaterThan(0);
  });

  it('should track optimization history', async () => {
    await optimizePrompt('test prompt', [{ score: 80, feedback: 'ok' }]);
    const stats = getOptimizationStats();
    expect(stats.totalOptimizations).toBeGreaterThan(0);
  });
});
