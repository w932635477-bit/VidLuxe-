'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MiniScore } from '@/components/features/landing/ScoreCard';
import {
  getRecentProjects,
  MOCK_QUOTA,
  formatRelativeTime,
  type Project,
} from '@/lib/projects';

// 项目卡片组件
function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="glass-card group cursor-pointer hover:scale-[1.02] transition-transform">
      <div className="glass-card-inner p-0 overflow-hidden rounded-3xl">
        {/* 缩略图 */}
        <div className="relative aspect-9-16">
          <Image
            src={project.thumbnailUrl}
            alt={project.title}
            fill
            className="object-cover"
          />
          {/* 评分标签 */}
          <div className="absolute top-3 right-3">
            <MiniScore score={project.score} />
          </div>
        </div>
        {/* 信息区 */}
        <div className="p-4">
          <h3 className="font-medium text-content-primary mb-1">{project.title}</h3>
          <div className="flex items-center justify-between text-sm text-content-secondary">
            <span>{formatRelativeTime(project.createdAt)}</span>
            <span className="text-brand-500">+{project.score - 60}分</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 配额卡片组件
function QuotaCard() {
  const quota = MOCK_QUOTA;
  const percentage = (quota.used / quota.total) * 100;
  const isNearLimit = percentage >= 80;

  return (
    <div className="glass-card">
      <div className="glass-card-inner">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-content-primary">使用量统计</h3>
          <span className={`text-sm px-2 py-1 rounded-full ${
            quota.plan === 'free' ? 'bg-white/10 text-content-secondary' : 'bg-brand-500/20 text-brand-500'
          }`}>
            {quota.plan === 'free' ? '免费版' : 'Pro 版'}
          </span>
        </div>

        {/* 进度条 */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-content-secondary">
              本月已用：<span className="text-content-primary">{quota.used}</span>/{quota.total} 次
            </span>
            <span className="text-content-secondary">{percentage.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isNearLimit ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-brand-600 to-brand-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* 升级提示 */}
        {quota.plan === 'free' && (
          <Link
            href="/pricing"
            className="block text-center py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-dark-bg font-medium hover:opacity-90 transition-opacity"
          >
            升级 Pro 版，无限次使用
          </Link>
        )}
      </div>
    </div>
  );
}

// 快捷操作卡片
function QuickActionsCard() {
  return (
    <div className="glass-card">
      <div className="glass-card-inner">
        <h3 className="text-lg font-medium text-content-primary mb-4">快捷操作</h3>
        <div className="grid grid-cols-3 gap-3">
          <Link
            href="/try"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <span className="text-2xl">✨</span>
            <span className="text-sm text-content-secondary">新建项目</span>
          </Link>
          <Link
            href="/dashboard/projects"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <span className="text-2xl">📊</span>
            <span className="text-sm text-content-secondary">评分历史</span>
          </Link>
          <button
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <span className="text-2xl">⚙️</span>
            <span className="text-sm text-content-secondary">设置</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// 统计数据卡片
function StatCard({ label, value, trend }: { label: string; value: string | number; trend?: string }) {
  return (
    <div className="glass-card">
      <div className="glass-card-inner text-center">
        <p className="text-sm text-content-secondary mb-1">{label}</p>
        <p className="text-2xl font-medium text-content-primary">{value}</p>
        {trend && (
          <p className="text-xs text-green-400 mt-1">{trend}</p>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const recentProjects = getRecentProjects(3);

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-medium text-content-primary">概览</h1>
        <p className="text-content-secondary mt-1">查看你的使用情况和最近项目</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="本月使用" value="8次" />
        <StatCard label="平均评分" value="81分" trend="↑ 较上月提升5分" />
        <StatCard label="最高评分" value="85分" />
        <StatCard label="项目总数" value="12个" />
      </div>

      {/* 配额和快捷操作 */}
      <div className="grid md:grid-cols-2 gap-6">
        <QuotaCard />
        <QuickActionsCard />
      </div>

      {/* 最近项目 */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium text-content-primary">最近项目</h2>
          <Link
            href="/dashboard/projects"
            className="text-sm text-brand-500 hover:text-brand-400 transition-colors"
          >
            查看全部 →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {recentProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        {recentProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-content-secondary mb-4">还没有项目</p>
            <Link href="/try" className="btn-gold px-6 py-3">
              创建第一个项目
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
