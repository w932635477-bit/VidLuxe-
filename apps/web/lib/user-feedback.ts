/**
 * 用户反馈系统
 *
 * 收集和管理用户对生成结果的反馈
 */

// 反馈条目
export interface FeedbackEntry {
  id: string;
  userId: string;
  imageId: string;
  rating: number;
  comment: string;
  timestamp: number;
}

// 内存存储
const feedbackStore: FeedbackEntry[] = [];

/**
 * 提交反馈
 */
export async function submitFeedback(
  data: Omit<FeedbackEntry, 'id' | 'timestamp'>
): Promise<FeedbackEntry> {
  const entry: FeedbackEntry = {
    ...data,
    id: `feedback-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    timestamp: Date.now()
  };

  feedbackStore.push(entry);
  return entry;
}

/**
 * 获取图片的所有反馈
 */
export async function getFeedback(imageId: string): Promise<FeedbackEntry[]> {
  return feedbackStore.filter(f => f.imageId === imageId);
}

/**
 * 获取图片的平均评分
 */
export async function getAverageRating(imageId: string): Promise<number> {
  const feedback = await getFeedback(imageId);
  if (feedback.length === 0) return 0;

  const sum = feedback.reduce((acc, f) => acc + f.rating, 0);
  return sum / feedback.length;
}

/**
 * 获取所有反馈统计
 */
export async function getFeedbackStats(): Promise<{
  totalFeedback: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
}> {
  const totalFeedback = feedbackStore.length;

  const ratingDistribution: Record<number, number> = {};
  let sum = 0;

  for (const feedback of feedbackStore) {
    sum += feedback.rating;
    ratingDistribution[feedback.rating] = (ratingDistribution[feedback.rating] || 0) + 1;
  }

  return {
    totalFeedback,
    averageRating: totalFeedback > 0 ? sum / totalFeedback : 0,
    ratingDistribution
  };
}

/**
 * 问题类型
 */
export type IssueType =
  | 'too_dark'
  | 'too_bright'
  | 'style_mismatch'
  | 'low_quality'
  | 'distorted'
  | 'color_issues'
  | 'other';

/**
 * 提交带问题分类的反馈
 */
export async function submitFeedbackWithIssue(
  data: Omit<FeedbackEntry, 'id' | 'timestamp'> & { issueType?: IssueType }
): Promise<FeedbackEntry> {
  const entry: FeedbackEntry = {
    ...data,
    id: `feedback-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    timestamp: Date.now()
  };

  feedbackStore.push(entry);

  // 如果有 issueType，也可以记录到单独的问题统计中
  if (data.issueType) {
    issueStats[data.issueType] = (issueStats[data.issueType] || 0) + 1;
  }

  return entry;
}

// 问题统计
const issueStats: Record<IssueType, number> = {
  too_dark: 0,
  too_bright: 0,
  style_mismatch: 0,
  low_quality: 0,
  distorted: 0,
  color_issues: 0,
  other: 0
};

/**
 * 获取问题统计
 */
export function getIssueStats(): Record<IssueType, number> {
  return { ...issueStats };
}
