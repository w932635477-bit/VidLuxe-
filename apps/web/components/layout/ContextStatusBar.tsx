'use client';

import { useEffect, useState } from 'react';
import { useCreditsStore } from '@/lib/stores/credits-store';
import { useAuth } from '@/components/auth/AuthProvider';

interface ContextStatusBarProps {
  /** 是否显示详细模式 */
  detailed?: boolean;
}

/**
 * 全局上下文状态栏
 * 显示额度使用情况和上下文窗口监控
 */
export function ContextStatusBar({ detailed = false }: ContextStatusBarProps) {
  const { user } = useAuth();
  const { total, paid, free, isLoading } = useCreditsStore();
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(detailed);

  // 避免服务端渲染不匹配
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // 计算使用百分比（假设最大 100 次）
  const maxCredits = 100;
  const usedPercent = Math.min(100, Math.round((1 - total / maxCredits) * 100));
  const remainingPercent = 100 - usedPercent;

  // 颜色根据剩余额度变化
  const getBarColor = () => {
    if (remainingPercent <= 10) return '#ef4444'; // 红色 - 危险
    if (remainingPercent <= 30) return '#f59e0b'; // 橙色 - 警告
    return '#22c55e'; // 绿色 - 正常
  };

  const barColor = getBarColor();

  // 简洁模式（默认）
  if (!expanded) {
    return (
      <div
        onClick={() => setExpanded(true)}
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          zIndex: 9999,
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.95)';
          e.currentTarget.style.transform = 'scale(1.02)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.85)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {/* 进度环 */}
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: `conic-gradient(${barColor} ${remainingPercent}%, rgba(255, 255, 255, 0.1) ${remainingPercent}%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '9px', color: '#fff', fontWeight: 600 }}>
              {total}
            </span>
          </div>
        </div>
        <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>
          {total} 次
        </span>
      </div>
    );
  }

  // 展开模式
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '16px',
        minWidth: '240px',
        zIndex: 9999,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* 标题栏 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px' }}>📊</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
            上下文监控
          </span>
        </div>
        <button
          onClick={() => setExpanded(false)}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '6px',
            padding: '4px 8px',
            cursor: 'pointer',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '11px',
          }}
        >
          收起
        </button>
      </div>

      {/* 总额度进度条 */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>剩余额度</span>
          <span style={{ fontSize: '11px', color: barColor, fontWeight: 600 }}>
            {remainingPercent}%
          </span>
        </div>
        <div
          style={{
            height: '6px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '3px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${remainingPercent}%`,
              background: barColor,
              borderRadius: '3px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* 详细数据 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
        }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            padding: '10px',
          }}
        >
          <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '4px' }}>
            付费额度
          </div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#D4AF37' }}>
            {paid}
            <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginLeft: '2px' }}>
              次
            </span>
          </div>
        </div>
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            padding: '10px',
          }}
        >
          <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '4px' }}>
            免费额度
          </div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#22c55e' }}>
            {free}
            <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginLeft: '2px' }}>
              次
            </span>
          </div>
        </div>
      </div>

      {/* 总计 */}
      <div
        style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
          总计
        </span>
        <span style={{ fontSize: '16px', fontWeight: 600, color: '#fff' }}>
          {total} 次
        </span>
      </div>

      {/* 登录状态 */}
      {user && (
        <div
          style={{
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#22c55e',
            }}
          />
          <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)' }}>
            已登录
          </span>
        </div>
      )}
    </div>
  );
}
