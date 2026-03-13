/**
 * TryPage - 主页面
 *
 * 使用新的独立流程架构，支持单图、视频两种模式切换
 * Apple Design 风格优化版
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ModeTabs, type FlowMode } from '@/components/features/try/ModeTabs';
import { MinimalNav } from '@/components/features/try';
import { ImageSingleFlow } from '@/components/features/try/flows/ImageSingleFlow';
import { VideoFlow } from '@/components/features/try/flows/VideoFlow';
import { InviteCard } from '@/components/features/try/InviteCard';
import { useAuth } from '@/components/auth/AuthProvider';
import { useCreditsStore } from '@/lib/stores/credits-store';
import EmailVerificationBanner from '@/components/auth/EmailVerificationBanner';

// 生成匿名 ID
function generateAnonymousId(): string {
  if (typeof window === 'undefined') {
    return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }
  const stored = localStorage.getItem('vidluxe_anonymous_id');
  if (stored) return stored;
  const id = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  localStorage.setItem('vidluxe_anonymous_id', id);
  return id;
}

export default function TryPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [activeMode, setActiveMode] = useState<FlowMode>('single');
  const [anonymousId, setAnonymousId] = useState<string>('');
  const [showInviteCard, setShowInviteCard] = useState(false);
  const { fetchCredits } = useCreditsStore();

  // 初始化匿名 ID
  useEffect(() => {
    const id = generateAnonymousId();
    setAnonymousId(id);
  }, []);

  // 登录检查
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth?redirect=/try');
    }
  }, [user, loading, router]);

  // 加载中状态
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '15px',
        letterSpacing: '-0.01em',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            borderTopColor: '#D4AF37',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const renderFlow = () => {
    switch (activeMode) {
      case 'single':
        return <ImageSingleFlow />;
      case 'video':
        return <VideoFlow />;
      default:
        return <ImageSingleFlow />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000000', paddingBottom: showInviteCard ? '300px' : '88px' }}>
      {/* 邮箱验证提示横幅 */}
      <EmailVerificationBanner />

      <MinimalNav />
      <ModeTabs activeMode={activeMode} onModeChange={setActiveMode} />
      <div style={{ paddingTop: '120px' }}>
        {renderFlow()}
      </div>

      {/* 固定底部的邀请卡 */}
      {anonymousId && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: '12px 16px 20px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.95) 40%, rgba(0,0,0,0.7) 85%, transparent 100%)',
        }}>
          <div style={{ maxWidth: '480px', margin: '0 auto' }}>
            {showInviteCard ? (
              <>
                <button
                  onClick={() => setShowInviteCard(false)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '14px',
                    border: '0.5px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginBottom: '12px',
                    transition: 'all 200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                  收起邀请卡
                </button>
                <InviteCard
                  anonymousId={anonymousId}
                  onCreditsUpdate={() => fetchCredits(anonymousId)}
                  compact={false}
                />
              </>
            ) : (
              <button
                onClick={() => setShowInviteCard(true)}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: '14px',
                  border: '0.5px solid rgba(52, 199, 89, 0.2)',
                  background: 'linear-gradient(145deg, rgba(52, 199, 89, 0.1) 0%, rgba(52, 199, 89, 0.04) 100%)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
                }}
              >
                <span style={{ fontSize: '16px' }}>🎁</span>
                <span style={{ letterSpacing: '-0.01em' }}>邀请好友，双方各得 5 额度</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.5)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
