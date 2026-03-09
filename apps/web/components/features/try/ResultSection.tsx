/**
 * 结果界面组件
 *
 * 显示处理结果、评分和下载按钮
 * 优化后的设计：简洁双按钮 + 次要操作
 */

'use client';

import { useState } from 'react';
import { SeedingScoreCard } from './SeedingScoreCard';
import { CreditsCard } from './CreditsCard';
import { useCreditsStore } from '@/lib/stores/credits-store';
import type { ContentType } from '@/lib/types/try-page';
import type { ResultData } from '@/lib/types/flow';

interface ResultSectionProps {
  resultData: ResultData;
  contentType: ContentType;
  onReset: () => void;
  /** 本次消耗的额度，默认为 1 */
  creditsConsumed?: number;
}

// 下载图片的辅助函数
async function downloadImage(url: string, filename: string): Promise<void> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('下载失败');

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 清理 blob URL
    setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
  } catch (error) {
    console.error('Download error:', error);
    // 回退方案：直接打开图片
    window.open(url, '_blank');
  }
}

// 按钮样式常量
const styles = {
  // 主按钮样式（金色）
  primaryButton: {
    width: '100%',
    padding: '18px 40px',
    borderRadius: '14px',
    border: 'none',
    background: '#D4AF37',
    color: '#000000',
    fontSize: '17px',
    fontWeight: 600,
    letterSpacing: '0.02em',
    textAlign: 'center' as const,
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
  },
  // 次级按钮样式（透明边框）
  secondaryButton: {
    flex: 1,
    padding: '14px 20px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    background: 'transparent',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '14px',
    fontWeight: 500,
    letterSpacing: '0.01em',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
};

export function ResultSection({ resultData, contentType, onReset, creditsConsumed = 1 }: ResultSectionProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { total: remainingCredits } = useCreditsStore();

  // 处理下载
  const handleDownload = async () => {
    const url = contentType === 'video' && resultData.enhancedVideoUrl
      ? resultData.enhancedVideoUrl
      : (resultData.enhancedCoverUrl || resultData.enhancedUrl);

    if (!url) return;

    setIsDownloading(true);
    const extension = url.includes('.mp4') || contentType === 'video' ? 'mp4' : 'jpg';
    const filename = `vidluxe_enhanced_${Date.now()}.${extension}`;

    await downloadImage(url, filename);
    setIsDownloading(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '80px 24px 40px',
        maxWidth: '480px',
        margin: '0 auto',
      }}
    >
      {/* 视频/图片预览 */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
        <div
          style={{
            width: '100%',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 20px 80px rgba(0, 0, 0, 0.5)',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '0.5px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {/* 视频流程：优先使用 enhancedVideoUrl，否则显示封面 */}
          {contentType === 'video' && resultData.enhancedVideoUrl ? (
            <video
              src={resultData.enhancedVideoUrl}
              style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', display: 'block' }}
              controls
              autoPlay
              loop
              playsInline
              poster={resultData.enhancedCoverUrl || resultData.enhancedUrl}
            />
          ) : contentType === 'video' && !resultData.enhancedVideoUrl ? (
            /* 视频流程但没有视频时，显示封面图 */
            <img
              src={resultData.enhancedCoverUrl || resultData.enhancedUrl}
              alt="增强封面"
              style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            /* 图片流程 */
            <img
              src={resultData.enhancedUrl}
              alt="增强后的图片"
              style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', display: 'block' }}
            />
          )}
          {/* 状态提示 */}
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.6 }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 4L12 14.01l-3-3" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
              {contentType === 'video'
                ? (resultData.enhancedVideoUrl ? 'AI 增强视频已生成' : 'AI 增强封面已生成')
                : 'AI 增强图片已生成'}
            </span>
          </div>
        </div>
      </div>

      {/* 种草力评分卡片 */}
      {resultData.score && <SeedingScoreCard score={resultData.score} />}

      {/* 额度卡片 */}
      <div style={{ marginTop: resultData.score ? '16px' : '0' }}>
        <CreditsCard
          remainingCredits={remainingCredits}
          consumedCredits={creditsConsumed}
        />
      </div>

      {/* 下载按钮区域 */}
      <div style={{ marginTop: '24px' }}>
        {/* 主下载按钮 - 视频/图片 */}
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          style={{
            ...styles.primaryButton,
            opacity: isDownloading ? 0.7 : 1,
            cursor: isDownloading ? 'wait' : 'pointer',
          }}
          onMouseEnter={(e) => {
            if (!isDownloading) {
              e.currentTarget.style.background = '#E5C04B';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(212, 175, 55, 0.35)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#D4AF37';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {contentType === 'video'
            ? (resultData.enhancedVideoUrl ? '下载视频' : '下载封面')
            : isDownloading ? '下载中...' : '下载高清图'}
        </button>

        {/* 次要操作按钮组 */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          {/* 封面图下载 - 仅在视频流程且有视频时显示（主按钮下载视频，此处下载封面） */}
          {contentType === 'video' && resultData.enhancedVideoUrl && resultData.enhancedCoverUrl && (
            <button
              onClick={() => downloadImage(resultData.enhancedCoverUrl!, `vidluxe_cover_${Date.now()}.jpg`)}
              style={styles.secondaryButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              封面图
            </button>
          )}

          {/* 重新开始 */}
          <button
            onClick={onReset}
            style={styles.secondaryButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M1 4v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.51 15a9 9 0 1 1 0-13.13 9 9 0 0 1 15-3.51" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            再试一个
          </button>
        </div>
      </div>
    </div>
  );
}
