'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  getAllProjects,
  formatRelativeTime,
  type Project,
} from '@/lib/projects';

// Apple 风格导航
function ProjectsNav() {
  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      padding: '0 24px',
      height: '52px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '0.5px solid rgba(255, 255, 255, 0.06)',
    }}>
      <Link href="/" style={{ fontSize: '17px', fontWeight: 600, letterSpacing: '-0.02em' }}>
        VidLuxe
      </Link>
      <Link
        href="/try"
        style={{
          padding: '8px 20px',
          borderRadius: '980px',
          background: '#D4AF37',
          color: '#000',
          fontSize: '14px',
          fontWeight: 500,
        }}
      >
        新建项目
      </Link>
    </nav>
  );
}

// 项目卡片
function ProjectCard({ project }: { project: Project }) {
  const styleNames: Record<string, string> = {
    minimal: '极简',
    warmLuxury: '暖调奢华',
    coolPro: '冷调专业',
    morandi: '莫兰迪',
  };

  const handleDownload = async () => {
    if (project.enhancedUrl) {
      try {
        const response = await fetch(project.enhancedUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vidluxe-${project.id}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch {
        // 降级方案：直接打开链接
        window.open(project.enhancedUrl, '_blank');
      }
    } else {
      alert('该项目暂无可下载的结果');
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '16px',
      borderRadius: '16px',
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid rgba(255, 255, 255, 0.04)',
    }}>
      {/* 缩略图 */}
      <div style={{
        width: '64px',
        height: '100px',
        borderRadius: '12px',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'relative',
      }}>
        <Image
          src={project.thumbnailUrl}
          alt={project.title}
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      {/* 信息 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 500 }}>{project.title}</h3>
          <span style={{
            padding: '4px 10px',
            borderRadius: '6px',
            background: 'rgba(212, 175, 55, 0.15)',
            color: '#D4AF37',
            fontSize: '13px',
            fontWeight: 600,
          }}>
            {project.score}
          </span>
        </div>
        <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '8px' }}>
          {formatRelativeTime(project.createdAt)} · {styleNames[project.style]}
        </p>

        {/* 维度评分 */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>
            色彩 <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{project.dimensions.color}</span>
          </span>
          <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>
            构图 <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{project.dimensions.composition}</span>
          </span>
          <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>
            细节 <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{project.dimensions.detail}</span>
          </span>
        </div>
      </div>

      {/* 操作 */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleDownload}
          style={{
          padding: '8px 12px',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '13px',
          cursor: 'pointer',
        }}>
          下载
        </button>
      </div>
    </div>
  );
}

const FILTERS = [
  { value: 'all', label: '全部' },
  { value: 'completed', label: '已完成' },
  { value: 'processing', label: '处理中' },
];

export default function ProjectsPage() {
  const [filter, setFilter] = useState<string>('all');
  const projects = getAllProjects();

  const filteredProjects = filter === 'all'
    ? projects
    : projects.filter((p) => p.status === filter);

  return (
    <main style={{ minHeight: '100vh', background: '#000000' }}>
      <ProjectsNav />

      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '88px 24px 60px',
      }}>
        {/* 标题 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '34px', fontWeight: 600, marginBottom: '4px' }}>项目列表</h1>
            <p style={{ fontSize: '17px', color: 'rgba(255, 255, 255, 0.5)' }}>
              管理所有升级项目
            </p>
          </div>
        </div>

        {/* 筛选 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                border: 'none',
                background: filter === f.value
                  ? 'rgba(212, 175, 55, 0.15)'
                  : 'rgba(255, 255, 255, 0.03)',
                color: filter === f.value ? '#D4AF37' : 'rgba(255, 255, 255, 0.5)',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 项目列表 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}

          {filteredProjects.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ color: 'rgba(255, 255, 255, 0.5)', marginBottom: '20px' }}>
                没有找到项目
              </p>
              <Link
                href="/try"
                style={{
                  display: 'inline-flex',
                  padding: '12px 24px',
                  borderRadius: '980px',
                  background: '#D4AF37',
                  color: '#000',
                  fontSize: '15px',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                创建第一个项目
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
