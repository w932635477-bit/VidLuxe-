# 视频模块简化实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 简化视频模块，移除视频合成功能，专注于图片增强输出，提供滑动卡片查看和一键下载功能。

**Architecture:**
1. 移除视频调色、帧替换合成、封面嵌入视频等复杂功能
2. 简化 VideoFlow 组件的处理逻辑
3. 新建滑动卡片结果组件，支持图片轮播和批量下载
4. 实现下载确认弹窗，显示额度扣除

**Tech Stack:** Next.js 15, React 18, Zustand, Tailwind CSS

---

## Task 1: 清理不需要的 API 路由

**Files:**
- Delete: `apps/web/app/api/video/color-grade/route.ts`
- Delete: `apps/web/app/api/video/replace-frames/route.ts`
- Delete: `apps/web/app/api/video/embed-cover/route.ts`

**Step 1: 删除视频调色 API**

```bash
rm apps/web/app/api/video/color-grade/route.ts
```

**Step 2: 删除帧替换 API**

```bash
rm apps/web/app/api/video/replace-frames/route.ts
```

**Step 3: 删除封面嵌入 API**

```bash
rm apps/web/app/api/video/embed-cover/route.ts
```

**Step 4: 验证项目编译**

```bash
cd /Users/weilei/VidLuxe/apps/web && pnpm tsc --noEmit
```

Expected: No errors (这些文件没有被其他地方引用)

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor(video): remove video synthesis APIs (color-grade, replace-frames, embed-cover)"
```

---

## Task 2: 简化 VideoFlow 组件

**Files:**
- Modify: `apps/web/components/features/try/flows/VideoFlow/index.tsx`

**Step 1: 移除视频合成相关导入和状态**

找到并删除以下内容：
- 移除 `color-grade` API 调用
- 移除 `replace-frames` API 调用
- 简化处理阶段数组

**Step 2: 简化 handleKeyframeConfirm 函数**

将原来的复杂处理逻辑简化为：

```tsx
// 关键帧确认后开始处理（仅增强图片）
const handleKeyframeConfirm = useCallback(async () => {
  if (!selectedKeyframe) {
    setError('请选择一个关键帧');
    return;
  }

  setStep('processing');
  setProgress(0);

  const effect = getEffectById(selectedEffectId);
  const effectName = effect?.name || '自定义风格';

  const allFrames = [selectedKeyframe, ...replaceFrames];
  const totalFrames = allFrames.length;

  const stages = [
    `✨ 正在应用 ${effectName}...`,
    '🖼️ 正在增强图片...',
    '✅ 完成！',
  ];

  try {
    const enhancedFrames: { originalUrl: string; enhancedUrl: string }[] = [];

    for (let i = 0; i < allFrames.length; i++) {
      const frame = allFrames[i];
      const progressPerFrame = 90 / totalFrames;

      setCurrentStage(`🖼️ 正在增强第 ${i + 1}/${totalFrames} 张图片...`);
      setProgress(Math.round(i * progressPerFrame));

      const enhanceResponse = await fetch('/api/video/enhance-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameUrl: frame.url,
          effectId: selectedEffectId,
          intensity: effectIntensity,
          contentType: selectedContentType,
        }),
      });

      const enhanceData = await enhanceResponse.json();
      if (!enhanceData.success) {
        throw new Error(enhanceData.error || `第 ${i + 1} 张图片增强失败`);
      }

      enhancedFrames.push({
        originalUrl: frame.url,
        enhancedUrl: enhanceData.enhancedUrl,
      });
    }

    setProgress(100);
    setCurrentStage('✅ 完成！');

    // 设置结果
    setResultData({
      enhancedUrl: enhancedFrames[0].enhancedUrl,
      originalUrl: uploadedFileUrl || '',
      enhancedFrames,
    });

    fetchCredits(anonymousId);
    await new Promise(resolve => setTimeout(resolve, 500));
    setStep('result');
  } catch (error) {
    console.error('处理失败:', error);
    setError(error instanceof Error ? error.message : '处理失败，请重试');
    setStep('keyframe');
  }
}, [selectedKeyframe, selectedEffectId, effectIntensity, selectedContentType, uploadedFileUrl, replaceFrames, anonymousId]);
```

**Step 3: 更新类型定义**

在 `apps/web/lib/types/flow.ts` 中更新 ResultData 类型：

```ts
export interface ResultData {
  enhancedUrl: string;
  originalUrl: string;
  enhancedCoverUrl?: string;
  enhancedVideoUrl?: string;
  enhancedFrames?: { originalUrl: string; enhancedUrl: string }[];  // 新增
}
```

**Step 4: 验证编译**

```bash
cd /Users/weilei/VidLuxe/apps/web && pnpm tsc --noEmit
```

Expected: No errors

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor(video): simplify VideoFlow to only enhance images"
```

---

## Task 3: 创建滑动卡片结果组件

**Files:**
- Create: `apps/web/components/features/try/flows/VideoFlow/EnhancedFramesResult.tsx`

**Step 1: 创建组件文件**

```tsx
/**
 * EnhancedFramesResult - 增强图片结果展示组件
 *
 * 滑动卡片展示 + 一键下载功能
 */

'use client';

import { useState, useCallback } from 'react';
import type { ResultData } from '@/lib/types/flow';

interface EnhancedFramesResultProps {
  resultData: ResultData;
  onReset: () => void;
  credits: number;
  anonymousId: string;
  onCreditsUpdate: () => void;
}

// 下载确认弹窗
function DownloadConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  frameCount,
  currentCredits,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  frameCount: number;
  currentCredits: number;
}) {
  if (!isOpen) return null;

  const enoughCredits = currentCredits >= frameCount;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: '#1a1a2e',
        borderRadius: '20px',
        padding: '32px',
        maxWidth: '400px',
        width: '90%',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px', color: '#fff' }}>
          确认下载
        </h3>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '24px', lineHeight: 1.6 }}>
          {enoughCredits ? (
            <>
              将下载 <span style={{ color: '#D4AF37', fontWeight: 600 }}>{frameCount}</span> 张增强图片，
              消耗 <span style={{ color: '#D4AF37', fontWeight: 600 }}>{frameCount}</span> 额度。
              <br />
              当前余额：<span style={{ color: '#34C759', fontWeight: 600 }}>{currentCredits}</span> 额度
            </>
          ) : (
            <>
              额度不足！需要 <span style={{ color: '#FF3B30', fontWeight: 600 }}>{frameCount}</span> 额度，
              当前只有 <span style={{ color: '#FF3B30', fontWeight: 600 }}>{currentCredits}</span> 额度
            </>
          )}
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'transparent',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            取消
          </button>
          {enoughCredits ? (
            <button
              onClick={onConfirm}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                background: '#D4AF37',
                color: '#000',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              确认下载
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                window.location.href = '/pricing';
              }}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                background: '#D4AF37',
                color: '#000',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              去充值
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EnhancedFramesResult({
  resultData,
  onReset,
  credits,
  anonymousId,
  onCreditsUpdate,
}: EnhancedFramesResultProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const frames = resultData.enhancedFrames || [];
  const currentFrame = frames[currentIndex];

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : frames.length - 1));
  }, [frames.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < frames.length - 1 ? prev + 1 : 0));
  }, [frames.length]);

  const handleDownloadAll = useCallback(async () => {
    if (credits < frames.length) {
      setShowDownloadModal(true);
      return;
    }
    setShowDownloadModal(true);
  }, [credits, frames.length]);

  const confirmDownload = useCallback(async () => {
    setIsDownloading(true);
    setShowDownloadModal(false);

    try {
      // 逐张下载图片
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        const response = await fetch(frame.enhancedUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `enhanced_frame_${i + 1}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // 短暂延迟避免浏览器阻止多次下载
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // 更新额度
      onCreditsUpdate();
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  }, [frames, onCreditsUpdate]);

  if (frames.length === 0 || !currentFrame) {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '80px 24px 40px',
      maxWidth: '480px',
      margin: '0 auto',
    }}>
      {/* 标题 */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 600, marginBottom: '8px' }}>
          增强完成
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          共 {frames.length} 张图片
        </p>
      </div>

      {/* 滑动卡片区域 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* 图片对比展示 */}
        <div style={{
          width: '100%',
          aspectRatio: '9/16',
          borderRadius: '24px',
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          position: 'relative',
          marginBottom: '24px',
        }}>
          <img
            src={currentFrame.enhancedUrl}
            alt={`增强图片 ${currentIndex + 1}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />

          {/* 图片序号 */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 16px',
            borderRadius: '20px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 500,
          }}>
            {currentIndex + 1} / {frames.length}
          </div>
        </div>

        {/* 左右切换按钮 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
          marginBottom: '32px',
        }}>
          <button
            onClick={handlePrev}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ←
          </button>
          <button
            onClick={handleNext}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            →
          </button>
        </div>

        {/* 缩略图导航 */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          padding: '8px 0',
          marginBottom: '24px',
          maxWidth: '100%',
        }}>
          {frames.map((frame, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              style={{
                width: '48px',
                height: '64px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: index === currentIndex ? '2px solid #D4AF37' : '2px solid transparent',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <img
                src={frame.enhancedUrl}
                alt={`缩略图 ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* 下载按钮区域 */}
      <div style={{ marginTop: 'auto' }}>
        {/* 额度显示 */}
        <div style={{
          padding: '12px 16px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' }}>
            下载需消耗
          </span>
          <span style={{ color: '#D4AF37', fontWeight: 600 }}>
            {frames.length} 额度（当前余额：{credits}）
          </span>
        </div>

        {/* 一键下载按钮 */}
        <button
          onClick={handleDownloadAll}
          disabled={isDownloading}
          style={{
            width: '100%',
            padding: '18px 40px',
            borderRadius: '14px',
            border: 'none',
            background: isDownloading ? 'rgba(255, 255, 255, 0.1)' : '#D4AF37',
            color: isDownloading ? 'rgba(255, 255, 255, 0.3)' : '#000',
            fontSize: '17px',
            fontWeight: 600,
            cursor: isDownloading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: '12px',
          }}
        >
          {isDownloading ? '下载中...' : `一键下载全部图片 (${frames.length} 张)`}
        </button>

        {/* 返回按钮 */}
        <button
          onClick={onReset}
          style={{
            width: '100%',
            padding: '14px 20px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            background: 'transparent',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          处理新视频
        </button>
      </div>

      {/* 下载确认弹窗 */}
      <DownloadConfirmModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onConfirm={confirmDownload}
        frameCount={frames.length}
        currentCredits={credits}
      />
    </div>
  );
}

export default EnhancedFramesResult;
```

**Step 2: 验证编译**

```bash
cd /Users/weilei/VidLuxe/apps/web && pnpm tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add -A
git commit -m "feat(video): add EnhancedFramesResult component with carousel and batch download"
```

---

## Task 4: 更新 VideoFlow 使用新结果组件

**Files:**
- Modify: `apps/web/components/features/try/flows/VideoFlow/index.tsx`

**Step 1: 导入新组件**

在文件顶部添加：

```tsx
import { EnhancedFramesResult } from './EnhancedFramesResult';
```

**Step 2: 修改结果展示部分**

找到结果步骤的渲染代码，替换为：

```tsx
{/* 结果步骤 */}
{step === 'result' && resultData?.enhancedFrames && resultData.enhancedFrames.length > 0 && (
  <EnhancedFramesResult
    resultData={resultData}
    onReset={handleReset}
    credits={total}
    anonymousId={anonymousId}
    onCreditsUpdate={() => fetchCredits(anonymousId)}
  />
)}

{/* 结果步骤 - 兼容旧的单图模式 */}
{step === 'result' && resultData && (!resultData.enhancedFrames || resultData.enhancedFrames.length === 0) && (
  <ResultSection
    resultData={resultData}
    contentType="video"
    onReset={handleReset}
  />
)}
```

**Step 3: 验证编译**

```bash
cd /Users/weilei/VidLuxe/apps/web && pnpm tsc --noEmit
```

Expected: No errors

**Step 4: Commit**

```bash
git add -A
git commit -m "feat(video): integrate EnhancedFramesResult into VideoFlow"
```

---

## Task 5: 更新测试清单

**Files:**
- Modify: `docs/TEST_CHECKLIST.md`

**Step 1: 更新视频模块测试项**

在测试清单的视频升级测试部分，更新相关测试项状态和说明。

**Step 2: Commit**

```bash
git add -A
git commit -m "docs: update TEST_CHECKLIST for simplified video module"
```

---

## Task 6: 端到端测试

**Step 1: 启动开发服务器**

```bash
cd /Users/weilei/VidLuxe && pnpm web
```

**Step 2: 手动测试流程**

1. 访问 http://localhost:3000/try
2. 切换到视频标签
3. 上传测试视频
4. 选择风格
5. 选择封面帧和替换帧
6. 点击"开始增强"
7. 验证：
   - 处理时间 < 70 秒
   - 显示滑动卡片结果
   - 缩略图导航正常工作
   - 下载按钮显示正确额度
   - 下载确认弹窗正常工作
   - 图片下载成功

**Step 3: 记录测试结果**

---

## 文件变更汇总

| 操作 | 文件路径 |
|------|----------|
| Delete | `apps/web/app/api/video/color-grade/route.ts` |
| Delete | `apps/web/app/api/video/replace-frames/route.ts` |
| Delete | `apps/web/app/api/video/embed-cover/route.ts` |
| Modify | `apps/web/components/features/try/flows/VideoFlow/index.tsx` |
| Modify | `apps/web/lib/types/flow.ts` |
| Create | `apps/web/components/features/try/flows/VideoFlow/EnhancedFramesResult.tsx` |
| Modify | `docs/TEST_CHECKLIST.md` |

## 预期效果

| 指标 | 优化前 | 优化后 |
|------|--------|--------|
| 处理时间 | 2-5 分钟 | < 70 秒 |
| 错误率 | 高 | 低 |
| 用户控制 | 有限 | 完全控制素材 |
| 代码复杂度 | 高 | 低 |
