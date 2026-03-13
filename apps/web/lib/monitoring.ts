/**
 * 监控仪表板
 *
 * 实时跟踪和统计系统指标
 */

// 监控指标
export interface MonitoringMetrics {
  totalEvents: number;
  averageQuality: number;
  styleDistribution: Record<string, number>;
  errorRate: number;
  lastUpdated: number;
}

// 事件接口
interface Event {
  name: string;
  data: Record<string, any>;
  timestamp: number;
}

// 内存存储
const events: Event[] = [];

/**
 * 跟踪事件
 */
export function trackEvent(name: string, data: Record<string, any>) {
  events.push({
    name,
    data,
    timestamp: Date.now()
  });
}

/**
 * 获取监控指标
 */
export function getMetrics(): MonitoringMetrics {
  const qualities = events
    .filter(e => e.data.quality)
    .map(e => e.data.quality);

  const styles = events
    .filter(e => e.data.style)
    .map(e => e.data.style);

  const errors = events.filter(e => e.name === 'error');

  // 统计风格分布
  const styleDistribution: Record<string, number> = {};
  styles.forEach(style => {
    styleDistribution[style] = (styleDistribution[style] || 0) + 1;
  });

  return {
    totalEvents: events.length,
    averageQuality: qualities.length > 0
      ? qualities.reduce((a, b) => a + b, 0) / qualities.length
      : 0,
    styleDistribution,
    errorRate: events.length > 0 ? errors.length / events.length : 0,
    lastUpdated: Date.now()
  };
}

/**
 * 获取特定风格的使用统计
 */
export function getStyleStats(): Record<string, number> {
  const styleDistribution = getMetrics().styleDistribution;
  return styleDistribution;
}

/**
 * 获取错误统计
 */
export function getErrorStats(): { total: number; rate: number } {
  const errors = events.filter(e => e.name === 'error');
  return {
    total: errors.length,
    rate: events.length > 0 ? errors.length / events.length : 0
  };
}

/**
 * 清空监控数据
 */
export function clearMetrics() {
  events.length = 0;
}

/**
 * 获取最近 N 分钟的事件
 */
export function getRecentEvents(minutes: number): Event[] {
  const cutoff = Date.now() - minutes * 60 * 1000;
  return events.filter(e => e.timestamp >= cutoff);
}

/**
 * 获取性能指标
 */
export function getPerformanceMetrics(): {
  eventsPerMinute: number;
  avgQuality: number;
  errorRate: number;
} {
  const recentEvents = getRecentEvents(5); // 最近 5 分钟

  const qualities = recentEvents
    .filter(e => e.data.quality)
    .map(e => e.data.quality);

  const errors = recentEvents.filter(e => e.name === 'error');

  return {
    eventsPerMinute: recentEvents.length / 5,
    avgQuality: qualities.length > 0
      ? qualities.reduce((a, b) => a + b, 0) / qualities.length
      : 0,
    errorRate: recentEvents.length > 0 ? errors.length / recentEvents.length : 0
  };
}
