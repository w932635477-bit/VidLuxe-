'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MiniScore } from '@/components/features/landing/ScoreCard';
import {
  getAllProjects,
  formatRelativeTime,
  type Project,
} from '@/lib/projects';

// 筛选选项
const FILTERS = [
  { value: 'all', label: '全部' },
  { value: 'completed', label: '已完成' },
  { value: 'processing', label: '处理中' },
] as const;

// 项目行组件
function ProjectRow({ project }: { project: Project }) {
  return (
    <div className="glass-card group">
      <div className="glass-card-inner p-4">
        <div className="flex items-center gap-4">
          {/* 缩略图 */}
          <div className="relative w-16 h-28 rounded-xl overflow-hidden flex-shrink-0">
            <Image
              src={project.thumbnailUrl}
              alt={project.title}
              fill
              className="object-cover"
            />
          </div>

          {/* 信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-medium text-content-primary mb-1">{project.title}</h3>
                <p className="text-sm text-content-secondary">
                  {formatRelativeTime(project.createdAt)} · {project.style}
                </p>
              </div>
              <MiniScore score={project.score} />
            </div>

            {/* 维度评分 */}
            <div className="mt-3 flex flex-wrap gap-3">
              <div className="text-xs">
                <span className="text-content-secondary">色彩</span>
                <span className="ml-1 text-content-primary">{project.dimensions.color}</span>
              </div>
              <div className="text-xs">
                <span className="text-content-secondary">构图</span>
                <span className="ml-1 text-content-primary">{project.dimensions.composition}</span>
              </div>
              <div className="text-xs">
                <span className="text-content-secondary">排版</span>
                <span className="ml-1 text-content-primary">{project.dimensions.typography}</span>
              </div>
              <div className="text-xs">
                <span className="text-content-secondary">细节</span>
                <span className="ml-1 text-content-primary">{project.dimensions.detail}</span>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-content-secondary hover:text-content-primary transition-colors">
              ⬇️
            </button>
            <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-content-secondary hover:text-content-primary transition-colors">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [filter, setFilter] = useState<string>('all');
  const projects = getAllProjects();

  const filteredProjects = filter === 'all'
    ? projects
    : projects.filter((p) => p.status === filter);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-content-primary">项目列表</h1>
          <p className="text-content-secondary mt-1">管理你的所有升级项目</p>
        </div>
        <Link href="/try" className="btn-gold px-6 py-3 text-center">
          + 新建项目
        </Link>
      </div>

      {/* 筛选和搜索 */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* 筛选按钮 */}
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                filter === f.value
                  ? 'bg-brand-500/20 text-brand-500'
                  : 'bg-white/5 text-content-secondary hover:bg-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 搜索框 */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="搜索项目..."
              className="w-full px-4 py-2 pl-10 rounded-lg bg-white/5 border border-white/10 text-content-primary placeholder:text-content-tertiary focus:outline-none focus:border-brand-500/50"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-content-tertiary">
              🔍
            </span>
          </div>
        </div>
      </div>

      {/* 项目列表 */}
      <div className="space-y-3">
        {filteredProjects.map((project) => (
          <ProjectRow key={project.id} project={project} />
        ))}

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-content-secondary mb-4">没有找到项目</p>
            <Link href="/try" className="btn-gold px-6 py-3">
              创建第一个项目
            </Link>
          </div>
        )}
      </div>

      {/* 分页（占位） */}
      {filteredProjects.length > 0 && (
        <div className="flex justify-center gap-2">
          <button className="px-3 py-1 rounded bg-white/5 text-content-secondary hover:bg-white/10">
            ←
          </button>
          <button className="px-3 py-1 rounded bg-brand-500/20 text-brand-500">1</button>
          <button className="px-3 py-1 rounded bg-white/5 text-content-secondary hover:bg-white/10">2</button>
          <button className="px-3 py-1 rounded bg-white/5 text-content-secondary hover:bg-white/10">3</button>
          <button className="px-3 py-1 rounded bg-white/5 text-content-secondary hover:bg-white/10">
            →
          </button>
        </div>
      )}
    </div>
  );
}
