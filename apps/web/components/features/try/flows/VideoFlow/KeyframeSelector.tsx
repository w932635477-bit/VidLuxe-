/**
 * KeyframeSelector - 关键帧选择组件
 *
 * 用于视频流程中选择封面帧（必选1张）和替换帧（多选）
 */

'use client';

import type { KeyFrame } from '@/lib/types/flow';

interface KeyframeSelectorProps {
  keyframes: KeyFrame[];
  coverFrame: KeyFrame | null;
  replaceFrames: KeyFrame[];
  onCoverSelect: (frame: KeyFrame) => void;
  onReplaceToggle: (frame: KeyFrame) => void;
  previewUrl: string;
}

// 格式化时间戳为 mm:ss 格式
function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function KeyframeSelector({
  keyframes,
  coverFrame,
  replaceFrames,
  onCoverSelect,
  onReplaceToggle,
  previewUrl,
}: KeyframeSelectorProps) {
  const isSelectedForReplace = (frame: KeyFrame) =>
    replaceFrames.some((f) => f.timestamp === frame.timestamp && f.url === frame.url);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* 封面帧区域 */}
      <div>
        <p style={{ fontSize: '17px', fontWeight: 500, marginBottom: '16px', color: '#ffffff' }}>
          选择封面帧（必选 1 张）
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
          }}
        >
          {keyframes.map((frame, index) => {
            const isSelected = coverFrame?.timestamp === frame.timestamp && coverFrame?.url === frame.url;
            return (
              <div
                key={`cover-${index}`}
                onClick={() => onCoverSelect(frame)}
                style={{
                  aspectRatio: '9/16',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: isSelected ? '2px solid #D4AF37' : '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  position: 'relative',
                  background: 'rgba(255, 255, 255, 0.02)',
                }}
              >
                {/* 视频缩略图 */}
                <video
                  src={previewUrl}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  muted
                  playsInline
                />

                {/* 选中标签 */}
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: '#D4AF37',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#000000',
                    }}
                  >
                    封面
                  </div>
                )}

                {/* 分数 */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#D4AF37',
                  }}
                >
                  {frame.score}分
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 替换帧区域 */}
      <div>
        <p style={{ fontSize: '17px', fontWeight: 500, marginBottom: '16px', color: '#ffffff' }}>
          选择替换帧（可选，增强后替换视频中的帧）
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
          }}
        >
          {keyframes.map((frame, index) => {
            const isSelected = isSelectedForReplace(frame);
            return (
              <div
                key={`replace-${index}`}
                onClick={() => onReplaceToggle(frame)}
                style={{
                  aspectRatio: '9/16',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: isSelected ? '2px solid #34C759' : '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  position: 'relative',
                  background: 'rgba(255, 255, 255, 0.02)',
                  opacity: isSelected ? 1 : 0.6,
                  transition: 'opacity 0.2s ease',
                }}
              >
                {/* 视频缩略图 */}
                <video
                  src={previewUrl}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  muted
                  playsInline
                />

                {/* 选中勾选 */}
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      background: '#34C759',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}

                {/* 时间戳 */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: isSelected ? '#34C759' : 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  {formatTimestamp(frame.timestamp)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 已选统计 */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.7)' }}>
          已选：封面帧{' '}
          <span style={{ color: '#D4AF37', fontWeight: 600 }}>
            {coverFrame ? 1 : 0}
          </span>
          {' '}张 + 替换帧{' '}
          <span style={{ color: '#34C759', fontWeight: 600 }}>
            {replaceFrames.length}
          </span>
          {' '}张
        </p>
      </div>
    </div>
  );
}

export default KeyframeSelector;
