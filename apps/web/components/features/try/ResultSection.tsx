/**
 * 结果界面组件
 *
 * 显示处理结果、评分和下载按钮
 */

'use client';

import { SeedingScoreCard } from './SeedingScoreCard';
import type { ContentType, ResultData } from '@/lib/types/try-page';

interface ResultSectionProps {
  resultData: ResultData;
  contentType: ContentType;
  onReset: () => void;
}

export function ResultSection({ resultData, contentType, onReset }: ResultSectionProps) {
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
      {/* 视频预览 */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
        <div
          style={{
            width: '100%',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 20px 80px rgba(0, 0, 0, 0.5)',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {contentType === 'video' ? (
            <video
              src={resultData.enhancedUrl}
              style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', display: 'block' }}
              controls
              autoPlay
              loop
              playsInline
              poster={resultData.enhancedCoverUrl}
            />
          ) : (
            <img
              src={resultData.enhancedUrl}
              alt="增强后的图片"
              style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', display: 'block' }}
            />
          )}
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
              {contentType === 'video' ? 'AI 增强视频已生成，封面已插入开头' : 'AI 增强图片已生成'}
            </span>
          </div>
        </div>
      </div>

      {/* 种草力评分卡片 */}
      {resultData.score && <SeedingScoreCard score={resultData.score} />}

      {/* 下载按钮 */}
      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* 封面图下载 */}
        {resultData.enhancedCoverUrl && (
          <a
            href={resultData.enhancedCoverUrl}
            download
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'transparent',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '15px',
              fontWeight: 500,
              textAlign: 'center',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
              <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            下载 AI 封面图
          </a>
        )}

        {/* 视频下载 */}
        <a
          href={resultData.enhancedUrl}
          download
          style={{
            width: '100%',
            padding: '18px',
            borderRadius: '14px',
            border: 'none',
            background: '#D4AF37',
            color: '#000000',
            fontSize: '17px',
            fontWeight: 600,
            textAlign: 'center',
            textDecoration: 'none',
            display: 'block',
            cursor: 'pointer',
          }}
        >
          {contentType === 'video' ? '下载带封面的视频' : '下载高清图'}
        </a>
      </div>

      {/* 次要操作 */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
        <button
          onClick={onReset}
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            background: 'transparent',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '15px',
            cursor: 'pointer',
          }}
        >
          再试一个
        </button>
        <button
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            background: 'transparent',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '15px',
            cursor: 'pointer',
          }}
        >
          分享
        </button>
      </div>
    </div>
  );
}
