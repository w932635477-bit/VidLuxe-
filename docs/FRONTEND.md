# VidLuxe 前端技术规范

## 概述

VidLuxe 前端基于 Next.js 14 App Router 构建，采用 React Server Components 架构，结合现代 UI 组件库实现高性能、高可维护性的用户界面。

---

## 技术栈

```yaml
框架: Next.js 14 (App Router)
UI: Tailwind CSS + shadcn/ui
状态管理: Zustand
数据获取: TanStack Query + tRPC
表单: React Hook Form + Zod
动画: Framer Motion
视频: Remotion Player
图表: Recharts
```

---

## 目录结构

```
apps/web/
├── app/                      # App Router
│   ├── (marketing)/          # 营销页面组 (SSG)
│   │   ├── layout.tsx
│   │   ├── page.tsx          # 首页
│   │   ├── pricing/
│   │   │   └── page.tsx
│   │   └── about/
│   │       └── page.tsx
│   │
│   ├── (app)/                # 应用页面组 (需认证)
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── projects/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── upload/
│   │   │   └── page.tsx
│   │   ├── analyze/
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── enhance/
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   └── compare/
│   │       └── [id]/
│   │           └── page.tsx
│   │
│   ├── api/                  # API Routes
│   │   ├── trpc/
│   │   │   └── [trpc]/
│   │   │       └── route.ts
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   └── webhook/
│   │       └── route.ts
│   │
│   ├── layout.tsx            # 根布局
│   └── globals.css
│
├── components/
│   ├── ui/                   # shadcn/ui 组件
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   │
│   ├── features/             # 功能组件
│   │   ├── analyze/
│   │   │   ├── score-card.tsx
│   │   │   ├── dimension-chart.tsx
│   │   │   └── issue-list.tsx
│   │   ├── enhance/
│   │   │   ├── style-selector.tsx
│   │   │   ├── intensity-slider.tsx
│   │   │   └── before-after.tsx
│   │   └── upload/
│   │       ├── video-uploader.tsx
│   │       └── progress-indicator.tsx
│   │
│   └── shared/               # 共享组件
│       ├── header.tsx
│       ├── footer.tsx
│       ├── sidebar.tsx
│       └── loading.tsx
│
├── hooks/                    # 自定义 Hooks
│   ├── use-analyze.ts
│   ├── use-enhance.ts
│   └── use-upload.ts
│
├── lib/                      # 工具函数
│   ├── trpc.ts
│   ├── auth.ts
│   └── utils.ts
│
├── stores/                   # Zustand Stores
│   ├── project-store.ts
│   └── ui-store.ts
│
└── styles/
    └── globals.css
```

---

## 核心配置

### Next.js 配置

```typescript
// next.config.mjs
import nextMDX from '@next/mdx';

const withMDX = nextMDX({
  extension: /\.mdx?$/,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    mdxRs: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.vidluxe.com',
      },
    ],
  },
  transpilePackages: ['@vidluxe/core', '@vidluxe/types'],
};

export default withMDX(nextConfig);
```

### Tailwind 配置

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 品牌色
        brand: {
          50: '#faf5ff',
          100: '#f3e8ff',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          900: '#581c87',
        },
        // 评分等级色
        grade: {
          s: '#FFD700',  // 金色
          a: '#4CAF50',  // 绿色
          b: '#2196F3',  // 蓝色
          c: '#FF9800',  // 橙色
          d: '#F44336',  // 红色
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/forms'),
  ],
};

export default config;
```

---

## 页面实现

### 首页

```typescript
// app/(marketing)/page.tsx
import { Hero } from '@/components/features/landing/hero';
import { Features } from '@/components/features/landing/features';
import { Pricing } from '@/components/features/landing/pricing';
import { CTA } from '@/components/features/landing/cta';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <Pricing />
      <CTA />
    </main>
  );
}
```

### 仪表盘

```typescript
// app/(app)/dashboard/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { RecentProjects } from '@/components/features/dashboard/recent-projects';
import { UsageStats } from '@/components/features/dashboard/usage-stats';
import { QuickActions } from '@/components/features/dashboard/quick-actions';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <RecentProjects userId={session.user.id} />
        </div>
        <div className="space-y-8">
          <UsageStats userId={session.user.id} />
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
```

### 分析页面

```typescript
// app/(app)/analyze/[id]/page.tsx
import { notFound } from 'next/navigation';
import { api } from '@/lib/trpc';
import { ScoreCard } from '@/components/features/analyze/score-card';
import { DimensionChart } from '@/components/features/analyze/dimension-chart';
import { IssueList } from '@/components/features/analyze/issue-list';
import { VideoPlayer } from '@/components/features/analyze/video-player';

interface AnalyzePageProps {
  params: { id: string };
}

export default async function AnalyzePage({ params }: AnalyzePageProps) {
  const project = await api.project.get.query({ projectId: params.id });

  if (!project) {
    notFound();
  }

  const analysis = project.analyses[0];

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">
            Last analyzed {new Date(analysis.createdAt).toLocaleDateString()}
          </p>
        </div>
        <EnhanceButton projectId={project.id} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <VideoPlayer url={project.videoUrl} />
          <ScoreCard score={analysis.score} />
        </div>
        <div className="space-y-8">
          <DimensionChart dimensions={analysis.score.dimensions} />
          <IssueList
            issues={analysis.issues}
            suggestions={analysis.suggestions}
          />
        </div>
      </div>
    </div>
  );
}
```

---

## 核心组件

### 评分卡片

```typescript
// components/features/analyze/score-card.tsx
'use client';

import { motion } from 'framer-motion';
import type { PremiumScore, PremiumGrade } from '@vidluxe/types';

interface ScoreCardProps {
  score: PremiumScore;
}

const gradeColors: Record<PremiumGrade, string> = {
  S: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
  A: 'bg-gradient-to-r from-green-400 to-green-600',
  B: 'bg-gradient-to-r from-blue-400 to-blue-600',
  C: 'bg-gradient-to-r from-orange-400 to-orange-600',
  D: 'bg-gradient-to-r from-red-400 to-red-600',
};

const gradeLabels: Record<PremiumGrade, string> = {
  S: '顶级',
  A: '优秀',
  B: '良好',
  C: '普通',
  D: '需改进',
};

export function ScoreCard({ score }: ScoreCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-6 shadow-lg"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-6xl font-bold">{score.total}</div>
          <div className="text-muted-foreground mt-2">总分</div>
        </div>
        <div className={`px-6 py-3 rounded-full ${gradeColors[score.grade]}`}>
          <span className="text-3xl font-bold text-white">{score.grade}</span>
          <span className="text-white/80 ml-2">{gradeLabels[score.grade]}</span>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {Object.entries(score.dimensions).map(([key, dim]) => (
          <DimensionBar key={key} name={key} score={dim.score} />
        ))}
      </div>
    </motion.div>
  );
}

function DimensionBar({ name, score }: { name: string; score: number }) {
  return (
    <div className="flex items-center gap-4">
      <span className="w-24 text-sm capitalize">{name}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="h-full bg-primary"
        />
      </div>
      <span className="w-8 text-sm text-right">{score}</span>
    </div>
  );
}
```

### 维度雷达图

```typescript
// components/features/analyze/dimension-chart.tsx
'use client';

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import type { DimensionScore } from '@vidluxe/types';

interface DimensionChartProps {
  dimensions: Record<string, DimensionScore>;
}

const dimensionLabels: Record<string, string> = {
  color: '色彩',
  typography: '排版',
  composition: '构图',
  motion: '动效',
  audio: '音频',
  detail: '细节',
};

export function DimensionChart({ dimensions }: DimensionChartProps) {
  const data = Object.entries(dimensions).map(([key, dim]) => ({
    dimension: dimensionLabels[key] || key,
    score: dim.score,
    fullMark: 100,
  }));

  return (
    <div className="bg-card rounded-xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold mb-4">维度分析</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data}>
          <PolarGrid strokeDasharray="3 3" />
          <PolarAngleAxis dataKey="dimension" />
          <PolarRadiusAxis domain={[0, 100]} />
          <Radar
            name="Score"
            dataKey="score"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### 视频播放器

```typescript
// components/features/analyze/video-player.tsx
'use client';

import { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface VideoPlayerProps {
  url: string;
}

export function VideoPlayer({ url }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setProgress((video.currentTime / video.duration) * 100);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = (value[0] / 100) * duration;
  };

  return (
    <div className="relative bg-black rounded-xl overflow-hidden">
      <video
        ref={videoRef}
        src={url}
        className="w-full aspect-video"
        onClick={togglePlay}
      />

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <Slider
          value={[progress]}
          onValueChange={handleSeek}
          max={100}
          step={0.1}
          className="mb-2"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={togglePlay}>
              {isPlaying ? <Pause /> : <Play />}
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleMute}>
              {isMuted ? <VolumeX /> : <Volume2 />}
            </Button>
          </div>
          <span className="text-white text-sm">
            {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
```

### 增强前后对比

```typescript
// components/features/enhance/before-after.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BeforeAfterProps {
  beforeUrl: string;
  afterUrl: string;
  beforeScore: number;
  afterScore: number;
}

export function BeforeAfter({
  beforeUrl,
  afterUrl,
  beforeScore,
  afterScore,
}: BeforeAfterProps) {
  const [sliderPosition, setSliderPosition] = useState(50);

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden">
      {/* Before Image */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img src={beforeUrl} alt="Before" className="w-full h-full object-cover" />
        <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded-full">
          <span className="text-white text-sm">Before: {beforeScore}</span>
        </div>
      </div>

      {/* After Image */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
      >
        <img src={afterUrl} alt="After" className="w-full h-full object-cover" />
        <div className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded-full">
          <span className="text-white text-sm">After: {afterScore}</span>
        </div>
      </div>

      {/* Slider */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
          <ChevronLeft className="w-4 h-4 -mr-1" />
          <ChevronRight className="w-4 h-4 -ml-1" />
        </div>
      </div>
    </div>
  );

  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = e.target?.closest('.relative')?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      setSliderPosition(Math.max(0, Math.min(100, percentage)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }
}
```

---

## 数据获取

### tRPC 客户端配置

```typescript
// lib/trpc.ts
'use client';

import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@vidluxe/api';

export const api = createTRPCReact<AppRouter>();

// Provider
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';

export function getTRPCClient() {
  return api.createClient({
    links: [
      httpBatchLink({
        url: '/api/trpc',
        transformer: superjson,
      }),
    ],
  });
}
```

### 自定义 Hooks

```typescript
// hooks/use-analyze.ts
import { api } from '@/lib/trpc';

export function useAnalyze(projectId: string) {
  return api.analyze.getResult.useQuery(
    { analysisId: projectId },
    {
      refetchInterval: (data) => {
        // 如果还在处理中，每 2 秒刷新
        if (data?.status === 'processing') {
          return 2000;
        }
        return false;
      },
    }
  );
}

// hooks/use-enhance.ts
export function useEnhance() {
  const utils = api.useUtils();

  return api.enhance.submit.useMutation({
    onSuccess: (data) => {
      // 开始轮询状态
      pollStatus(data.enhanceId);
    },
  });

  async function pollStatus(enhanceId: string) {
    const poll = async () => {
      const status = await utils.enhance.getStatus.fetch({ enhanceId });

      if (status.status === 'processing') {
        setTimeout(poll, 2000);
      } else if (status.status === 'completed') {
        utils.enhance.getResult.invalidate({ enhanceId });
      }
    };

    poll();
  }
}
```

---

## 状态管理

### Zustand Store

```typescript
// stores/project-store.ts
import { create } from 'zustand';

interface ProjectState {
  currentProjectId: string | null;
  setCurrentProject: (id: string) => void;
  clearProject: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentProjectId: null,
  setCurrentProject: (id) => set({ currentProjectId: id }),
  clearProject: () => set({ currentProjectId: null }),
}));

// stores/ui-store.ts
interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  theme: 'light',
  setTheme: (theme) => set({ theme }),
}));
```

---

## 表单处理

### 上传表单

```typescript
// components/features/upload/video-uploader.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDropzone } from 'react-dropzone';
import { api } from '@/lib/trpc';

const uploadSchema = z.object({
  name: z.string().min(1, '请输入项目名称'),
  video: z.custom<File>((v) => v instanceof File, '请上传视频文件'),
});

type UploadForm = z.infer<typeof uploadSchema>;

export function VideoUploader() {
  const createProject = api.project.create.useMutation();

  const { register, handleSubmit, setValue, watch, formState } = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema),
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'video/*': ['.mp4', '.mov', '.webm'],
    },
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024, // 500MB
    onDrop: (files) => {
      if (files[0]) {
        setValue('video', files[0]);
      }
    },
  });

  const onSubmit = async (data: UploadForm) => {
    // 1. 上传视频到 S3
    const uploadUrl = await getUploadUrl(data.video);
    await uploadToS3(uploadUrl, data.video);

    // 2. 创建项目
    await createProject.mutateAsync({
      name: data.name,
      videoUrl: uploadUrl,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">项目名称</label>
        <input
          {...register('name')}
          className="w-full px-4 py-2 border rounded-lg"
          placeholder="我的视频"
        />
        {formState.errors.name && (
          <p className="text-sm text-destructive mt-1">
            {formState.errors.name.message}
          </p>
        )}
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted'
        }`}
      >
        <input {...getInputProps()} />
        {watch('video') ? (
          <p>{watch('video')?.name}</p>
        ) : (
          <p>拖拽视频文件到这里，或点击选择</p>
        )}
      </div>

      <button
        type="submit"
        disabled={createProject.isPending}
        className="w-full py-3 bg-primary text-primary-foreground rounded-lg"
      >
        {createProject.isPending ? '上传中...' : '开始分析'}
      </button>
    </form>
  );
}
```

---

## 性能优化

### 代码分割

```typescript
// 动态导入大型组件
import dynamic from 'next/dynamic';

const VideoEditor = dynamic(
  () => import('@/components/features/editor/video-editor'),
  {
    loading: () => <EditorSkeleton />,
    ssr: false,
  }
);
```

### 图片优化

```typescript
import Image from 'next/image';

// 使用 Next.js Image 组件
<Image
  src={thumbnailUrl}
  alt="Video thumbnail"
  width={320}
  height={180}
  loading="lazy"
  placeholder="blur"
  blurDataURL={thumbnailBlur}
/>
```

### 缓存策略

```typescript
// TanStack Query 配置
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 分钟
      cacheTime: 30 * 60 * 1000, // 30 分钟
      refetchOnWindowFocus: false,
    },
  },
});
```

---

## 下一步

- [测试策略](./TESTING.md)
- [部署方案](./DEPLOYMENT.md)
- [API 设计](./API.md)
