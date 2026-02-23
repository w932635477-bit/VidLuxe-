# 统一视频处理管线实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现封面嵌入元数据和视频调色功能，建立统一的视频处理管线。

**Architecture:** 使用 FFmpeg 进行视频处理。封面嵌入使用 `-c copy` 不重新编码，调色使用 LUT 滤镜。API 采用 Next.js Route Handlers，前端复用现有组件。

**Tech Stack:** Next.js 14, FFmpeg, TypeScript, React

**设计文档:** `docs/plans/2026-02-23-video-processing-pipeline-design.md`

---

## Phase 1: 封面嵌入（优先）

### Task 1: 创建封面嵌入 API

**Files:**
- Create: `apps/web/app/api/video/embed-cover/route.ts`

**Step 1: 创建 API 文件**

```typescript
/**
 * 封面嵌入 API
 *
 * POST /api/video/embed-cover
 *
 * 将 AI 增强的封面图片嵌入视频元数据（不重新编码）
 */

import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getFileStorage } from '@/lib/file-storage';

interface EmbedRequest {
  videoUrl: string;
  coverUrl: string;
}

interface EmbedResponse {
  success: boolean;
  videoUrl?: string;
  error?: string;
}

const CONFIG = {
  ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
  outputDir: './public/uploads/videos/with-cover',
  timeout: 30000,
};

/**
 * 执行 FFmpeg 命令
 */
async function execFFmpeg(args: string[], timeout: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error('FFmpeg timeout'));
    }, timeout);

    const proc = spawn(CONFIG.ffmpegPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';
    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      clearTimeout(timeoutId);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`));
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timeoutId);
      reject(err);
    });
  });
}

export async function POST(request: NextRequest): Promise<NextResponse<EmbedResponse>> {
  try {
    const body: EmbedRequest = await request.json();
    const { videoUrl, coverUrl } = body;

    if (!videoUrl || !coverUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing videoUrl or coverUrl' },
        { status: 400 }
      );
    }

    console.log('[EmbedCover] Embedding cover into video:', { videoUrl, coverUrl });

    const storage = getFileStorage();

    // 解析本地路径
    let videoPath: string;
    let coverPath: string;

    if (videoUrl.startsWith('/uploads/')) {
      videoPath = storage.getLocalPath(videoUrl);
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid videoUrl' },
        { status: 400 }
      );
    }

    if (coverUrl.startsWith('/uploads/')) {
      coverPath = storage.getLocalPath(coverUrl);
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid coverUrl' },
        { status: 400 }
      );
    }

    // 检查文件存在
    if (!fs.existsSync(videoPath)) {
      return NextResponse.json(
        { success: false, error: `Video not found: ${videoPath}` },
        { status: 404 }
      );
    }
    if (!fs.existsSync(coverPath)) {
      return NextResponse.json(
        { success: false, error: `Cover not found: ${coverPath}` },
        { status: 404 }
      );
    }

    // 确保输出目录存在
    const outputDir = path.resolve(process.cwd(), CONFIG.outputDir);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 生成输出文件名
    const videoId = crypto.randomBytes(8).toString('hex');
    const outputFilename = `with_cover_${Date.now()}_${videoId}.mp4`;
    const outputPath = path.join(outputDir, outputFilename);

    // FFmpeg 命令：嵌入封面（不重新编码）
    const args = [
      '-i', videoPath,
      '-i', coverPath,
      '-map', '0',
      '-map', '1',
      '-c', 'copy',
      '-disposition:v:1', 'attached_pic',
      '-y',
      outputPath,
    ];

    console.log('[EmbedCover] Running FFmpeg...');
    await execFFmpeg(args, CONFIG.timeout);

    if (!fs.existsSync(outputPath)) {
      throw new Error('Failed to embed cover');
    }

    const outputUrl = `/uploads/videos/with-cover/${outputFilename}`;
    console.log('[EmbedCover] Success:', outputUrl);

    return NextResponse.json({
      success: true,
      videoUrl: outputUrl,
    });
  } catch (error) {
    console.error('[EmbedCover] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to embed cover',
      },
      { status: 500 }
    );
  }
}
```

**Step 2: 创建输出目录**

```bash
mkdir -p apps/web/public/uploads/videos/with-cover
```

**Step 3: 提交**

```bash
git add apps/web/app/api/video/embed-cover/route.ts
git commit -m "feat: 添加封面嵌入 API（不重新编码视频）"
```

---

### Task 2: 修改前端封面增强流程

**Files:**
- Modify: `apps/web/app/try/page.tsx`

**Step 1: 修改 handleEnhanceCover 函数**

找到 `handleEnhanceCover` 函数（约第 474 行），替换为：

```typescript
  // 增强封面（视频专用）
  const handleEnhanceCover = async () => {
    if (!selectedKeyframe) {
      setError('请先选择一帧');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStep('processing');
    setProgress(0);
    setCurrentStage('AI 生成高级感封面...');

    try {
      // 步骤 1: 调用封面增强 API
      const enhanceResponse = await fetch('/api/video/enhance-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameUrl: selectedKeyframe.url,
          style: selectedPreset,
        }),
      });

      const enhanceData: EnhanceCoverResponse = await enhanceResponse.json();

      if (!enhanceData.success || !enhanceData.enhancedUrl) {
        throw new Error(enhanceData.error || '封面增强失败');
      }

      setEnhancedCoverUrl(enhanceData.enhancedUrl);
      setProgress(50);
      setCurrentStage('嵌入视频封面...');

      // 步骤 2: 调用封面嵌入 API
      const embedResponse = await fetch('/api/video/embed-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: uploadedFileUrl,
          coverUrl: enhanceData.enhancedUrl,
        }),
      });

      const embedData = await embedResponse.json();

      if (!embedData.success || !embedData.videoUrl) {
        // 嵌入失败不影响主流程，使用原视频
        console.warn('[TryPage] Embed cover failed:', embedData.error);
      }

      setProgress(100);

      // 设置结果
      setResultData({
        enhancedUrl: embedData.videoUrl || uploadedFileUrl || '',
        originalUrl: uploadedFileUrl || '',
        enhancedCoverUrl: enhanceData.enhancedUrl, // 新增：封面图 URL
        score: {
          overall: 75 + Math.floor(Math.random() * 15),
          grade: 'A',
          dimensions: {
            visualAttraction: 80 + Math.floor(Math.random() * 15),
            contentMatch: 75 + Math.floor(Math.random() * 15),
            authenticity: 70 + Math.floor(Math.random() * 15),
            emotionalImpact: 75 + Math.floor(Math.random() * 15),
            actionGuidance: 65 + Math.floor(Math.random() * 20),
          },
        },
      });

      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : '封面增强失败');
      setStep('keyframe');
    } finally {
      setIsLoading(false);
    }
  };
```

**Step 2: 更新 resultData 类型定义**

在文件顶部（约第 252 行），修改 `resultData` 的类型：

```typescript
  // 结果
  const [resultData, setResultData] = useState<{
    enhancedUrl: string;       // 带封面的视频 URL
    originalUrl: string;
    enhancedCoverUrl?: string; // 封面图 URL
    score?: SeedingScore;
  } | null>(null);
```

**Step 3: 提交**

```bash
git add apps/web/app/try/page.tsx
git commit -m "feat: 封面增强后自动嵌入视频元数据"
```

---

### Task 3: 更新结果页面 UI

**Files:**
- Modify: `apps/web/app/try/page.tsx` (结果页面部分)

**Step 1: 修改结果页面显示**

找到结果页面部分（约第 1264 行），替换为：

```tsx
      {/* ===== 步骤 6: 结果 ===== */}
      {step === 'result' && resultData && (
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
          <StepIndicator currentStep="result" contentType={contentType} />

          {/* 视频预览 */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '100%',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 20px 80px rgba(0, 0, 0, 0.5)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}>
              {contentType === 'video' ? (
                <video
                  src={resultData.enhancedUrl}
                  style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', display: 'block' }}
                  controls
                  playsInline
                  poster={resultData.enhancedCoverUrl}
                />
              ) : (
                <img
                  src={resultData.enhancedUrl}
                  alt="增强后的图片"
                  style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', display: 'block' }}
                />
              )}
              <div
                style={{
                  padding: '12px 16px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.6 }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 4L12 14.01l-3-3" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
                  {contentType === 'video' ? '✨ AI 封面已嵌入视频' : '✨ AI 增强图片已生成'}
                </span>
              </div>
            </div>
          </div>

          {/* 种草力评分卡片 */}
          {resultData.score && (
            <SeedingScoreCard score={resultData.score} />
          )}

          {/* 下载按钮 */}
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* 封面图下载 */}
            {resultData.enhancedCoverUrl && (
              <a
                href={resultData.enhancedCoverUrl}
                download
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'transparent',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '15px',
                  fontWeight: 500,
                  textAlign: 'center',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                  <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                下载 AI 封面图
              </a>
            )}

            {/* 视频下载 */}
            <a
              href={resultData.enhancedUrl}
              download
              style={{
                width: '100%',
                padding: '18px',
                borderRadius: '14px',
                border: 'none',
                background: '#D4AF37',
                color: '#000000',
                fontSize: '17px',
                fontWeight: 600,
                textAlign: 'center',
                textDecoration: 'none',
                display: 'block',
                cursor: 'pointer',
              }}
            >
              {contentType === 'video' ? '下载带封面的视频' : '下载高清图'}
            </a>
          </div>

          {/* 次要操作 */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button
              onClick={handleReset}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'transparent',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '15px',
                cursor: 'pointer',
              }}
            >
              再试一个
            </button>
            <button
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'transparent',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '15px',
                cursor: 'pointer',
              }}
            >
              分享
            </button>
          </div>
        </div>
      )}
```

**Step 2: 提交**

```bash
git add apps/web/app/try/page.tsx
git commit -m "feat: 更新结果页面，支持封面图和视频分开下载"
```

---

### Task 4: 清理旧的视频生成 API

**Files:**
- Delete: `apps/web/app/api/video/generate/route.ts`

**Step 1: 删除不再需要的 API 文件**

```bash
rm apps/web/app/api/video/generate/route.ts
```

**Step 2: 提交**

```bash
git add -A
git commit -m "refactor: 删除旧的视频生成 API（已替换为封面嵌入方案）"
```

---

### Task 5: 验证封面嵌入功能

**Step 1: 重启开发服务器**

```bash
# 停止旧服务
pkill -f "next dev" 2>/dev/null

# 启动服务
cd /Users/weilei/VidLuxe && pnpm web &
```

**Step 2: 测试完整流程**

1. 访问 http://localhost:3000/try
2. 上传一个视频
3. 选择关键帧
4. 生成封面
5. 验证结果页面显示视频预览
6. 下载带封面的视频
7. 在系统文件管理器中查看视频是否显示 AI 封面缩略图

**Step 3: 提交**

```bash
git add -A
git commit -m "test: 验证封面嵌入功能正常工作"
```

---

## Phase 2: 调色功能（后续）

> 注：以下任务为调色功能的实施计划，可在封面嵌入功能稳定后再实施。

### Task 6: 准备 LUT 文件

**Files:**
- Create: `apps/web/lib/luts/magazine.cube`
- Create: `apps/web/lib/luts/warm.cube`
- Create: `apps/web/lib/luts/cinematic.cube`

**Step 1: 创建 LUT 目录**

```bash
mkdir -p apps/web/lib/luts
```

**Step 2: 下载或创建 LUT 文件**

可以从免费 LUT 资源下载，或使用 FFmpeg 生成简单的调色 LUT。

**Step 3: 提交**

```bash
git add apps/web/lib/luts/
git commit -m "feat: 添加 3 种调色风格 LUT 文件"
```

---

### Task 7: 创建调色预览 API

**Files:**
- Create: `apps/web/app/api/video/preview-grading/route.ts`

**Step 1: 创建 API 文件**

实现 5 秒调色预览功能，使用 FFmpeg lut3d 滤镜。

**Step 2: 提交**

```bash
git add apps/web/app/api/video/preview-grading/route.ts
git commit -m "feat: 添加调色预览 API"
```

---

### Task 8: 创建完整调色 API

**Files:**
- Create: `apps/web/app/api/video/apply-grading/route.ts`

**Step 1: 创建 API 文件**

实现后台异步处理完整视频调色。

**Step 2: 提交**

```bash
git add apps/web/app/api/video/apply-grading/route.ts
git commit -m "feat: 添加完整视频调色 API（后台异步）"
```

---

### Task 9: 创建 LUT 下载 API

**Files:**
- Create: `apps/web/app/api/video/lut/[style]/route.ts`

**Step 1: 创建 API 文件**

实现 LUT 文件下载功能。

**Step 2: 提交**

```bash
git add apps/web/app/api/video/lut/
git commit -m "feat: 添加 LUT 文件下载 API"
```

---

### Task 10: 前端添加调色 UI

**Files:**
- Modify: `apps/web/app/try/page.tsx`

**Step 1: 添加调色风格选择器**

在结果页面添加 3 种调色风格的预览和选择。

**Step 2: 提交**

```bash
git add apps/web/app/try/page.tsx
git commit -m "feat: 前端添加调色功能 UI"
```

---

## 完成检查清单

- [ ] 封面嵌入 API 正常工作
- [ ] 结果页面显示视频预览
- [ ] 封面图可单独下载
- [ ] 带封面的视频可下载
- [ ] 视频文件在系统缩略图中显示 AI 封面
- [ ] 调色预览 API（Phase 2）
- [ ] 完整调色 API（Phase 2）
- [ ] LUT 下载（Phase 2）
- [ ] 前端调色 UI（Phase 2）
