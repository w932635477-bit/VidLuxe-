'use client';

export type StyleType = 'minimal' | 'warmLuxury' | 'coolPro' | 'morandi';

export const STYLE_OPTIONS = [
  {
    id: 'minimal' as StyleType,
    name: '极简',
    description: '克制、干净',
    icon: '○',
    accentColor: '#8E8E93',
  },
  {
    id: 'warmLuxury' as StyleType,
    name: '暖调奢华',
    description: '温暖、精致',
    icon: '✦',
    accentColor: '#D4AF37',
  },
  {
    id: 'coolPro' as StyleType,
    name: '冷调专业',
    description: '专业、冷静',
    icon: '◈',
    accentColor: '#5E6C84',
  },
  {
    id: 'morandi' as StyleType,
    name: '莫兰迪',
    description: '低饱和、灰调',
    icon: '◇',
    accentColor: '#9CAF88',
  },
];

interface StyleSelectorProps {
  selectedStyle: StyleType;
  onSelect: (style: StyleType) => void;
  className?: string;
}

export function StyleSelector({
  selectedStyle,
  onSelect,
  className = '',
}: StyleSelectorProps) {
  const selectedOption = STYLE_OPTIONS.find(s => s.id === selectedStyle);

  return (
    <div className={className}>
      {/* 标题行 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>
          风格
        </h3>
        <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.4)' }}>
          {selectedOption?.description}
        </span>
      </div>

      {/* Apple 风格：横向药丸选择器 */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>
        {STYLE_OPTIONS.map((style) => {
          const isSelected = selectedStyle === style.id;

          return (
            <button
              key={style.id}
              onClick={() => onSelect(style.id)}
              style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 20px',
                borderRadius: '12px',
                border: isSelected ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                background: isSelected ? style.accentColor : 'rgba(255, 255, 255, 0.03)',
                color: isSelected ? '#000000' : 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: '16px' }}>{style.icon}</span>
              <span style={{ fontSize: '15px', fontWeight: 500 }}>{style.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
