'use client';

import type { SeedingType } from '@/lib/types/seeding';
import { SEEDING_TYPES } from '@/lib/config/seeding';

const APPLE_EASE = 'cubic-bezier(0.25, 0.1, 0.25, 1)';

interface SeedingTypeSelectorProps {
  selected: SeedingType | null;
  onChange: (type: SeedingType) => void;
  aiSuggested?: SeedingType | null;
}

export function SeedingTypeSelector({ selected, onChange, aiSuggested }: SeedingTypeSelectorProps) {
  return (
    <div>
      <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '12px' }}>
        目的
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {SEEDING_TYPES.map((type) => {
          const isSelected = selected === type.id;
          const isAiSuggested = aiSuggested === type.id;

          return (
            <button
              key={type.id}
              onClick={() => onChange(type.id)}
              style={{
                padding: '16px 20px',
                borderRadius: '16px',
                border: isAiSuggested && !isSelected
                  ? '1px dashed rgba(212, 175, 55, 0.5)'
                  : isSelected
                  ? '1px solid #D4AF37'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                transition: `all 0.3s ${APPLE_EASE}`,
                background: isSelected
                  ? 'rgba(212, 175, 55, 0.15)'
                  : 'rgba(255, 255, 255, 0.03)',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: 500,
                    color: isSelected ? '#D4AF37' : 'rgba(255, 255, 255, 0.9)',
                    marginBottom: '4px',
                  }}>
                    {type.label}
                    {isAiSuggested && (
                      <span style={{
                        marginLeft: '8px',
                        fontSize: '11px',
                        color: '#D4AF37',
                        padding: '2px 8px',
                        background: 'rgba(212, 175, 55, 0.15)',
                        borderRadius: '4px',
                      }}>
                        AI 推荐
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>
                    {type.description}
                  </div>
                </div>
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: isSelected ? 'none' : '2px solid rgba(255, 255, 255, 0.2)',
                    background: isSelected ? '#D4AF37' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {isSelected && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12L10 17L19 8" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
