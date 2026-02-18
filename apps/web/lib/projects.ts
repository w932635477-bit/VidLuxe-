// 项目数据类型和模拟数据

export interface Project {
  id: string;
  title: string;
  thumbnailUrl: string;
  originalUrl: string;
  enhancedUrl: string;
  style: 'minimal' | 'warmLuxury' | 'coolPro' | 'morandi';
  score: number;
  dimensions: {
    color: number;
    composition: number;
    typography: number;
    detail: number;
  };
  status: 'completed' | 'processing' | 'failed';
  createdAt: Date;
}

// 模拟项目数据
export const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    title: '穿搭照片',
    thumbnailUrl: '/cases/images/fashion-1-before.jpg',
    originalUrl: '/cases/images/fashion-1-after.jpg',
    enhancedUrl: '/cases/images/fashion-1-before.jpg',
    style: 'warmLuxury',
    score: 82,
    dimensions: { color: 85, composition: 80, typography: 78, detail: 84 },
    status: 'completed',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
  },
  {
    id: 'proj-2',
    title: '咖啡探店',
    thumbnailUrl: '/cases/images/cafe-1-before.jpg',
    originalUrl: '/cases/images/cafe-1-after.jpg',
    enhancedUrl: '/cases/images/cafe-1-before.jpg',
    style: 'warmLuxury',
    score: 78,
    dimensions: { color: 82, composition: 75, typography: 76, detail: 80 },
    status: 'completed',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 昨天
  },
  {
    id: 'proj-3',
    title: '护肤品拍摄',
    thumbnailUrl: '/cases/images/beauty-1-before.jpg',
    originalUrl: '/cases/images/beauty-1-after.jpg',
    enhancedUrl: '/cases/images/beauty-1-before.jpg',
    style: 'minimal',
    score: 85,
    dimensions: { color: 88, composition: 85, typography: 82, detail: 86 },
    status: 'completed',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3天前
  },
  {
    id: 'proj-4',
    title: '数码产品',
    thumbnailUrl: '/cases/images/tech-2-before.jpg',
    originalUrl: '/cases/images/tech-2-after.jpg',
    enhancedUrl: '/cases/images/tech-2-before.jpg',
    style: 'coolPro',
    score: 79,
    dimensions: { color: 78, composition: 80, typography: 82, detail: 76 },
    status: 'completed',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5天前
  },
  {
    id: 'proj-5',
    title: '生活方式',
    thumbnailUrl: '/cases/images/lifestyle-2-before.jpg',
    originalUrl: '/cases/images/lifestyle-2-after.jpg',
    enhancedUrl: '/cases/images/lifestyle-2-before.jpg',
    style: 'morandi',
    score: 81,
    dimensions: { color: 83, composition: 79, typography: 80, detail: 82 },
    status: 'completed',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7天前
  },
];

// 用户配额信息
export interface UserQuota {
  plan: 'free' | 'pro' | 'enterprise';
  used: number;
  total: number;
  resetAt: Date;
}

export const MOCK_QUOTA: UserQuota = {
  plan: 'free',
  used: 8,
  total: 10,
  resetAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10天后重置
};

// 格式化相对时间
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  if (days < 30) return `${Math.floor(days / 7)}周前`;
  return `${Math.floor(days / 30)}个月前`;
}

// 获取最近项目
export function getRecentProjects(count: number = 3): Project[] {
  return MOCK_PROJECTS.slice(0, count);
}

// 获取所有项目
export function getAllProjects(): Project[] {
  return MOCK_PROJECTS;
}

// 根据状态获取项目
export function getProjectsByStatus(status: Project['status']): Project[] {
  return MOCK_PROJECTS.filter((p) => p.status === status);
}
