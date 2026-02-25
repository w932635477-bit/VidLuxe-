'use client';

interface BatchConfirmModalProps {
  isOpen: boolean;
  imageCount: number;
  styleCount: number;
  totalCost: number;
  currentCredits: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BatchConfirmModal({
  isOpen,
  imageCount,
  styleCount,
  totalCost,
  currentCredits,
  onConfirm,
  onCancel,
}: BatchConfirmModalProps) {
  if (!isOpen) return null;

  const hasEnoughCredits = currentCredits >= totalCost;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#1a1a2e',
          borderRadius: '24px',
          padding: '32px',
          maxWidth: '400px',
          width: '90%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{
          fontSize: '24px',
          fontWeight: 600,
          marginBottom: '24px',
          textAlign: 'center',
        }}>
          确认生成
        </h3>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>图片数量</span>
            <span style={{ fontWeight: 500 }}>{imageCount} 张</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>风格数量</span>
            <span style={{ fontWeight: 500 }}>{styleCount} 种</span>
          </div>
          <div style={{
            height: '1px',
            background: 'rgba(255,255,255,0.1)',
            margin: '16px 0',
          }} />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>消耗额度</span>
            <span style={{
              fontWeight: 600,
              color: '#D4AF37',
              fontSize: '18px',
            }}>
              {totalCost} 个
            </span>
          </div>
        </div>

        {!hasEnoughCredits && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '24px',
          }}>
            <span style={{ color: '#EF4444', fontSize: '14px' }}>
              额度不足！当前额度：{currentCredits}，需要：{totalCost}
            </span>
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: '16px',
        }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent',
              color: 'white',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={!hasEnoughCredits}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '12px',
              border: 'none',
              background: hasEnoughCredits
                ? 'linear-gradient(135deg, #CA8A04, #EAB308)'
                : 'rgba(255,255,255,0.1)',
              color: hasEnoughCredits ? 'white' : 'rgba(255,255,255,0.3)',
              fontSize: '16px',
              fontWeight: 500,
              cursor: hasEnoughCredits ? 'pointer' : 'not-allowed',
            }}
          >
            确认生成
          </button>
        </div>
      </div>
    </div>
  );
}
