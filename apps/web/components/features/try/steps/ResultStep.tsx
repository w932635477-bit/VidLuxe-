/**
 * ResultStep - 结果展示步骤组件
 *
 * 显示处理完成的结果，支持下载和分享
 */

'use client';

import { useState } from 'react';
import { useTryStore, type BatchResultItem } from '@/lib/stores/try-store';
import { useCreditsStore } from '@/lib/stores/credits-store';

interface ResultStepProps {
  onReset: () => void;
  onRetry: () => void;
}

export function ResultStep({ onReset, onRetry }: ResultStepProps) {
  const { resultData, batchResults, uploadMode, batchFiles } = useTryStore();
  const { total } = useCreditsStore();
  const [selectedResult, setSelectedResult] = useState<BatchResultItem | null>(
    batchResults.length > 0 ? batchResults[0] : null
  );

  // 单图结果
  if (uploadMode === 'single' && resultData) {
    return (
      <div
        style={{
          minHeight: '60vh',
          padding: '80px 24px 40px',
          maxWidth: '480px',
          margin: '0 auto',
        }}
      >
        <h2
          style={{
            fontSize: '28px',
            fontWeight: 600,
            marginBottom: '24px',
            textAlign: 'center',
          }}
        >
          ✨ 升级完成
        </h2>

        {/* 结果预览 */}
        <div
          style={{
            borderRadius: '16px',
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '24px',
          }}
        >
          <img
            src={resultData.enhancedUrl}
            alt="升级结果"
            style={{
              width: '100%',
              aspectRatio: '9/16',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </div>

        {/* 评分 */}
        {resultData.score && (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              background: 'rgba(212, 175, 55, 0.06)',
              border: '1px solid rgba(212, 175, 55, 0.12)',
              marginBottom: '24px',
            }}
          >
            <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px' }}>
              种草力评分
            </p>
            <p style={{ fontSize: '32px', fontWeight: 700, color: '#D4AF37' }}>
              {resultData.score.total}
              <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)', marginLeft: '4px' }}>
                / 100
              </span>
            </p>
          </div>
        )}

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <a
            href={resultData.enhancedUrl}
            download
            style={{
              flex: 1,
              display: 'block',
              textAlign: 'center',
              padding: '16px',
              borderRadius: '12px',
              background: '#D4AF37',
              color: '#000',
              fontSize: '15px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            下载图片
          </a>
          <button
            onClick={onReset}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'transparent',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '15px',
              cursor: 'pointer',
            }}
          >
            重新开始
          </button>
        </div>
      </div>
    );
  }

  // 批量结果
  if (uploadMode === 'batch' && batchResults.length > 0) {
    const successCount = batchResults.length;
    const totalCost = batchFiles.length;

    return (
      <div
        style={{
          minHeight: '60vh',
          padding: '80px 24px 40px',
          maxWidth: '480px',
          margin: '0 auto',
        }}
      >
        <h2
          style={{
            fontSize: '28px',
            fontWeight: 600,
            marginBottom: '8px',
            textAlign: 'center',
          }}
        >
          批量生成完成
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: '24px',
            textAlign: 'center',
          }}
        >
          成功生成 {successCount} 张图片
        </p>

        {/* 结果网格 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          {batchResults.map((result, index) => (
            <button
              key={index}
              onClick={() => setSelectedResult(result)}
              style={{
                borderRadius: '12px',
                overflow: 'hidden',
                border:
                  selectedResult === result
                    ? '2px solid #D4AF37'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              <img
                src={result.enhancedUrl}
                alt={`结果 ${index + 1}`}
                style={{
                  width: '100%',
                  aspectRatio: '9/16',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </button>
          ))}
        </div>

        {/* 选中结果操作 */}
        {selectedResult && (
          <a
            href={selectedResult.enhancedUrl}
            download
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '16px',
              borderRadius: '12px',
              background: '#D4AF37',
              color: '#000',
              fontSize: '15px',
              fontWeight: 600,
              textDecoration: 'none',
              marginBottom: '12px',
            }}
          >
            下载选中图片
          </a>
        )}

        <button
          onClick={onReset}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            background: 'transparent',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '15px',
            cursor: 'pointer',
          }}
        >
          重新开始
        </button>
      </div>
    );
  }

  // 空结果
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        textAlign: 'center',
      }}
    >
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px' }}>
        生成完成
      </h2>
      <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '24px' }}>
        所有任务已完成，但没有生成成功的结果
      </p>
      <button
        onClick={onRetry}
        style={{
          padding: '14px 32px',
          borderRadius: '12px',
          border: 'none',
          background: 'linear-gradient(135deg, #CA8A04, #EAB308)',
          color: 'white',
          fontSize: '15px',
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        重试
      </button>
    </div>
  );
}
