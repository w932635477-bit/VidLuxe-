/**
 * ModeTabs 组件
 *
 * 用于单图、视频两种模式切换
 */

'use client';

export type FlowMode = 'single' | 'video';

interface ModeTabsProps {
  activeMode: FlowMode;
  onModeChange: (mode: FlowMode) => void;
}

const MODES: { id: FlowMode; label: string; icon: string }[] = [
  { id: 'single', label: '单图', icon: '🖼️' },
  { id: 'video', label: '视频', icon: '🎬' },
];

export function ModeTabs({ activeMode, onModeChange }: ModeTabsProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: '60px',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        gap: '12px',
        padding: '16px 24px',
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        zIndex: 1000,
      }}
    >
      {MODES.map((mode) => {
        const isActive = activeMode === mode.id;
        return (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              color: isActive ? '#D4AF37' : 'rgba(255, 255, 255, 0.7)',
              background: isActive ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
              border: `1px solid ${isActive ? '#D4AF37' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
              }
            }}
          >
            <span>{mode.icon}</span>
            <span>{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}
