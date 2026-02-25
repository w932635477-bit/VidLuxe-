'use client';

import type { KeyFrame } from '@/lib/types/try-page';

interface KeyframeMultiSelectorProps {
  keyframes: KeyFrame[];
  selectedFrames: KeyFrame[];
  coverFrame: KeyFrame | null;
  onSelectionChange: (frames: KeyFrame[]) => void;
  onCoverChange: (frame: KeyFrame) => void;
  disabled?: boolean;
}

export function KeyframeMultiSelector({
  keyframes,
  selectedFrames,
  coverFrame,
  onSelectionChange,
  onCoverChange,
  disabled = false,
}: KeyframeMultiSelectorProps) {
  const toggleFrame = (frame: KeyFrame) => {
    if (disabled) return;

    const isSelected = selectedFrames.some(f => f.timestamp === frame.timestamp);

    if (isSelected) {
      const newSelection = selectedFrames.filter(f => f.timestamp !== frame.timestamp);
      onSelectionChange(newSelection);

      if (coverFrame?.timestamp === frame.timestamp) {
        if (newSelection.length > 0) {
          onCoverChange(newSelection[0]);
        }
      }
    } else {
      if (selectedFrames.length < 9) {
        const newSelection = [...selectedFrames, frame];
        onSelectionChange(newSelection);

        if (newSelection.length === 1) {
          onCoverChange(frame);
        }
      }
    }
  };

  const setAsCover = (frame: KeyFrame) => {
    if (disabled) return;
    if (!selectedFrames.some(f => f.timestamp === frame.timestamp)) return;
    onCoverChange(frame);
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
      }}>
        <span style={{ fontSize: '15px', fontWeight: 500 }}>
          选择关键帧（可多选，最多9帧）
        </span>
        <span style={{ fontSize: '13px', color: '#D4AF37' }}>
          已选 {selectedFrames.length}/9 帧，消耗 {selectedFrames.length} 额度
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '12px',
      }}>
        {keyframes.map((frame) => {
          const isSelected = selectedFrames.some(f => f.timestamp === frame.timestamp);
          const isCover = coverFrame?.timestamp === frame.timestamp;

          return (
            <div
              key={frame.timestamp}
              onClick={() => toggleFrame(frame)}
              style={{
                position: 'relative',
                aspectRatio: '9/16',
                borderRadius: '8px',
                overflow: 'hidden',
                cursor: disabled ? 'default' : 'pointer',
                border: isCover
                  ? '2px solid #D4AF37'
                  : isSelected
                    ? '2px solid rgba(212,175,55,0.5)'
                    : '2px solid transparent',
                opacity: disabled ? 0.5 : 1,
              }}
            >
              <img
                src={frame.url}
                alt={`帧 ${frame.timestamp}s`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />

              {/* 时间戳 */}
              <div style={{
                position: 'absolute',
                bottom: '4px',
                left: '4px',
                background: 'rgba(0,0,0,0.7)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
              }}>
                {frame.timestamp.toFixed(1)}s
              </div>

              {/* 封面标记 */}
              {isCover && (
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  left: '4px',
                  background: '#D4AF37',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 600,
                }}>
                  封面
                </div>
              )}

              {/* 选中标记 */}
              {isSelected && !isCover && (
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: 'rgba(212,175,55,0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{ color: 'white', fontSize: '10px' }}>✓</span>
                </div>
              )}

              {/* 设为封面按钮 */}
              {isSelected && !isCover && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAsCover(frame);
                  }}
                  style={{
                    position: 'absolute',
                    bottom: '4px',
                    right: '4px',
                    background: 'rgba(0,0,0,0.7)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    cursor: 'pointer',
                  }}
                >
                  设为封面
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 提示 */}
      {selectedFrames.length > 0 && (
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          borderRadius: '8px',
          background: 'rgba(212,175,55,0.08)',
          border: '1px solid rgba(212,175,55,0.15)',
        }}>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
            💡 封面帧将嵌入视频首帧，其他选中帧将替换原视频对应时间点
          </p>
        </div>
      )}
    </div>
  );
}
