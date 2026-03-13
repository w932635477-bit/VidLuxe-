import { getPromptForStyle, getPromptForCategory, PromptLibrary } from '../lib/style-prompts';

describe('Style Prompts Library', () => {
  it('should return prompt for magazine style', () => {
    const prompt = getPromptForStyle('magazine', 'product');
    expect(prompt).toContain('magazine');
    expect(prompt.length).toBeGreaterThan(50);
  });

  it('should return prompt for non-face content', () => {
    const prompt = getPromptForCategory('product');
    expect(prompt).toContain('product');
  });

  it('should support all 4 styles', () => {
    const styles = ['magazine', 'soft', 'urban', 'vintage'];
    styles.forEach(style => {
      const prompt = getPromptForStyle(style, 'lifestyle');
      expect(prompt).toBeTruthy();
    });
  });
});
