/**
 * EffectSourceSelector - 效果来源选择器
 *
 * 替代原有的 StyleSourceSelector
 * 支持两种模式：
 * 1. 上传参考图（保留原有功能）
 * 2. 效果库选择（新功能）
 */

'use client';

import { useState } from 'react';
import type { ContentType } from '@/lib/content-types';
import { EffectSelector } from './EffectSelector';

// 风格来源类型
export type EffectSourceType = 'reference' | 'effect';

interface EffectSourceSelectorProps {
  sourceType: EffectSourceType;
  onSourceTypeChange: (type: EffectSourceType) => void;
  referenceFile: File | null;
  onReferenceFileChange: (file: File | null) => void;
  selectedEffectId: string;
  onEffectChange: (effectId: string) => void;
  effectIntensity?: number;
  onIntensityChange?: (intensity: number) => void;
  contentType: ContentType;
}

export function EffectSourceSelector({
  sourceType,
  onSourceTypeChange,
  referenceFile,
  onReferenceFileChange,
  selectedEffectId,
  onEffectChange,
  effectIntensity = 100,
  onIntensityChange,
  contentType,
}: EffectSourceSelectorProps) {
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleReferenceUpload = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) return;
    if (file.size > 50 * 1024 * 1024) return;

    onReferenceFileChange(file);
    setReferencePreview(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    handleReferenceUpload(file);
  };

  const clearReference = () => {
    onReferenceFileChange(null);
    setReferencePreview(null);
  };

  return (
    <div>
      {/* 标题 */}
      <div style={{ marginBottom: '20px' }}>
        <h3
          style={{
            fontSize: '17px',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.95)',
            letterSpacing: '-0.02em',
            marginBottom: '4px',
          }}
        >
          选择效果
        </h3>
        <p
          style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.45)',
          }}
        >
          浏览效果库或上传参考图
        </p>
      </div>

      {/* 两种方式切换 */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        {/* 方式A：效果库 */}
        <button
          onClick={() => onSourceTypeChange('effect')}
          style={{
            flex: 1,
            padding: '16px',
            borderRadius: '16px',
            border: sourceType === 'effect'
              ? '2px solid #D4AF37'
              : '1px solid rgba(255, 255, 255, 0.1)',
            background: sourceType === 'effect'
              ? 'rgba(212, 175, 55, 0.08)'
              : 'rgba(255, 255, 255, 0.02)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: sourceType === 'effect'
                  ? '#D4AF37'
                  : 'rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="4"
                  stroke={sourceType === 'effect' ? '#000' : 'rgba(255,255,255,0.5)'}
                  strokeWidth="2"
                />
                <circle
                  cx="8.5"
                  cy="8.5"
                  r="1.5"
                  fill={sourceType === 'effect' ? '#000' : 'rgba(255,255,255,0.5)'}
                />
                <path
                  d="M21 15L16 10L5 21"
                  stroke={sourceType === 'effect' ? '#000' : 'rgba(255,255,255,0.5)'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: sourceType === 'effect'
                    ? '#D4AF37'
                    : 'rgba(255, 255, 255, 0.8)',
                  marginBottom: '2px',
                }}
              >
                效果库
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.45)',
                }}
              >
                滑动选择预设效果
              </div>
            </div>
          </div>
        </button>

        {/* 方式B：上传参考图 */}
        <button
          onClick={() => onSourceTypeChange('reference')}
          style={{
            flex: 1,
            padding: '16px',
            borderRadius: '16px',
            border: sourceType === 'reference'
              ? '2px solid #D4AF37'
              : '1px solid rgba(255, 255, 255, 0.1)',
            background: sourceType === 'reference'
              ? 'rgba(212, 175, 55, 0.08)'
              : 'rgba(255, 255, 255, 0.02)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: sourceType === 'reference'
                  ? '#D4AF37'
                  : 'rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 16V4M12 4L8 8M12 4L16 8M4 16V18C4 19.1 4.9 20 6 20H18C19.1 20 20 19.1 20 18V16"
                  stroke={sourceType === 'reference' ? '#000' : 'rgba(255,255,255,0.5)'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: sourceType === 'reference'
                    ? '#D4AF37'
                    : 'rgba(255, 255, 255, 0.8)',
                  marginBottom: '2px',
                }}
              >
                参考图
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.45)',
                }}
              >
                AI 学习你喜欢的风格
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* 根据选择显示不同内容 */}
      {sourceType === 'reference' ? (
        <div>
          {referencePreview ? (
            // 已上传参考图
            <div
              style={{
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div style={{ aspectRatio: '16/9', position: 'relative' }}>
                {referenceFile?.type.startsWith('video/') ? (
                  <video
                    src={referencePreview}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    muted
                    autoPlay
                    loop
                  />
                ) : (
                  <img
                    src={referencePreview}
                    alt="参考图预览"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                )}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '16px',
                    left: '16px',
                    right: '16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                    }}
                  >
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#34C759',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: 'rgba(255, 255, 255, 0.9)',
                      }}
                    >
                      风格已提取
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.5)',
                    }}
                  >
                    AI 将学习这张图片的风格并应用到你的内容
                  </p>
                </div>
              </div>
              <button
                onClick={clearReference}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="rgba(255,255,255,0.7)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          ) : (
            // 上传区域
            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => document.getElementById('reference-input-effect')?.click()}
              style={{
                padding: '40px 24px',
                borderRadius: '16px',
                border: isDragOver
                  ? '2px dashed #D4AF37'
                  : '1px dashed rgba(255, 255, 255, 0.15)',
                background: isDragOver
                  ? 'rgba(212, 175, 55, 0.05)'
                  : 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.3s ease',
              }}
            >
              <input
                id="reference-input-effect"
                type="file"
                accept="image/*,video/*"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files?.[0] && handleReferenceUpload(e.target.files[0])}
              />
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  margin: '0 auto 16px',
                  borderRadius: '16px',
                  background: 'rgba(212, 175, 55, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 16L8.586 11.414C9.367 10.633 10.633 10.633 11.414 11.414L16 16M14 14L15.586 12.414C16.367 11.633 17.633 11.633 18.414 12.414L20 14M14 8H14.01M6 20H18C19.105 20 20 19.105 20 18V6C20 4.895 19.105 4 18 4H6C4.895 4 4 4.895 4 6V18C4 19.105 4.895 20 6 20Z"
                    stroke="#D4AF37"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p
                style={{
                  fontSize: '15px',
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.8)',
                  marginBottom: '6px',
                }}
              >
                上传风格参考图
              </p>
              <p
                style={{
                  fontSize: '13px',
                  color: 'rgba(255, 255, 255, 0.4)',
                }}
              >
                支持 JPG、PNG、MP4，最大 50MB
              </p>
            </div>
          )}
        </div>
      ) : (
        // 效果库选择
        <EffectSelector
          contentType={contentType}
          selectedEffectId={selectedEffectId}
          onSelect={onEffectChange}
          effectIntensity={effectIntensity}
          onIntensityChange={onIntensityChange}
        />
      )}
    </div>
  );
}
