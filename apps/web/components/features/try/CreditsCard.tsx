'use client';

interface CreditsCardProps {
  /** 剩余额度 */
  remainingCredits: number;
  /** 本次消耗 */
  consumedCredits: number;
}

/**
 * 额度卡片组件
 * 显示剩余额度和本次消耗
 */
export function CreditsCard({ remainingCredits, consumedCredits }: CreditsCardProps) {
  return (
    <div
      style={{
        padding: '16px 20px',
        borderRadius: '16px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* 剩余额度 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(212, 175, 55, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#D4AF37" strokeWidth="2" />
            <path d="M12 6v12M8 10h8M8 14h8" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '2px' }}>
            剩余额度
          </p>
          <p style={{ fontSize: '20px', fontWeight: 600, color: '#D4AF37' }}>
            {remainingCredits}
            <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.4)', marginLeft: '2px' }}>次</span>
          </p>
        </div>
      </div>

      {/* 分隔线 */}
      <div
        style={{
          width: '1px',
          height: '40px',
          background: 'rgba(255, 255, 255, 0.08)',
        }}
      />

      {/* 本次消耗 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div>
          <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '2px', textAlign: 'right' }}>
            本次消耗
          </p>
          <p style={{ fontSize: '20px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.85)', textAlign: 'right' }}>
            <span style={{ color: '#FF6B6B' }}>-{consumedCredits}</span>
            <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.4)', marginLeft: '2px' }}>次</span>
          </p>
        </div>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(255, 107, 107, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
