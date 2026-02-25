'use client';

import type { BatchFileItem } from '@/lib/types/try-page';

interface BatchPreviewGridProps {
  items: BatchFileItem[];
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export function BatchPreviewGrid({ items, onRemove, disabled = false }: BatchPreviewGridProps) {
  if (items.length === 0) return null;

  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
      }}>
        <span style={{ fontSize: '15px', fontWeight: 500 }}>
          已选择 {items.length} 张图片
        </span>
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
          点击图片可移除
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
      }}>
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => !disabled && onRemove(item.id)}
            style={{
              position: 'relative',
              aspectRatio: '1',
              borderRadius: '12px',
              overflow: 'hidden',
              cursor: disabled ? 'default' : 'pointer',
              opacity: item.status === 'error' ? 0.5 : 1,
            }}
          >
            <img
              src={item.previewUrl}
              alt="预览"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />

            {/* 上传中遮罩 */}
            {item.status === 'uploading' && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#D4AF37',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
              </div>
            )}

            {/* 上传成功标记 */}
            {item.status === 'success' && (
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#4CAF50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{ color: 'white', fontSize: '12px' }}>✓</span>
              </div>
            )}

            {/* 上传失败标记 */}
            {item.status === 'error' && (
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{ color: 'white', fontSize: '12px' }}>✕</span>
              </div>
            )}

            {/* 删除按钮（hover显示） */}
            {!disabled && item.status !== 'uploading' && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.2s',
                cursor: 'pointer',
              }}
              className="batch-item-delete"
              >
                <span style={{ color: 'white', fontSize: '24px' }}>×</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        .batch-item-delete:hover { opacity: 1 !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
