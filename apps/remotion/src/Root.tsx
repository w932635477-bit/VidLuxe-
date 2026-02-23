import React from 'react';
import { Composition } from 'remotion';
import { PremiumScoreDemo } from './compositions/PremiumScoreDemo';
import {
  VideoEnhancementComposition,
  type VideoEnhancementProps,
} from './compositions/VideoEnhancement';

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
        component={VideoEnhancementComposition}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          backgroundUrl: '',
          styleType: 'magazine',
          showScore: true,
        }}
        schema={undefined as never} // Remotion 4.x 兼容
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

// 导出类型供外部使用
export type { VideoEnhancementProps };
