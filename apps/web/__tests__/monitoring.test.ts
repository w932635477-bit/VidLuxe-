import { trackEvent, getMetrics, clearMetrics, type MonitoringMetrics } from '../lib/monitoring';

describe('Monitoring Dashboard', () => {
  beforeEach(() => {
    clearMetrics();
  });

  it('should track events', () => {
    trackEvent('image_processed', { style: 'magazine', quality: 85 });
    const metrics = getMetrics();
    expect(metrics.totalEvents).toBeGreaterThan(0);
  });

  it('should calculate average quality', () => {
    trackEvent('image_processed', { quality: 80 });
    trackEvent('image_processed', { quality: 90 });
    const metrics = getMetrics();
    expect(metrics.averageQuality).toBeGreaterThan(0);
  });

  it('should track style distribution', () => {
    trackEvent('image_processed', { style: 'magazine' });
    trackEvent('image_processed', { style: 'soft' });
    const metrics = getMetrics();
    expect(metrics.styleDistribution).toBeTruthy();
  });
});
