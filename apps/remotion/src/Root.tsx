import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { z } from 'zod';
import { PremiumScoreDemo } from './compositions/PremiumScoreDemo';
import {
  VideoEnhancementComposition,
  type VideoEnhancementProps,
} from './compositions/VideoEnhancement';

// 定义 VideoEnhancement 的 schema
const videoEnhancementSchema = z.object({
  backgroundUrl: z.string(),
  foregroundUrl: z.string().optional(),
  text: z
    .object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
      highlights: z.array(z.string()).optional(),
    })
    .optional(),
  styleType: z.enum(['magazine', 'soft', 'urban', 'minimal', 'vintage']).optional(),
  showScore: z.boolean().optional(),
  scoreData: z
    .object({
      overall: z.number(),
      grade: z.string(),
      dimensions: z.object({
        visualAttraction: z.number(),
        contentMatch: z.number(),
        authenticity: z.number(),
        emotionalImpact: z.number(),
        actionGuidance: z.number(),
      }),
    })
    .optional(),
});

/**
 * VidLuxe Remotion Root
 *
 * 注册所有可用的视频 Composition
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 视频增强 Composition - 主要用于实际视频处理 */}
      <Composition
        id="VideoEnhancement"
        component={VideoEnhancementComposition as React.FC<z.infer<typeof videoEnhancementSchema>>}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
        schema={videoEnhancementSchema}
        defaultProps={{
          backgroundUrl: '',
          styleType: 'magazine',
          showScore: true,
        }}
      />

      {/* 评分演示 Composition - 用于展示评分功能 */}
      <Composition
        id="PremiumScoreDemo"
        component={PremiumScoreDemo}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};

// 注册 Root - Remotion 要求
registerRoot(RemotionRoot);

// 导出类型供外部使用
export type { VideoEnhancementProps };
