/**
 * 种草功能测试
 *
 * 测试 seeding types 和 config 的正确性
 */

import { describe, it, expect } from 'vitest';
import {
  CATEGORIES,
  SEEDING_TYPES,
  getCategoryConfig,
  getSeedingTypeConfig,
  getRecommendedStyles,
} from '../lib/config/seeding';
import type { CategoryType, SeedingType } from '../lib/types/seeding';

describe('Seeding Config', () => {
  describe('CATEGORIES', () => {
    it('should have 8 categories', () => {
      expect(CATEGORIES).toHaveLength(8);
    });

    it('should have required properties for each category', () => {
      CATEGORIES.forEach((cat) => {
        expect(cat).toHaveProperty('id');
        expect(cat).toHaveProperty('label');
        expect(cat).toHaveProperty('icon');
        expect(typeof cat.id).toBe('string');
        expect(typeof cat.label).toBe('string');
        expect(typeof cat.icon).toBe('string');
      });
    });

    it('should include required categories', () => {
      const ids = CATEGORIES.map((c) => c.id);
      expect(ids).toContain('fashion');
      expect(ids).toContain('beauty');
      expect(ids).toContain('food');
      expect(ids).toContain('cafe');
    });
  });

  describe('SEEDING_TYPES', () => {
    it('should have 3 seeding types', () => {
      expect(SEEDING_TYPES).toHaveLength(3);
    });

    it('should have required properties for each type', () => {
      SEEDING_TYPES.forEach((type) => {
        expect(type).toHaveProperty('id');
        expect(type).toHaveProperty('label');
        expect(type).toHaveProperty('description');
        expect(type).toHaveProperty('enhancementFocus');
      });
    });

    it('should include product, location, lifestyle types', () => {
      const ids = SEEDING_TYPES.map((t) => t.id);
      expect(ids).toContain('product');
      expect(ids).toContain('location');
      expect(ids).toContain('lifestyle');
    });
  });

  describe('getCategoryConfig', () => {
    it('should return config for valid category', () => {
      const config = getCategoryConfig('beauty');
      expect(config).toBeDefined();
      expect(config?.label).toBe('美妆');
    });

    it('should return undefined for invalid category', () => {
      const config = getCategoryConfig('invalid' as CategoryType);
      expect(config).toBeUndefined();
    });
  });

  describe('getSeedingTypeConfig', () => {
    it('should return config for valid seeding type', () => {
      const config = getSeedingTypeConfig('product');
      expect(config).toBeDefined();
      expect(config?.label).toBe('种草商品');
    });

    it('should return undefined for invalid seeding type', () => {
      const config = getSeedingTypeConfig('invalid' as SeedingType);
      expect(config).toBeUndefined();
    });
  });

  describe('getRecommendedStyles', () => {
    it('should return recommended styles for valid combination', () => {
      const styles = getRecommendedStyles('beauty', 'product');
      expect(styles).toBeInstanceOf(Array);
      expect(styles.length).toBeGreaterThan(0);
    });

    it('should return default styles for unknown combination', () => {
      const styles = getRecommendedStyles('fitness', 'location');
      expect(styles).toBeInstanceOf(Array);
      expect(styles).toContain('magazine');
    });
  });
});
