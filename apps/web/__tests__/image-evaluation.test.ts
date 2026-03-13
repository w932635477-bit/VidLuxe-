import { evaluateImage, ImageScore } from '../lib/image-evaluation';

describe('Image Evaluation System', () => {
  it('should evaluate image quality', async () => {
    const imageBuffer = Buffer.from('test-image');
    const score = await evaluateImage(imageBuffer);

    expect(score).toHaveProperty('overall');
    expect(score).toHaveProperty('composition');
    expect(score).toHaveProperty('lighting');
    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.overall).toBeLessThanOrEqual(100);
  });

  it('should provide improvement suggestions', async () => {
    const imageBuffer = Buffer.from('test-image');
    const score = await evaluateImage(imageBuffer);

    expect(score).toHaveProperty('suggestions');
    expect(Array.isArray(score.suggestions)).toBe(true);
  });
});
