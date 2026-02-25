/**
 * RecognitionStep - AI 识别步骤组件
 *
 * 显示 AI 识别结果，允许用户确认或修改
 */

'use client';

import { useTryStore, type CategoryType, type SeedingType } from '@/lib/stores/try-store';
import { CategorySelector, SeedingTypeSelector, StepIndicator } from '@/components/features/try';

interface RecognitionStepProps {
  onConfirm: () => void;
  onBack: () => void;
}

export function RecognitionStep({ onConfirm, onBack }: RecognitionStepProps) {
  const {
    previewUrl,
    contentType,
    selectedCategory,
    selectedSeedingType,
    aiRecognition,
    setSelectedCategory,
    setSelectedSeedingType,
  } = useTryStore();

  if (!previewUrl) return null;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '80px 24px 40px',
        maxWidth: '480px',
        margin: '0 auto',
      }}
    >
      <StepIndicator currentStep="recognition" contentType={contentType} />

      {/* 预览图 */}
      <div style={{ marginBottom: '24px' }}>
        <div
          style={{
            position: 'relative',
            borderRadius: '16px',
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {contentType === 'video' ? (
            <video
              src={previewUrl}
              style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', display: 'block' }}
              muted autoPlay loop playsInline
            />
          ) : (
            <img
              src={previewUrl}
              alt="预览"
              style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', display: 'block' }}
            />
          )}
        </div>
      </div>

      {/* AI 识别提示 */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: '16px',
          background: 'rgba(212, 175, 55, 0.06)',
          border: '1px solid rgba(212, 175, 55, 0.12)',
          marginBottom: '24px',
        }}
      >
        <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
          💡 <span style={{ color: '#D4AF37' }}>AI 识别结果</span> - 请确认或修改
        </p>
      </div>

      {/* 品类选择 */}
      <div style={{ marginBottom: '24px' }}>
        <CategorySelector
          selected={selectedCategory}
          onChange={setSelectedCategory}
          aiSuggested={aiRecognition?.category}
        />
      </div>

      {/* 种草类型选择 */}
      <div style={{ flex: 1, marginBottom: '24px' }}>
        <SeedingTypeSelector
          selected={selectedSeedingType}
          onChange={setSelectedSeedingType}
          aiSuggested={aiRecognition?.seedingType}
        />
      </div>

      {/* 操作按钮 */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={onBack}
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
          返回
        </button>
        <button
          onClick={onConfirm}
          disabled={!selectedCategory || !selectedSeedingType}
          style={{
            flex: 1,
            padding: '16px',
            borderRadius: '12px',
            border: 'none',
            background: selectedCategory && selectedSeedingType ? '#D4AF37' : 'rgba(255, 255, 255, 0.1)',
            color: selectedCategory && selectedSeedingType ? '#000' : 'rgba(255, 255, 255, 0.3)',
            fontSize: '15px',
            fontWeight: 600,
            cursor: selectedCategory && selectedSeedingType ? 'pointer' : 'not-allowed',
          }}
        >
          确认，下一步
        </button>
      </div>
    </div>
  );
}
