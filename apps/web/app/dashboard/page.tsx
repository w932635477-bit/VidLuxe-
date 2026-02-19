'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  getRecentProjects,
  MOCK_QUOTA,
  formatRelativeTime,
  type Project,
} from '@/lib/projects';

// Apple 风格：极简导航
function DashboardNav() {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <Link href="/try" style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
          体验
        </Link>
        <Link href="/pricing" style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
          定价
        </Link>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #D4AF37, #B8962E)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 600,
          color: '#000',
        }}>
          U
        </div>
      </div>
    </nav>
  );
}

// Apple 风格：简洁配额显示
function QuotaBar() {
  const quota = MOCK_QUOTA;
  const remaining = quota.total - quota.used;
  const percentage = (quota.used / quota.total) * 100;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 20px',
      borderRadius: '14px',
      background: 'rgba(255, 255, 255, 0.03)',
      marginBottom: '40px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: 'rgba(212, 175, 55, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{ fontSize: '24px' }}>✨</span>
        </div>
        <div>
          <p style={{ fontSize: '15px', fontWeight: 500, marginBottom: '2px' }}>
            剩余 {remaining} 次免费额度
          </p>
          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.4)' }}>
            已使用 {quota.used}/{quota.total} 次
          </p>
        </div>
      </div>

      {/* 进度环 */}
      <div style={{ position: 'relative', width: '44px', height: '44px' }}>
        <svg viewBox="0 0 44 44" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="4"
          />
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke="#D4AF37"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${(100 - percentage) * 1.13} 113`}
          />
        </svg>
      </div>
    </div>
  );
}

// Apple 风格：大图项目卡片
function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/dashboard/projects/${project.id}`}
      style={{
        display: 'block',
        borderRadius: '20px',
        overflow: 'hidden',
        background: 'rgba(255, 255, 255, 0.02)',
        transition: 'transform 0.3s ease',
      }}
    >
      {/* 图片 */}
      <div style={{ position: 'relative', aspectRatio: '9/16' }}>
        <Image
          src={project.thumbnailUrl}
          alt={project.title}
          fill
          className="object-cover"
          unoptimized
        />
        {/* 评分徽章 */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          padding: '6px 12px',
          borderRadius: '980px',
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#D4AF37' }}>
            {project.score}
          </span>
          <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
            分
          </span>
        </div>
      </div>

      {/* 信息 */}
      <div style={{ padding: '16px' }}>
        <p style={{ fontSize: '15px', fontWeight: 500, marginBottom: '4px' }}>
          {project.title}
        </p>
        <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.4)' }}>
          {formatRelativeTime(project.createdAt)}
        </p>
      </div>
    </Link>
  );
}

// 空状态
function EmptyState() {
  return (
    <div style={{
      textAlign: 'center',
      padding: '80px 24px',
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        margin: '0 auto 24px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{ fontSize: '36px' }}>✨</span>
      </div>
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
        开始你的第一个项目
      </h2>
      <p style={{
        fontSize: '17px',
        color: 'rgba(255, 255, 255, 0.5)',
        marginBottom: '32px',
        maxWidth: '300px',
        margin: '0 auto 32px',
      }}>
        上传一张图片，让 AI 为它注入高级感
      </p>
      <Link
        href="/try"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px 32px',
          borderRadius: '980px',
          background: '#D4AF37',
          color: '#000000',
          fontSize: '17px',
          fontWeight: 500,
          textDecoration: 'none',
        }}
      >
        立即体验
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  const recentProjects = getRecentProjects(6);

  return (
    <main style={{ minHeight: '100vh', background: '#000000' }}>
      <DashboardNav />

      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '88px 24px 60px',
      }}>
        {/* 页面标题 */}
        <h1 style={{
          fontSize: '34px',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          marginBottom: '8px',
        }}>
          项目
        </h1>
        <p style={{
          fontSize: '17px',
          color: 'rgba(255, 255, 255, 0.5)',
          marginBottom: '32px',
        }}>
          管理你的 AI 升级作品
        </p>

        {/* 配额信息 */}
        <QuotaBar />

        {/* 项目列表 或 空状态 */}
        {recentProjects.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
          }}>
            {recentProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </main>
  );
}
