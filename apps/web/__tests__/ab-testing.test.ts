import { createABTest, recordResult, getTestResults, type ABTest } from '../lib/ab-testing';

describe('A/B Testing Framework', () => {
  it('should create A/B test', () => {
    const test = createABTest('prompt-v1', ['prompt-a', 'prompt-b']);
    expect(test).toHaveProperty('id');
    expect(test).toHaveProperty('variants');
    expect(test.variants.length).toBe(2);
  });

  it('should assign variant deterministically', () => {
    const test = createABTest('test', ['a', 'b']);
    const variant = test.getVariant('user-1');
    expect(['a', 'b']).toContain(variant);
  });

  it('should record results', () => {
    const test = createABTest('test', ['a', 'b']);
    recordResult(test.id, 'user-1', 'a', 85);
    const results = getTestResults(test.id);
    expect(results.length).toBe(1);
  });
});
