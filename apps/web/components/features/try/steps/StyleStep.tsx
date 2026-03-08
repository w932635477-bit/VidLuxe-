/**
 * StyleStep - 风格选择步骤组件
 *
 * 选择升级风格（预设或参考图）
 */

'use client';

import { useCallback, useEffect } from 'react';
import { useTryStore, type MultiStyleType, type EffectSourceType } from '@/lib/stores/try-store';
import { useCreditsStore } from '@/lib/stores/credits-store';
import {
  EffectSourceSelector,
  StyleMultiSelector,
  StepIndicator,
} from '@/components/features/try';
import { getRecommendedStyles } from '@/lib/category-modifiers';
import { getEffectById } from '@/lib/effect-presets';
import type { ContentType } from '@/lib/content-types';
import type { StyleType, CategoryType } from '@/lib/stores/try-store';

// 品类中文名称映射
const CATEGORY_LABELS: Record<CategoryType, string> = {
  fashion: '穿搭',
  beauty: '美妆',
  food: '美食',
  cafe: '探店',
  home: '家居',
  travel: '旅行',
  tech: '数码',
  fitness: '健身',
};

// 品类类型到内容类型的映射
const CATEGORY_TO_CONTENT_TYPE: Record<CategoryType, ContentType> = {
  fashion: 'outfit',
  beauty: 'beauty',
  food: 'food',
  cafe: 'cafe',
  home: 'outfit', // home 暂时映射到 outfit
  travel: 'travel',
  tech: 'outfit', // tech 暂时映射到 outfit
  fitness: 'outfit', // fitness 暂时映射到 outfit
};

interface StyleStepProps {
  onStartProcessing: () => void;
  onBack: () => void;
}

export function StyleStep({ onStartProcessing, onBack }: StyleStepProps) {
  const {
    previewUrl,
    contentType,
    uploadMode,
    batchFiles,
    selectedStyles,
    effectSourceType,
    selectedEffectId,
    effectIntensity,
    referenceFile,
    referenceFileUrl,
    showConfirmModal,
    showCreditModal,
    creditRequired,
    isLoading,
    selectedCategory,
    setStep,
    setSelectedStyles,
    setEffectSourceType,
    setSelectedEffectId,
    setEffectIntensity,
    setReferenceFile,
    setReferenceFileUrl,
    removeBatchFile,
    setShowConfirmModal,
    setShowCreditModal,
    setCreditRequired,
  } = useTryStore();

  const { total: creditsTotal } = useCreditsStore();

  // 获取基于品类的推荐风格
  const recommendedStyles = selectedCategory ? getRecommendedStyles(selectedCategory) : [];
  const categoryLabel = selectedCategory ? CATEGORY_LABELS[selectedCategory] : undefined;

  // 获取效果选择器使用的内容类型（将品类映射到内容类型）
  const effectContentType: ContentType = selectedCategory
    ? CATEGORY_TO_CONTENT_TYPE[selectedCategory]
    : 'outfit';

  // 获取风格描述
  const getStyleDescription = () => {
    if (effectSourceType === 'reference' && referenceFile) {
      return '自定义风格（AI 学习）';
    }
    // 从效果预设中获取名称
    const effect = getEffectById(selectedEffectId);
    return effect?.name || '效果库选择';
  };

  // 计算消耗
  const getCostInfo = () => {
    if (uploadMode === 'batch' && batchFiles.length > 0) {
      const successFiles = batchFiles.filter((f) => f.status === 'success' && f.uploadedUrl);
      const imageCount = successFiles.length;
      const styleCount = selectedStyles.length > 0 ? selectedStyles.length : 1;
      return {
        type: 'batch' as const,
        imageCount,
        styleCount,
        total: imageCount * styleCount,
      };
    }
    return {
      type: 'single' as const,
      total: selectedStyles.length > 0 ? selectedStyles.length : 1,
    };
  };

  const costInfo = getCostInfo();

  // 开始处理
  const handleStartClick = useCallback(() => {
    // 额度不足时直接跳转到收费页面
    if (creditsTotal < 1) {
      window.location.href = '/pricing';
      return;
    }

    if (costInfo.total > creditsTotal) {
      setCreditRequired(costInfo.total);
      setShowCreditModal(true);
      return;
    }

    if (uploadMode === 'batch' && costInfo.type === 'batch') {
      setShowConfirmModal(true);
    } else {
      onStartProcessing();
    }
  }, [
    costInfo,
    creditsTotal,
    uploadMode,
    setCreditRequired,
    setShowCreditModal,
    setShowConfirmModal,
    onStartProcessing,
  ]);

  if (!previewUrl && batchFiles.length === 0) return null;

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
      <StepIndicator currentStep="style" contentType={contentType} />

      {/* 单图预览 */}
      {uploadMode === 'single' && previewUrl && (
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
                muted
                autoPlay
                loop
                playsInline
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
      )}

      {/* 风格选择器 */}
      <div style={{ flex: 1 }}>
        {uploadMode === 'batch' ? (
          <StyleMultiSelector
            selectedStyles={selectedStyles}
            onChange={setSelectedStyles}
            disabled={isLoading}
            recommendedStyles={recommendedStyles}
            categoryLabel={categoryLabel}
          />
        ) : (
          <EffectSourceSelector
            sourceType={effectSourceType}
            onSourceTypeChange={setEffectSourceType}
            referenceFile={referenceFile}
            onReferenceFileChange={setReferenceFile}
            selectedEffectId={selectedEffectId}
            onEffectChange={setSelectedEffectId}
            effectIntensity={effectIntensity}
            onIntensityChange={setEffectIntensity}
            contentType={effectContentType}
          />
        )}
      </div>

      {/* 选择摘要 */}
      <div
        style={{
          padding: '12px 16px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          marginBottom: '12px',
        }}
      >
        {contentType === 'image' && selectedStyles.length > 0 ? (
          <>
            <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>
              批量生成
            </p>
            <p style={{ fontSize: '15px', fontWeight: 500, color: '#D4AF37' }}>
              {selectedStyles.length} 种风格，消耗 {selectedStyles.length} 个额度
            </p>
          </>
        ) : (
          <>
            <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>
              已选风格
            </p>
            <p style={{ fontSize: '15px', fontWeight: 500, color: '#D4AF37' }}>
              {getStyleDescription()}
            </p>
          </>
        )}
      </div>

      {/* 额度信息 */}
      <div
        style={{
          padding: '10px 16px',
          borderRadius: '8px',
          background: creditsTotal > 0 ? 'rgba(52, 199, 89, 0.08)' : 'rgba(255, 59, 48, 0.08)',
          border: `1px solid ${creditsTotal > 0 ? 'rgba(52, 199, 89, 0.15)' : 'rgba(255, 59, 48, 0.15)'}`,
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>当前额度</span>
        <span
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: creditsTotal > 0 ? '#34C759' : '#FF3B30',
          }}
        >
          {creditsTotal} 次
        </span>
      </div>

      {/* 操作按钮 */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={onBack}
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            background: 'transparent',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '15px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.5 : 1,
          }}
        >
          返回
        </button>
        <button
          onClick={handleStartClick}
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '14px 32px',
            borderRadius: '12px',
            border: 'none',
            background:
              isLoading
                ? 'rgba(255, 255, 255, 0.1)'
                : 'linear-gradient(135deg, #CA8A04, #EAB308)',
            color: isLoading ? 'rgba(255, 255, 255, 0.3)' : 'white',
            fontSize: '15px',
            fontWeight: 500,
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? '处理中...' : creditsTotal < 1 ? '获取额度' : '开始升级'}
        </button>
      </div>

      {/* 额度不足弹窗 */}
      {showCreditModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px',
          }}
          onClick={() => setShowCreditModal(false)}
        >
          <div
            style={{
              background: '#111',
              borderRadius: '24px',
              padding: '40px 32px',
              maxWidth: '420px',
              width: '100%',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(212, 175, 55, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}
            >
              <span style={{ fontSize: '32px' }}>💎</span>
            </div>

            <h3 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '12px' }}>额度不足</h3>

            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px', fontSize: '15px' }}>
              需要 <span style={{ color: '#D4AF37', fontWeight: 600 }}>{creditRequired}</span> 个额度
            </p>
            <p style={{ color: 'rgba(255, 255, 255, 0.5)', marginBottom: '32px', fontSize: '14px' }}>
              当前额度：<span style={{ color: '#FF3B30' }}>{creditsTotal}</span> 次
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <a
                href="/pricing"
                style={{
                  display: 'block',
                  padding: '16px 24px',
                  borderRadius: '12px',
                  background: '#D4AF37',
                  color: '#000',
                  fontSize: '16px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                购买额度
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('链接已复制！分享给好友可获得 5 次免费额度');
                }}
                style={{
                  padding: '14px 24px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '15px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                }}
              >
                邀请好友获得 5 次额度
              </button>
            </div>

            <button
              onClick={() => setShowCreditModal(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.4)',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              稍后再说
            </button>
          </div>
        </div>
      )}

      {/* 批量确认弹窗 */}
      {showConfirmModal && costInfo.type === 'batch' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px',
          }}
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            style={{
              background: '#111',
              borderRadius: '20px',
              padding: '32px',
              maxWidth: '360px',
              width: '100%',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', textAlign: 'center' }}>
              确认批量生成
            </h3>

            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)' }}>
                  图片数量
                </span>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{costInfo.imageCount} 张</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)' }}>
                  风格数量
                </span>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{costInfo.styleCount} 种</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)' }}>
                  总消耗
                </span>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#D4AF37' }}>
                  {costInfo.total} 额度
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'transparent',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '15px',
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={onStartProcessing}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#D4AF37',
                  color: '#000',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                确认开始
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
