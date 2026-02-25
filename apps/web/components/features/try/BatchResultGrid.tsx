'use client';

import { useState } from 'react';
import type { BatchResultItem } from '@/lib/types/try-page';

interface BatchResultGridProps {
  results: BatchResultItem[];
  onDownloadAll?: () => void;
}

export function BatchResultGrid({ results, onDownloadAll }: BatchResultGridProps) {
  const [selectedResult, setSelectedResult] = useState<BatchResultItem | null>(null);

  if (results.length === 0) return null;

  return (
    <div>
      {/* 网格展示 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginBottom: '24px',
      }}>
        {results.map((result, index) => (
          <div
            key={index}
            onClick={() => setSelectedResult(result)}
            style={{
              position: 'relative',
              aspectRatio: '1',
              borderRadius: '12px',
              overflow: 'hidden',
              cursor: 'pointer',
              border: selectedResult === result
                ? '2px solid #D4AF37'
                : '2px solid transparent',
            }}
          >
            <img
              src={result.enhancedUrl}
              alt="结果"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            <div style={{
              position: 'absolute',
              bottom: '8px',
              left: '8px',
              background: 'rgba(0,0,0,0.7)',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
            }}>
              {result.style}
            </div>
          </div>
        ))}
      </div>

      {/* 操作按钮 */}
      <div style={{
        display: 'flex',
        gap: '16px',
        justifyContent: 'center',
      }}>
        <a
          href={selectedResult?.enhancedUrl || results[0]?.enhancedUrl}
          download
          style={{
            padding: '16px 32px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'transparent',
            color: 'white',
            fontSize: '16px',
            textDecoration: 'none',
            textAlign: 'center',
          }}
        >
          下载选中
        </a>
        <button
          onClick={onDownloadAll}
          style={{
            padding: '16px 32px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #CA8A04, #EAB308)',
            color: 'white',
            fontSize: '16px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          打包下载全部 ({results.length} 张)
        </button>
      </div>
    </div>
  );
}
