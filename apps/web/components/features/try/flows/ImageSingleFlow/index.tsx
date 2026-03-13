/**
 * ImageSingleFlow - 单图流程
 *
 * upload → recognition → style → processing → result
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useImageSingleStore } from '@/lib/stores/flows';
import { useCreditsStore } from '@/lib/stores/credits-store';
import { ProcessingAnimation } from '@/components/features/try/flows/shared/ProcessingAnimation';
import { EffectFlowSelector } from '@/components/features/try/EffectFlowSelector';
import { MagazineTextOverlay } from '@/components/features/try/MagazineTextOverlay';
import { ResultSection } from '@/components/features/try/ResultSection';
import { uploadFile } from '@/lib/actions/upload';
import type { StyleType, StyleSourceType, ResultData } from '@/lib/types/flow';
import type { ContentType } from '@/lib/content-types';

// 生成匿名 ID
function generateAnonymousId(): string {
  if (typeof window === 'undefined') {
    return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }
  const stored = localStorage.getItem('vidluxe_anonymous_id');
  if (stored) return stored;
  const id = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  localStorage.setItem('vidluxe_anonymous_id', id);
  return id;
}

export function ImageSingleFlow() {
  const [anonymousId, setAnonymousId] = useState<string>('');

  const {
    step,
    uploadedFile,
    uploadedFileUrl,
    previewUrl,
    isLoading,
    progress,
    currentStage,
    error,
    selectedCategory,
    selectedPreset,
    styleSourceType,
    referenceFile,
    referenceFileUrl,
    resultData,
    // 效果系统状态
    selectedEffectId,
    effectIntensity,
    selectedContentType,
    quality,
    setStep,
    setUploadedFile,
    setUploadedFileUrl,
    setPreviewUrl,
    setIsLoading,
    setProgress,
    setCurrentStage,
    setError,
    setAiRecognition,
    setSelectedCategory,
    setSelectedSeedingType,
    setSelectedPreset,
    setStyleSourceType,
    setReferenceFile,
    setReferenceFileUrl,
    setResultData,
    // 效果系统操作
    setSelectedEffectId,
    setEffectIntensity,
    setSelectedContentType,
    setQuality,
    reset,
  } = useImageSingleStore();

  const { total, fetchCredits, hasUsedInviteCode } = useCreditsStore();

  // 邀请码输入状态
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [inviteApplied, setInviteApplied] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  // 我的邀请码状态（展示用）
  const [myInviteCode, setMyInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(c => c + 1);
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(c => {
      const next = c - 1;
      if (next <= 0) { setIsDragging(false); return 0; }
      return next;
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // 文件上传处理（抽出来复用）
  const processFileUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    setUploadedFile(file);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const data = await uploadFile(formData);
      if (data.success && data.file) {
        setUploadedFileUrl(data.file.url);
        setStep('recognition');
        setTimeout(() => {
          setAiRecognition({ category: 'fashion', seedingType: 'product' });
          setSelectedCategory('fashion');
          setSelectedSeedingType('product');
        }, 1000);
      }
    } catch (err) { console.error(err); }
  }, [setPreviewUrl, setUploadedFile, setUploadedFileUrl, setStep, setAiRecognition, setSelectedCategory, setSelectedSeedingType]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);
    const file = e.dataTransfer.files?.[0];
    if (file) processFileUpload(file);
  }, [processFileUpload]);

  // 是否显示邀请码输入框
  const showInviteInput = !hasUsedInviteCode && !inviteApplied;

  // 处理邀请码兑换
  const handleApplyInviteCode = useCallback(async () => {
    if (!inviteCodeInput || inviteCodeInput.length !== 6 || inviteLoading || !anonymousId) return;

    setInviteLoading(true);
    setInviteError(null);

    try {
      const response = await fetch(`/api/invite/${inviteCodeInput.toUpperCase()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anonymousId }),
      });

      const data = await response.json();

      if (data.success) {
        setInviteApplied(true);
        fetchCredits(anonymousId);
      } else {
        setInviteError(data.error || '邀请码兑换失败');
      }
    } catch (error) {
      console.error('Apply invite code error:', error);
      setInviteError('网络错误，请重试');
    } finally {
      setInviteLoading(false);
    }
  }, [inviteCodeInput, inviteLoading, anonymousId, fetchCredits]);

  // 初始化
  useEffect(() => {
    const id = generateAnonymousId();
    setAnonymousId(id);

    // 获取我的邀请码
    if (id) {
      fetch(`/api/invite?anonymousId=${encodeURIComponent(id)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data?.code) {
            setMyInviteCode(data.data.code);
          }
        })
        .catch(err => console.error('Failed to fetch invite code:', err));
    }
  }, []);

  // 复制邀请链接
  const handleCopyInviteLink = useCallback(() => {
    if (!myInviteCode) return;
    const inviteUrl = `${window.location.origin}/try?invite=${myInviteCode}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [myInviteCode]);

  useEffect(() => {
    if (anonymousId) {
      fetchCredits(anonymousId);
    }
  }, [anonymousId, fetchCredits]);

  // 处理单文件上传
  const handleFileChange = useCallback(async (file: File) => {
    const isVideo = file.type.startsWith('video/');
    if (isVideo) {
      setError('此页面仅支持图片上传，请使用视频上传页面');
      return;
    }

    // 创建预览
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    setUploadedFile(file);

    // 上传文件（使用 Server Action）
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const data = await uploadFile(formData);

      if (data.success && data.file) {
        setUploadedFileUrl(data.file.url);
        setStep('recognition');

        // 模拟 AI 识别
        setTimeout(() => {
          setSelectedCategory('fashion');
          setStep('style');
        }, 1000);
      } else {
        setError(data.error || '上传失败');
      }
    } catch {
      setError('网络错误');
    } finally {
      setIsLoading(false);
    }
  }, [setPreviewUrl, setUploadedFile, setIsLoading, setUploadedFileUrl, setStep, setSelectedCategory, setError]);

  // 开始处理
  const handleStartProcessing = useCallback(async () => {
    if (!uploadedFileUrl) {
      setError('请先上传图片');
      return;
    }

    if (total < 1) {
      setError('额度不足');
      return;
    }

    setStep('processing');
    setProgress(0);
    setCurrentStage('正在分析图片...');

    try {
      const response = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: { type: 'image', url: uploadedFileUrl },
          styleSource: {
            type: styleSourceType,
            presetStyle: styleSourceType === 'preset' ? selectedPreset : undefined,
            referenceUrl: styleSourceType === 'reference' ? referenceFileUrl : undefined,
          },
          contentType: selectedContentType,
          anonymousId,
          // 新效果系统参数
          effectId: selectedEffectId,
          effectIntensity: effectIntensity,
          quality: quality,
        }),
      });

      const data = await response.json();

      if (data.success && data.taskId) {
        // 轮询任务状态 (150次 × 2秒 = 300秒 = 5分钟，匹配后端超时)
        for (let i = 0; i < 150; i++) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const statusResponse = await fetch(`/api/enhance/${data.taskId}`);
          const statusData = await statusResponse.json();

          setProgress(statusData.progress || 0);
          setCurrentStage(statusData.currentStage || '处理中...');

          if (statusData.status === 'completed' && statusData.result) {
            setResultData({
              enhancedUrl: statusData.result.enhancedUrl,
              originalUrl: statusData.result.originalUrl,
              score: statusData.result.score,
            });
            // 等待额度刷新完成后再切换到结果页面，确保显示正确的剩余额度
            await fetchCredits(anonymousId);
            setStep('result');
            return;
          }

          if (statusData.status === 'failed') {
            setError(statusData.error || '处理失败');
            setStep('style');
            return;
          }
        }

        setError('处理超时');
        setStep('style');
      } else {
        setError(data.error || '创建任务失败');
        setStep('style');
      }
    } catch {
      setError('网络错误');
      setStep('style');
    }
  }, [uploadedFileUrl, total, styleSourceType, selectedPreset, referenceFileUrl, anonymousId, selectedEffectId, effectIntensity, selectedContentType, quality, setStep, setProgress, setCurrentStage, setResultData, setError, fetchCredits]);

  // 处理参考图上传（使用 Server Action）
  const handleReferenceUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const data = await uploadFile(formData);

      if (data.success && data.file) {
        setReferenceFile(file);
        setReferenceFileUrl(data.file.url);
      } else {
        setError(data.error || '上传参考图失败');
      }
    } catch {
      setError('网络错误');
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setReferenceFile, setReferenceFileUrl, setError]);

  // 重置
  const handleReset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    reset();
  }, [previewUrl, reset]);

  return (
    <>
      {/* 错误提示 */}
      {error && (
        <div style={{ position: 'fixed', top: '60px', left: '50%', transform: 'translateX(-50%)', padding: '12px 24px', borderRadius: '12px', background: 'rgba(255, 59, 48, 0.2)', border: '1px solid rgba(255, 59, 48, 0.3)', color: '#FF3B30', zIndex: 100 }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: '12px', background: 'none', border: 'none', color: '#FF3B30', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* 上传步骤 */}
      {step === 'upload' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1 style={{ fontSize: '48px', fontWeight: 600, letterSpacing: '-0.03em', marginBottom: '16px' }}>让普通素材变爆款</h1>
            <p style={{ fontSize: '21px', color: 'rgba(255, 255, 255, 0.5)', maxWidth: '400px' }}>光线差、背景乱？一键提升高级感</p>
          </div>

          <div
            onClick={() => !isLoading && document.getElementById('single-file-input')?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            style={{
              width: '100%', maxWidth: '480px', aspectRatio: '9/16', maxHeight: '500px',
              borderRadius: '24px',
              border: isDragging ? '2px dashed rgba(212, 175, 55, 0.8)' : '2px dashed rgba(255, 255, 255, 0.15)',
              background: isDragging ? 'rgba(212, 175, 55, 0.08)' : 'rgba(255, 255, 255, 0.02)',
              cursor: isLoading ? 'wait' : 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease',
              transform: isDragging ? 'scale(1.01)' : 'scale(1)',
            }}
          >
            <input id="single-file-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileChange(file); e.target.value = ''; }} disabled={isLoading} />
            {isLoading ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ color: 'rgba(255,255,255,0.6)' }}>上传中...</p>
              </div>
            ) : (
              <>
                <div style={{ width: '80px', height: '80px', marginBottom: '24px', borderRadius: '50%', background: isDragging ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style={{ opacity: isDragging ? 0.9 : 0.4 }}><path d="M12 16V4M12 4L8 8M12 4L16 8M4 16V18C4 19.1 4.9 20 6 20H18C19.1 20 20 19.1 20 18V16" stroke={isDragging ? '#D4AF37' : 'white'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <p style={{ fontSize: '21px', fontWeight: 500, marginBottom: '8px', color: isDragging ? '#D4AF37' : 'white' }}>
                  {isDragging ? '松开即可上传' : '拖入你的原片'}
                </p>
                <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '16px' }}>
                  {isDragging ? '支持 JPG / PNG' : '图片'}
                </p>
              </>
            )}
          </div>

          <div style={{ padding: '16px 20px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', maxWidth: '480px', width: '100%', marginTop: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div><p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>我的额度</p><p style={{ fontSize: '21px', fontWeight: 600 }}><span style={{ color: '#D4AF37' }}>{total}</span><span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)', marginLeft: '4px' }}>次</span></p></div>
            {myInviteCode && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '6px' }}>🎁 邀请码</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: '#34C759', letterSpacing: '0.05em' }}>{myInviteCode}</span>
                  <button onClick={handleCopyInviteLink} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(52, 199, 89, 0.3)', background: copied ? 'rgba(52, 199, 89, 0.2)' : 'rgba(52, 199, 89, 0.1)', color: copied ? '#34C759' : 'rgba(255, 255, 255, 0.8)', fontSize: '12px', cursor: 'pointer' }}>
                    {copied ? '已复制 ✓' : '复制'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI 识别步骤 */}
      {step === 'recognition' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ width: '80px', height: '80px', marginBottom: '32px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#D4AF37', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: '21px', fontWeight: 500, marginBottom: '8px' }}>AI 正在分析图片...</p>
          <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.5)' }}>识别品类和最佳风格</p>
        </div>
      )}

      {/* 风格选择步骤 */}
      {step === 'style' && previewUrl && (
        <div style={{ display: 'flex', flexDirection: 'column', padding: '24px', maxWidth: '480px', margin: '0 auto' }}>
          {/* 步骤指示器 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
            {['upload', 'style', 'processing', 'result'].map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s === 'style' || s === 'upload' ? '#D4AF37' : 'rgba(255, 255, 255, 0.2)' }} />
                {i < 3 && <div style={{ width: '24px', height: '2px', background: s === 'upload' ? '#D4AF37' : 'rgba(255, 255, 255, 0.1)' }} />}
              </div>
            ))}
          </div>

          {/* 图片预览 */}
          <div style={{ marginBottom: '24px', borderRadius: '16px', overflow: 'hidden', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <img src={previewUrl} alt="预览" style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', display: 'block' }} />
          </div>

          {/* 内容类型 + 风格选择 */}
          <EffectFlowSelector
            selectedEffectId={selectedEffectId}
            selectedContentType={selectedContentType}
            effectIntensity={effectIntensity}
            onEffectSelect={setSelectedEffectId}
            onContentTypeSelect={setSelectedContentType}
            onIntensityChange={setEffectIntensity}
          />

          {/* 邀请码输入框 - 在风格选择步骤显示 */}
          {showInviteInput && (
            <div style={{ marginTop: '20px', padding: '16px', borderRadius: '12px', background: 'rgba(52, 199, 89, 0.06)', border: '1px solid rgba(52, 199, 89, 0.12)' }}>
              <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '12px' }}>
                🎁 <span style={{ color: '#34C759' }}>输入邀请码，双方各得 5 个额度</span>
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                  placeholder="输入6位邀请码"
                  maxLength={6}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'white',
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                />
                <button
                  onClick={handleApplyInviteCode}
                  disabled={!inviteCodeInput || inviteCodeInput.length !== 6 || inviteLoading}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: inviteLoading ? 'rgba(255, 255, 255, 0.1)' : inviteCodeInput?.length === 6 ? '#34C759' : 'rgba(255, 255, 255, 0.1)',
                    color: inviteLoading ? 'rgba(255, 255, 255, 0.5)' : inviteCodeInput?.length === 6 ? '#000' : 'rgba(255, 255, 255, 0.3)',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: inviteLoading ? 'wait' : inviteCodeInput?.length === 6 ? 'pointer' : 'not-allowed',
                  }}
                >
                  {inviteLoading ? '兑换中...' : '兑换'}
                </button>
              </div>
              {inviteError && (
                <p style={{ fontSize: '12px', color: '#FF3B30', marginTop: '8px' }}>
                  {inviteError}
                </p>
              )}
            </div>
          )}

          {/* 邀请码应用成功提示 */}
          {inviteApplied && (
            <div style={{ marginTop: '20px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(52, 199, 89, 0.1)', border: '1px solid rgba(52, 199, 89, 0.2)', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#34C759' }}>
                ✅ 邀请码已使用，您已获得 5 个额度！
              </p>
            </div>
          )}

          {/* 画质选择（新增） */}
          <div style={{ marginTop: '24px', padding: '16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <p style={{ fontSize: '15px', fontWeight: 500, marginBottom: '12px', color: 'white' }}>选择生成画质</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setQuality('1K')}
                style={{
                  flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer',
                  border: quality === '1K' ? '1px solid #D4AF37' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: quality === '1K' ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                }}
              >
                <div style={{ fontSize: '15px', fontWeight: 500, color: quality === '1K' ? '#D4AF37' : 'white' }}>标清极速 (1K)</div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>约 10-15 秒</div>
              </button>
              <button
                onClick={() => setQuality('2K')}
                style={{
                  flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer',
                  border: quality === '2K' ? '1px solid #D4AF37' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: quality === '2K' ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                }}
              >
                <div style={{ fontSize: '15px', fontWeight: 500, color: quality === '2K' ? '#D4AF37' : 'white' }}>极致超清 (2K)</div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>约 1-4 分钟</div>
              </button>
            </div>
          </div>

          {/* 按钮 */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button onClick={() => setStep('upload')} style={{ flex: 1, padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'transparent', color: 'white', fontSize: '16px', fontWeight: 500, cursor: 'pointer' }}>返回</button>
            <button onClick={handleStartProcessing} style={{ flex: 2, padding: '16px', borderRadius: '12px', border: 'none', background: '#D4AF37', color: '#000', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}>开始升级</button>
          </div>
        </div>
      )}

      {/* 处理步骤 */}
      {step === 'processing' && (
        <ProcessingAnimation
          progress={progress}
          currentStage={currentStage}
          mode="image"
        />
      )}

      {/* 结果步骤 */}
      {step === 'result' && resultData && (
        <ResultSection
          resultData={resultData}
          contentType="image"
          onReset={handleReset}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

export default ImageSingleFlow;
