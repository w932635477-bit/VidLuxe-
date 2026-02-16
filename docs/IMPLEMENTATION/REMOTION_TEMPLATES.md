# Remotion 视频模板集成文档

> **版本**: 1.0
> **更新日期**: 2026-02-16
> **状态**: MVP 阶段

## 概述

本文档详细说明 VidLuxe 项目中 Remotion 视频模板的集成方案，包括模板设计、Lambda 部署和视频合成流程。

## 官方资源

| 资源 | 链接 |
|------|------|
| **官方仓库** | https://github.com/remotion-dev/remotion |
| **官方文档** | https://remotion.dev/docs/ |
| **Lambda 文档** | https://remotion.dev/docs/lambda |
| **模板示例** | https://github.com/remotion-dev/template-prompt-to-video |
| **Player 组件** | https://remotion.dev/docs/player |

---

## 1. Remotion 核心概念

### 1.1 什么是 Remotion？

Remotion 是一个基于 React 的程序化视频创建框架，允许开发者使用 React 组件来创建视频。

**来源**: [Remotion 官方文档 - Getting Started](https://remotion.dev/docs/)

```typescript
// 核心理念：视频 = 组件 + 时间轴
// 每一帧 = React 组件的快照
```

### 1.2 核心组件

```yaml
Composition:
  - 视频的基本单位
  - 定义 durationInFrames, fps, width, height

Sequence:
  - 时间轴管理
  - 控制组件出现的时间范围

useVideoConfig():
  - 获取视频配置
  - 返回 { fps, durationInFrames, width, height }

useCurrentFrame():
  - 获取当前帧号
  - 用于驱动动画

AbsoluteFill:
  - 定位容器
  - 相当于 position: absolute; inset: 0;

Spring / interpolate:
  - 动画函数
  - 实现流畅的过渡效果
```

**参考**: [Remotion - The basics](https://remotion.dev/docs/the-basics)

---

## 2. VidLuxe 视频模板设计

### 2.1 模板架构

```
packages/remotion-templates/
├── src/
│   ├── compositions/           # 视频合成
│   │   ├── PremiumTalkingVideo.tsx    # 口播视频模板
│   │   ├── ProductShowcase.tsx        # 产品展示模板
│   │   └── TextCardVideo.tsx          # 文字卡片模板
│   ├── components/             # 可复用组件
│   │   ├── PersonLayer.tsx            # 人物图层
│   │   ├── BackgroundLayer.tsx        # 背景图层
│   │   ├── TextOverlay.tsx            # 文字叠加
│   │   ├── PremiumEffects.tsx         # 高级感效果
│   │   └── AnimatedCard.tsx           # 动画卡片
│   ├── utils/
│   │   ├── animations.ts              # 动画函数
│   │   ├── colors.ts                  # 色彩处理
│   │   └── timing.ts                  # 时间控制
│   ├── config/
│   │   ├── presets.ts                 # 预设配置
│   │   └── profiles.ts                # 高级感配置
│   └── index.ts
├── package.json
└── tsconfig.json
```

### 2.2 核心类型定义

```typescript
// packages/remotion-templates/src/types.ts

import { z } from 'zod';

/**
 * 视频模板配置
 */
export const VideoTemplateConfigSchema = z.object({
  // 基础配置
  fps: z.number().default(30),
  durationInFrames: z.number().default(900), // 30秒 @ 30fps
  width: z.number().default(1080),
  height: z.number().default(1920),

  // 风格配置
  styleProfile: z.object({
    name: z.string(),
    colorPalette: z.array(z.string()),
    typography: z.enum(['minimal', 'bold', 'elegant']),
    motionStyle: z.enum(['smooth', 'dynamic', 'subtle']),
  }),

  // 内容配置
  content: z.object({
    personVideoUrl: z.string().optional(),
    backgroundUrl: z.string(),
    textOverlays: z.array(z.object({
      text: z.string(),
      position: z.enum(['top', 'center', 'bottom']),
      animation: z.enum(['fade', 'slide', 'scale']),
      delay: z.number().default(0),
    })),
  }),
});

export type VideoTemplateConfig = z.infer<typeof VideoTemplateConfigSchema>;

/**
 * 高级感效果配置
 */
export interface PremiumEffects {
  // 色彩效果
  colorGrade: {
    preset: 'cinematic' | 'bright' | 'vintage' | 'custom';
    intensity: number; // 0-1
    customLUT?: string;
  };

  // 光效
  lighting: {
    vignette: boolean;
    vignetteIntensity: number;
    glowEffect: boolean;
    glowRadius: number;
  };

  // 运动效果
  motion: {
    smoothCamera: boolean;
    parallaxLayers: boolean;
    depthOfField: boolean;
  };
}

/**
 * 视频合成输入
 */
export interface CompositionInput {
  // 人物视频（已抠像）
  personLayer?: {
    videoUrl: string;
    maskUrl?: string;
    position: { x: number; y: number };
    scale: number;
  };

  // 背景
  background: {
    type: 'image' | 'video' | 'gradient';
    source: string;
    blur?: number;
    overlay?: string; // 叠加层颜色
  };

  // 文字叠加
  textLayers: Array<{
    content: string;
    style: TextStyle;
    animation: AnimationConfig;
    timing: { startFrame: number; endFrame: number };
  }>;

  // 效果
  effects: PremiumEffects;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  shadow?: {
    color: string;
    blur: number;
    offset: { x: number; y: number };
  };
}

export interface AnimationConfig {
  type: 'fade' | 'slide' | 'scale' | 'typewriter';
  duration: number; // 帧数
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';
}
```

---

## 3. 核心组件实现

### 3.1 口播视频模板

**设计参考**: [Remotion - Compositions](https://remotion.dev/docs/composition)

```typescript
// packages/remotion-templates/src/compositions/PremiumTalkingVideo.tsx

import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useVideoConfig,
  useCurrentFrame,
  interpolate,
  spring,
  Video,
  Img,
} from 'remotion';
import { PersonLayer } from '../components/PersonLayer';
import { BackgroundLayer } from '../components/BackgroundLayer';
import { TextOverlay } from '../components/TextOverlay';
import { PremiumEffects } from '../components/PremiumEffects';
import type { CompositionInput, PremiumEffects as EffectsType } from '../types';

interface PremiumTalkingVideoProps {
  input: CompositionInput;
  effects: EffectsType;
}

/**
 * 高级感口播视频模板
 *
 * 架构：
 * ├── 背景层 (BackgroundLayer)
 * ├── 人物层 (PersonLayer) - 已抠像
 * ├── 文字层 (TextOverlay[])
 * └── 效果层 (PremiumEffects)
 */
export const PremiumTalkingVideo: React.FC<PremiumTalkingVideoProps> = ({
  input,
  effects,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* 背景层 */}
      <BackgroundLayer
        source={input.background}
        effects={effects}
      />

      {/* 人物层（可选） */}
      {input.personLayer && (
        <Sequence from={0} durationInFrames={Infinity}>
          <PersonLayer
            videoUrl={input.personLayer.videoUrl}
            position={input.personLayer.position}
            scale={input.personLayer.scale}
          />
        </Sequence>
      )}

      {/* 文字叠加层 */}
      {input.textLayers.map((textLayer, index) => (
        <Sequence
          key={index}
          from={textLayer.timing.startFrame}
          durationInFrames={
            textLayer.timing.endFrame - textLayer.timing.startFrame
          }
        >
          <TextOverlay
            content={textLayer.content}
            style={textLayer.style}
            animation={textLayer.animation}
          />
        </Sequence>
      ))}

      {/* 全局效果层 */}
      <PremiumEffects effects={effects} />
    </AbsoluteFill>
  );
};
```

### 3.2 背景层组件

```typescript
// packages/remotion-templates/src/components/BackgroundLayer.tsx

import React from 'react';
import {
  AbsoluteFill,
  Video,
  Img,
  useCurrentFrame,
  interpolate,
} from 'remotion';
import type { CompositionInput, PremiumEffects } from '../types';

interface BackgroundLayerProps {
  source: CompositionInput['background'];
  effects: PremiumEffects;
}

/**
 * 背景层组件
 *
 * 支持类型：
 * - image: 静态图片背景
 * - video: 动态视频背景
 * - gradient: 渐变背景
 */
export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({
  source,
  effects,
}) => {
  const frame = useCurrentFrame();

  // 视差效果
  const parallaxY = effects.motion.parallaxLayers
    ? interpolate(frame, [0, 900], [0, -20])
    : 0;

  // 模糊效果
  const blurStyle = source.blur
    ? { filter: `blur(${source.blur}px)` }
    : {};

  // 叠加层
  const overlayStyle = source.overlay
    ? {
        background: `linear-gradient(to bottom, ${source.overlay}00, ${source.overlay})`,
      }
    : {};

  const renderBackground = () => {
    switch (source.type) {
      case 'image':
        return (
          <Img
            src={source.source}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `translateY(${parallaxY}px)`,
              ...blurStyle,
            }}
          />
        );

      case 'video':
        return (
          <Video
            src={source.source}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `translateY(${parallaxY}px)`,
              ...blurStyle,
            }}
            muted
            loop
          />
        );

      case 'gradient':
        return (
          <AbsoluteFill
            style={{
              background: source.source,
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <AbsoluteFill>
      {renderBackground()}

      {/* 叠加层 */}
      {source.overlay && (
        <AbsoluteFill style={overlayStyle} />
      )}
    </AbsoluteFill>
  );
};
```

### 3.3 人物层组件

```typescript
// packages/remotion-templates/src/components/PersonLayer.tsx

import React from 'react';
import { AbsoluteFill, Video, useCurrentFrame, spring } from 'remotion';

interface PersonLayerProps {
  videoUrl: string;
  maskUrl?: string;
  position: { x: number; y: number };
  scale: number;
}

/**
 * 人物层组件
 *
 * 前置条件：视频已通过 MODNet 抠像处理
 *
 * 参考：
 * - Remotion Video: https://remotion.dev/docs/video
 * - Alpha Channel: https://remotion.dev/docs/video#alpha-videos
 */
export const PersonLayer: React.FC<PersonLayerProps> = ({
  videoUrl,
  maskUrl,
  position,
  scale,
}) => {
  const frame = useCurrentFrame();

  // 入场动画
  const entranceScale = spring({
    frame,
    fps: 30,
    config: {
      damping: 100,
      stiffness: 200,
    },
  });

  // 如果使用独立遮罩视频（WebM 格式需要）
  // 大多数现代格式（如 MOV ProRes 4444）支持内嵌 Alpha

  return (
    <AbsoluteFill>
      <Video
        src={videoUrl}
        style={{
          position: 'absolute',
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: `translate(-50%, -50%) scale(${scale * entranceScale})`,
          width: '80%',
        }}
        muted
      />
    </AbsoluteFill>
  );
};
```

### 3.4 文字叠加组件

```typescript
// packages/remotion-templates/src/components/TextOverlay.tsx

import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import type { TextStyle, AnimationConfig } from '../types';

interface TextOverlayProps {
  content: string;
  style: TextStyle;
  animation: AnimationConfig;
  position?: 'top' | 'center' | 'bottom';
}

/**
 * 文字叠加组件
 *
 * 支持：
 * - fade: 淡入淡出
 * - slide: 滑动
 * - scale: 缩放
 * - typewriter: 打字机效果
 *
 * 参考：https://remotion.dev/docs/interpolate
 */
export const TextOverlay: React.FC<TextOverlayProps> = ({
  content,
  style,
  animation,
  position = 'bottom',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 计算动画值
  const getAnimationStyle = () => {
    const progress = spring({
      frame,
      fps,
      config: {
        damping: animation.easing === 'spring' ? 15 : 100,
        stiffness: animation.easing === 'spring' ? 100 : 200,
      },
    });

    switch (animation.type) {
      case 'fade':
        return {
          opacity: interpolate(progress, [0, 1], [0, 1]),
        };

      case 'slide':
        return {
          opacity: progress,
          transform: `translateY(${interpolate(progress, [0, 1], [50, 0])}px)`,
        };

      case 'scale':
        return {
          opacity: progress,
          transform: `scale(${interpolate(progress, [0, 1], [0.8, 1])})`,
        };

      case 'typewriter':
        // 打字机效果：逐字显示
        const charsToShow = Math.floor(
          interpolate(frame, [0, animation.duration], [0, content.length])
        );
        return {
          clipPath: `inset(0 ${100 - (charsToShow / content.length) * 100}% 0 0)`,
        };

      default:
        return {};
    }
  };

  // 位置映射
  const positionStyles = {
    top: { top: '15%' },
    center: { top: '50%', transform: 'translateY(-50%)' },
    bottom: { bottom: '15%' },
  };

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: position === 'center' ? 'center' : 'flex-start',
        ...positionStyles[position],
      }}
    >
      <div
        style={{
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          color: style.color,
          textShadow: style.shadow
            ? `${style.shadow.offset.x}px ${style.shadow.offset.y}px ${style.shadow.blur}px ${style.shadow.color}`
            : 'none',
          ...getAnimationStyle(),
        }}
      >
        {content}
      </div>
    </AbsoluteFill>
  );
};
```

### 3.5 高级感效果组件

```typescript
// packages/remotion-templates/src/components/PremiumEffects.tsx

import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import type { PremiumEffects as EffectsType } from '../types';

interface PremiumEffectsProps {
  effects: EffectsType;
}

/**
 * 高级感效果层
 *
 * 包括：
 * - 暗角效果 (Vignette)
 * - 发光效果 (Glow)
 * - 色彩调整 (Color Grade)
 *
 * 参考：
 * - CSS Filter: https://developer.mozilla.org/en-US/docs/Web/CSS/filter
 * - SVG Filters: https://developer.mozilla.org/en-US/docs/Web/SVG/Element/filter
 */
export const PremiumEffects: React.FC<PremiumEffectsProps> = ({ effects }) => {
  const frame = useCurrentFrame();

  // 暗角效果
  const vignetteIntensity = effects.lighting.vignette
    ? effects.lighting.vignetteIntensity
    : 0;

  // 动态发光效果（可选）
  const glowPulse = effects.lighting.glowEffect
    ? interpolate(
        frame % 60, // 2秒周期
        [0, 30, 60],
        [0.8, 1.2, 0.8]
      )
    : 1;

  // 色彩预设
  const colorGradePresets = {
    cinematic: {
      filter: `contrast(1.1) saturate(0.9) sepia(0.1)`,
    },
    bright: {
      filter: `brightness(1.05) saturate(1.1)`,
    },
    vintage: {
      filter: `sepia(0.3) contrast(1.05) saturate(0.85)`,
    },
    custom: {
      filter: 'none',
    },
  };

  return (
    <>
      {/* 色彩调整 - 应用到整个视频 */}
      <AbsoluteFill
        style={{
          mixBlendMode: 'normal',
          pointerEvents: 'none',
          ...colorGradePresets[effects.colorGrade.preset],
          opacity: effects.colorGrade.intensity,
        }}
      />

      {/* 暗角效果 */}
      {effects.lighting.vignette && (
        <AbsoluteFill
          style={{
            pointerEvents: 'none',
            background: `radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,${vignetteIntensity}) 100%)`,
          }}
        />
      )}

      {/* 柔光效果 */}
      {effects.lighting.glowEffect && (
        <AbsoluteFill
          style={{
            pointerEvents: 'none',
            background: `radial-gradient(ellipse at 50% 30%, rgba(255,255,255,${0.1 * glowPulse}) 0%, transparent 50%)`,
          }}
        />
      )}
    </>
  );
};
```

---

## 4. Remotion Lambda 部署

### 4.1 Lambda 架构

**来源**: [Remotion Lambda 官方文档](https://remotion.dev/docs/lambda)

```yaml
架构:
  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
  │   Client    │────▶│  API Route  │────▶│   Lambda    │
  │  (Browser)  │     │  (Vercel)   │     │  (AWS)      │
  └─────────────┘     └─────────────┘     └─────────────┘
                                                   │
                         ┌─────────────────────────┼─────────────────────────┐
                         │                         │                         │
                         ▼                         ▼                         ▼
                   ┌──────────┐             ┌──────────┐              ┌──────────┐
                   │   S3     │             │ Lambda   │              │ CloudWatch│
                   │ (Output) │             │ Workers  │              │ (Logs)   │
                   └──────────┘             └──────────┘              └──────────┘
```

### 4.2 Lambda 客户端实现

```typescript
// packages/generator/src/video/remotion-client.ts

import {
  RemotionLambdaClient,
  renderMediaOnLambda,
  getRenderProgress,
} from '@remotion/lambda/client';
import type { VideoTemplateConfig } from '@vidluxe/remotion-templates';

/**
 * Remotion Lambda 客户端
 *
 * 文档：https://remotion.dev/docs/lambda/render-media-on-lambda
 */
export class RemotionLambdaClient {
  private client: RemotionLambdaClient;
  private region: string;
  private functionName: string;
  private bucketName: string;

  constructor(config: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    functionName: string;
    bucketName: string;
  }) {
    this.region = config.region;
    this.functionName = config.functionName;
    this.bucketName = config.bucketName;

    // 初始化客户端
    // 参考：https://remotion.dev/docs/lambda/permissions
    this.client = new RemotionLambdaClient({
      region: config.region,
      credential: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  /**
   * 渲染视频
   *
   * @param compositionId - 合成 ID
   * @param inputProps - 输入参数
   * @param config - 视频配置
   * @returns 渲染任务 ID
   *
   * 参考：https://remotion.dev/docs/lambda/render-media-on-lambda
   */
  async renderVideo(
    compositionId: string,
    inputProps: Record<string, unknown>,
    config: VideoTemplateConfig
  ): Promise<{ renderId: string; bucketName: string }> {
    const { renderId } = await renderMediaOnLambda({
      region: this.region,
      functionName: this.functionName,
      composition: compositionId,
      serveUrl: await this.getServeUrl(),
      inputProps,
      codec: 'h264',
      outputBucket: this.bucketName,
      outputFolder: 'renders',
      // 视频配置
      framesPerLambda: 20, // 每个 Lambda 处理 20 帧
      maxRetries: 1,
      // 质量设置
      crf: 18, // 高质量 (范围 0-51，越小质量越高)
      // 并发设置
      concurrencyPerLambda: 2,
      // 尺寸
      width: config.width,
      height: config.height,
      fps: config.fps,
    });

    return { renderId, bucketName: this.bucketName };
  }

  /**
   * 查询渲染进度
   *
   * 参考：https://remotion.dev/docs/lambda/getrenderprogress
   */
  async getProgress(renderId: string, bucketName: string) {
    const progress = await getRenderProgress({
      renderId,
      bucketName,
      region: this.region,
      functionName: this.functionName,
    });

    return {
      progress: progress.overallProgress,
      status: progress.status,
      outputUrl: progress.outputFile,
      timeRemaining: progress.timeRemainingInSeconds,
      framesRendered: progress.framesRendered,
      totalFrames: progress.framesTotal,
    };
  }

  /**
   * 获取 Serve URL
   *
   * 方式：
   * 1. 部署到 S3 (推荐生产环境)
   * 2. 使用本地开发服务器
   *
   * 参考：https://remotion.dev/docs/lambda/deploy-function
   */
  private async getServeUrl(): Promise<string> {
    // 生产环境：使用预部署的 Site
    // 参考：https://remotion.dev/docs/lambda/sites
    return process.env.REMOTION_SITE_URL!;
  }
}
```

### 4.3 Vercel API 路由

```typescript
// apps/web/app/api/render/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { RemotionLambdaClient } from '@vidluxe/generator';
import { z } from 'zod';

const RenderRequestSchema = z.object({
  compositionId: z.string(),
  inputProps: z.record(z.unknown()),
  config: z.object({
    fps: z.number().default(30),
    durationInFrames: z.number(),
    width: z.number().default(1080),
    height: z.number().default(1920),
  }),
});

// 初始化客户端（使用环境变量）
const remotionClient = new RemotionLambdaClient({
  region: process.env.AWS_REGION!,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  functionName: process.env.REMOTION_FUNCTION_NAME!,
  bucketName: process.env.REMOTION_BUCKET_NAME!,
});

/**
 * POST /api/render
 *
 * 启动视频渲染任务
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { compositionId, inputProps, config } = RenderRequestSchema.parse(body);

    const result = await remotionClient.renderVideo(
      compositionId,
      inputProps,
      config
    );

    return NextResponse.json({
      success: true,
      renderId: result.renderId,
      bucketName: result.bucketName,
    });
  } catch (error) {
    console.error('Render error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start render' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/render?renderId=xxx
 *
 * 查询渲染进度
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const renderId = searchParams.get('renderId');
  const bucketName = searchParams.get('bucketName');

  if (!renderId || !bucketName) {
    return NextResponse.json(
      { error: 'Missing renderId or bucketName' },
      { status: 400 }
    );
  }

  try {
    const progress = await remotionClient.getProgress(renderId, bucketName);

    return NextResponse.json({
      success: true,
      ...progress,
    });
  } catch (error) {
    console.error('Progress error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get progress' },
      { status: 500 }
    );
  }
}
```

---

## 5. 注册合成

### 5.1 根组件注册

**来源**: [Remotion - Registering Compositions](https://remotion.dev/docs/register-composition)

```typescript
// packages/remotion-templates/src/index.ts

import { Composition } from 'remotion';
import { PremiumTalkingVideo } from './compositions/PremiumTalkingVideo';
import { ProductShowcase } from './compositions/ProductShowcase';
import { TextCardVideo } from './compositions/TextCardVideo';

/**
 * 视频合成注册
 *
 * 参考：https://remotion.dev/docs/composition
 */
export const VidLuxeCompositions = () => {
  return (
    <>
      {/* 口播视频模板 */}
      <Composition
        id="PremiumTalkingVideo"
        component={PremiumTalkingVideo}
        durationInFrames={900} // 30秒 @ 30fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          input: {
            background: {
              type: 'gradient',
              source: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            },
            textLayers: [],
          },
          effects: {
            colorGrade: { preset: 'cinematic', intensity: 0.5 },
            lighting: { vignette: true, vignetteIntensity: 0.3, glowEffect: false, glowRadius: 0 },
            motion: { smoothCamera: true, parallaxLayers: false, depthOfField: false },
          },
        }}
      />

      {/* 产品展示模板 */}
      <Composition
        id="ProductShowcase"
        component={ProductShowcase}
        durationInFrames={450} // 15秒 @ 30fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          // 默认属性
        }}
      />

      {/* 文字卡片模板 */}
      <Composition
        id="TextCardVideo"
        component={TextCardVideo}
        durationInFrames={150} // 5秒 @ 30fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          // 默认属性
        }}
      />
    </>
  );
};
```

---

## 6. 成本估算

### 6.1 Lambda 成本

**来源**: [Remotion Lambda - Cost](https://remotion.dev/docs/lambda/cost)

```yaml
# 成本因素
Lambda 计算时间:
  - 每帧渲染时间: ~0.5-2秒 (取决于复杂度)
  - 30秒视频 (900帧 @ 30fps)
  - 并行处理: 45 个 Lambda (每 20 帧)
  - 每个 Lambda 执行时间: ~10-40秒

费用估算 (us-east-1):
  - Lambda: $0.0000166667/GB-second
  - 内存: 2048MB (2GB)
  - 预估成本: ~$0.03-0.05/视频

S3 存储:
  - 输出视频: ~10-50MB
  - 存储成本: ~$0.023/GB/月
  - 可忽略不计

数据传输:
  - CloudFront CDN: $0.085/GB
  - 视频下载: ~$0.001/视频

总计:
  MVP 阶段: ~$0.05-0.08/视频
```

### 6.2 Remotion Cloud 计划

```yaml
# 如使用 Remotion Cloud (官方托管)
# 参考: https://remotion.dev/docs/cloud

免费层:
  - 5000 帧渲染/月
  - 适合测试和小规模使用

专业版 ($99/月):
  - 无限渲染
  - 优先队列
  - 技术支持
```

---

## 7. 最佳实践

### 7.1 性能优化

**参考**: [Remotion - Performance](https://remotion.dev/docs/performance)

```typescript
// 1. 使用 OffthreadVideo 替代 Video（自动优化）
import { OffthreadVideo } from 'remotion';

// 2. 避免在渲染时加载远程资源
// 预加载所有素材到本地或 CDN

// 3. 使用正确的编码格式
const recommendedFormats = {
  video: 'h264', // 兼容性最好
  audio: 'aac',
  container: 'mp4',
};

// 4. 并发控制
const concurrencySettings = {
  framesPerLambda: 20, // 每个 Lambda 处理的帧数
  maxLambdas: 100, // 最大 Lambda 数量
};
```

### 7.2 错误处理

```typescript
// packages/generator/src/video/render-manager.ts

export class RenderManager {
  /**
   * 带重试的渲染
   */
  async renderWithRetry(
    compositionId: string,
    inputProps: Record<string, unknown>,
    maxRetries = 3
  ): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const { renderId, bucketName } = await this.client.renderVideo(
          compositionId,
          inputProps,
          this.config
        );

        // 轮询等待完成
        const result = await this.waitForCompletion(renderId, bucketName);

        if (result.status === 'success') {
          return result.outputUrl!;
        }

        throw new Error(`Render failed: ${result.error}`);
      } catch (error) {
        lastError = error as Error;
        console.warn(`Render attempt ${attempt + 1} failed:`, error);

        // 指数退避
        await this.sleep(Math.pow(2, attempt) * 1000);
      }
    }

    throw lastError;
  }

  private async waitForCompletion(
    renderId: string,
    bucketName: string,
    timeout = 300000 // 5分钟超时
  ): Promise<RenderResult> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const progress = await this.client.getProgress(renderId, bucketName);

      if (progress.status === 'done') {
        return { status: 'success', outputUrl: progress.outputUrl };
      }

      if (progress.status === 'failed') {
        return { status: 'error', error: 'Render failed' };
      }

      // 每 2 秒检查一次
      await this.sleep(2000);
    }

    return { status: 'error', error: 'Timeout' };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

interface RenderResult {
  status: 'success' | 'error';
  outputUrl?: string;
  error?: string;
}
```

---

## 8. 参考资源

### 官方文档

| 资源 | 链接 |
|------|------|
| Remotion 文档 | https://remotion.dev/docs/ |
| Lambda 文档 | https://remotion.dev/docs/lambda |
| Composition API | https://remotion.dev/docs/composition |
| Player 组件 | https://remotion.dev/docs/player |
| 性能优化 | https://remotion.dev/docs/performance |
| 常见问题 | https://remotion.dev/docs/faq |

### GitHub 资源

| 资源 | 链接 |
|------|------|
| Remotion 主仓库 | https://github.com/remotion-dev/remotion |
| 官方模板 | https://github.com/remotion-dev/template |
| Prompt-to-Video 示例 | https://github.com/remotion-dev/template-prompt-to-video |

### 社区资源

| 资源 | 链接 |
|------|------|
| Discord 社区 | https://discord.gg/6Vzz3wJK |
| Twitter | https://twitter.com/JNYBGR |
| 示例项目 | https://remotion.dev/showcase |

---

## 9. 下一步

1. **安装 Remotion**: `pnpm add remotion @remotion/lambda @remotion/player`
2. **配置 AWS Lambda**: 按照 [Lambda 设置指南](https://remotion.dev/docs/lambda/setup) 配置
3. **创建第一个合成**: 参考本文档中的模板实现
4. **集成到 VidLuxe**: 将 Remotion 模板与 Nano Banana 生成的素材结合

---

## 更新历史

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-02-16 | 1.0 | 初始版本 |
