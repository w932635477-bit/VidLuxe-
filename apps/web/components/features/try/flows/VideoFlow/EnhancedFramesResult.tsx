/**
 * EnhancedFramesResult - 增强图片结果展示组件
 *
 * 滑动卡片展示 + 一键下载功能
 */

'use client';

import { useState, useCallback } from 'react';
import type { ResultData } from '@/lib/types/flow';

interface EnhancedFramesResultProps {
  resultData: ResultData;
  onReset: () => void;
  credits: number;
  anonymousId: string;
  onCreditsUpdate: () => void;
}

// 下载确认弹窗
function DownloadConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  frameCount,
  currentCredits,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  frameCount: number;
  currentCredits: number;
}) {
  if (!isOpen) return null;

  const enoughCredits = currentCredits >= frameCount;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: '#1a1a2e',
        borderRadius: '20px',
        padding: '32px',
        maxWidth: '400px',
        width: '90%',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px', color: '#fff' }}>
          确认下载
        </h3>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '24px', lineHeight: 1.6 }}>
          {enoughCredits ? (
            <>
              将下载 <span style={{ color: '#D4AF37', fontWeight: 600 }}>{frameCount}</span> 张增强图片，
              消耗 <span style={{ color: '#D4AF37', fontWeight: 600 }}>{frameCount}</span> 额度。
              <br />
              当前余额：<span style={{ color: '#34C759', fontWeight: 600 }}>{currentCredits}</span> 额度
            </>
          ) : (
            <>
              额度不足！需要 <span style={{ color: '#FF3B30', fontWeight: 600 }}>{frameCount}</span> 额度，
              当前只有 <span style={{ color: '#FF3B30', fontWeight: 600 }}>{currentCredits}</span> 额度
            </>
          )}
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'transparent',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            取消
          </button>
          {enoughCredits ? (
            <button
              onClick={onConfirm}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                background: '#D4AF37',
                color: '#000',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              确认下载
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                window.location.href = '/pricing';
              }}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                background: '#D4AF37',
                color: '#000',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              去充值
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EnhancedFramesResult({
  resultData,
  onReset,
  credits,
  onCreditsUpdate,
}: EnhancedFramesResultProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const frames = resultData.enhancedFrames || [];
  const currentFrame = frames[currentIndex];

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : frames.length - 1));
  }, [frames.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < frames.length - 1 ? prev + 1 : 0));
  }, [frames.length]);

  const handleDownloadAll = useCallback(async () => {
    if (credits < frames.length) {
      setShowDownloadModal(true);
      return;
    }
    setShowDownloadModal(true);
  }, [credits, frames.length]);

  const confirmDownload = useCallback(async () => {
    setIsDownloading(true);
    setShowDownloadModal(false);

    try {
      // 逐张下载图片
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        const response = await fetch(frame.enhancedUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `enhanced_frame_${i + 1}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // 短暂延迟避免浏览器阻止多次下载
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // 更新额度
      onCreditsUpdate();
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  }, [frames, onCreditsUpdate]);

  if (frames.length === 0 || !currentFrame) {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '80px 24px 40px',
      maxWidth: '480px',
      margin: '0 auto',
    }}>
      {/* 标题 */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 600, marginBottom: '8px' }}>
          增强完成
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          共 {frames.length} 张图片
        </p>
      </div>

      {/* 滑动卡片区域 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* 图片对比展示 */}
        <div style={{
          width: '100%',
          aspectRatio: '9/16',
          borderRadius: '24px',
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          position: 'relative',
          marginBottom: '24px',
        }}>
          <img
            src={currentFrame.enhancedUrl}
            alt={`增强图片 ${currentIndex + 1}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />

          {/* 图片序号 */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 16px',
            borderRadius: '20px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 500,
          }}>
            {currentIndex + 1} / {frames.length}
          </div>
        </div>

        {/* 左右切换按钮 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
          marginBottom: '32px',
        }}>
          <button
            onClick={handlePrev}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ←
          </button>
          <button
            onClick={handleNext}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            →
          </button>
        </div>

        {/* 缩略图导航 */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          padding: '8px 0',
          marginBottom: '24px',
          maxWidth: '100%',
        }}>
          {frames.map((frame, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              style={{
                width: '48px',
                height: '64px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: index === currentIndex ? '2px solid #D4AF37' : '2px solid transparent',
                cursor: 'pointer',
                flexShrink: 0,
                padding: 0,
                background: 'none',
              }}
            >
              <img
                src={frame.enhancedUrl}
                alt={`缩略图 ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* 下载按钮区域 */}
      <div style={{ marginTop: 'auto' }}>
        {/* 额度显示 */}
        <div style={{
          padding: '12px 16px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' }}>
            下载需消耗
          </span>
          <span style={{ color: '#D4AF37', fontWeight: 600 }}>
            {frames.length} 额度（当前余额：{credits}）
          </span>
        </div>

        {/* 一键下载按钮 */}
        <button
          onClick={handleDownloadAll}
          disabled={isDownloading}
          style={{
            width: '100%',
            padding: '18px 40px',
            borderRadius: '14px',
            border: 'none',
            background: isDownloading ? 'rgba(255, 255, 255, 0.1)' : '#D4AF37',
            color: isDownloading ? 'rgba(255, 255, 255, 0.3)' : '#000',
            fontSize: '17px',
            fontWeight: 600,
            cursor: isDownloading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: '12px',
          }}
        >
          {isDownloading ? '下载中...' : `一键下载全部图片 (${frames.length} 张)`}
        </button>

        {/* 返回按钮 */}
        <button
          onClick={onReset}
          style={{
            width: '100%',
            padding: '14px 20px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            background: 'transparent',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          处理新视频
        </button>
      </div>

      {/* 下载确认弹窗 */}
      <DownloadConfirmModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onConfirm={confirmDownload}
        frameCount={frames.length}
        currentCredits={credits}
      />
    </div>
  );
}

export default EnhancedFramesResult;
