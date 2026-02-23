'use client';

import type { CategoryType } from '@/lib/types/seeding';
import { CATEGORIES } from '@/lib/config/seeding';

const APPLE_EASE = 'cubic-bezier(0.25, 0.1, 0.25, 1)';

interface CategorySelectorProps {
  selected: CategoryType | null;
  onChange: (category: CategoryType) => void;
  aiSuggested?: CategoryType | null;
}

export function CategorySelector({ selected, onChange, aiSuggested }: CategorySelectorProps) {
  return (
    <div>
      <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '12px' }}>
        品类
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {CATEGORIES.map((cat) => {
          const isSelected = selected === cat.id;
          const isAiSuggested = aiSuggested === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onChange(cat.id)}
              style={{
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: 500,
                borderRadius: '980px',
                border: isAiSuggested && !isSelected
                  ? '1px dashed rgba(212, 175, 55, 0.5)'
                  : '1px solid transparent',
                cursor: 'pointer',
                transition: `all 0.3s ${APPLE_EASE}`,
                background: isSelected
                  ? '#D4AF37'
                  : isAiSuggested
                  ? 'rgba(212, 175, 55, 0.1)'
                  : 'rgba(255, 255, 255, 0.05)',
                color: isSelected
                  ? '#000000'
                  : isAiSuggested
                  ? '#D4AF37'
                  : 'rgba(255, 255, 255, 0.7)',
              }}
            >
              <span style={{ marginRight: '6px' }}>{cat.icon}</span>
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
