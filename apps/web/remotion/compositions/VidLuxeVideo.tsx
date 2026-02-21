/**
 * VidLuxe 视频合成组件
 *
 * 将前景（人物）合成到高级感背景上
 * 支持 5 种预设风格
 */

import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Img,
  Video,
  Sequence,
} from 'remotion';

// 预设风格类型
export type StyleType = 'magazine' | 'soft' | 'urban' | 'minimal' | 'vintage';

// 组件 Props
export interface VidLuxeVideoProps {
  backgroundUrl: string;
  foregroundUrl: string;
  styleType: StyleType;
  text?: {
    title?: string;
    subtitle?: string;
  };
}

// 风格配色
const STYLE_COLORS: Record<StyleType, { primary: string; secondary: string }> = {
  magazine: { primary: '#D4AF37', secondary: '#1A1A1A' },
  soft: { primary: '#F5E6D3', secondary: '#8B7355' },
  urban: { primary: '#2C3E50', secondary: '#3498DB' },
  minimal: { primary: '#FFFFFF', secondary: '#000000' },
  vintage: { primary: '#C9A86C', secondary: '#4A3728' },
};

/**
 * 主视频合成组件
 */
export const VidLuxeVideo: React.FC<VidLuxeVideoProps> = ({
  backgroundUrl,
  foregroundUrl,
  styleType,
  text,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const colors = STYLE_COLORS[styleType] || STYLE_COLORS.magazine;

  // 入场动画
  const backgroundOpacity = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const foregroundScale = spring({
    frame,
    fps,
    config: {
      damping: 20,
      stiffness: 100,
    },
  });

  const textOpacity = interpolate(frame, [fps * 0.5, fps * 1], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const textY = interpolate(frame, [fps * 0.5, fps * 1], [50, 0], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.secondary }}>
      {/* 背景层 */}
      {backgroundUrl && (
        <AbsoluteFill style={{ opacity: backgroundOpacity }}>
          <Img
            src={backgroundUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </AbsoluteFill>
      )}

      {/* 前景层（人物） */}
      {foregroundUrl && (
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            transform: `scale(${foregroundScale})`,
          }}
        >
          <Img
            src={foregroundUrl}
            style={{
              maxHeight: '80%',
              objectFit: 'contain',
            }}
          />
        </AbsoluteFill>
      )}

      {/* 文字叠加层 */}
      {text && (
        <AbsoluteFill
          style={{
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingBottom: 150,
          }}
        >
          <div
            style={{
              opacity: textOpacity,
              transform: `translateY(${textY}px)`,
              textAlign: 'center',
            }}
          >
            {text.title && (
              <h1
                style={{
                  fontFamily: 'system-ui',
                  fontSize: 64,
                  fontWeight: 'bold',
                  color: colors.primary,
                  textShadow: `2px 2px 8px rgba(0,0,0,0.5)`,
                  margin: 0,
                }}
              >
                {text.title}
              </h1>
            )}
            {text.subtitle && (
              <p
                style={{
                  fontFamily: 'system-ui',
                  fontSize: 32,
                  color: '#FFFFFF',
                  textShadow: `1px 1px 4px rgba(0,0,0,0.5)`,
                  marginTop: 16,
                }}
              >
                {text.subtitle}
              </p>
            )}
          </div>
        </AbsoluteFill>
      )}

      {/* 风格滤镜 */}
      <AbsoluteFill
        style={{
          mixBlendMode: 'overlay',
          opacity: 0.1,
          backgroundColor: colors.primary,
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * 过渡动画组件
 */
export const Transition: React.FC<{
  children: React.ReactNode;
  type: 'fade' | 'slide' | 'scale';
}> = ({ children, type }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const animationProps = (() => {
    switch (type) {
      case 'fade':
        return {
          opacity: interpolate(frame, [0, fps * 0.3], [0, 1], {
            extrapolateRight: 'clamp',
          }),
        };
      case 'slide':
        return {
          opacity: interpolate(frame, [0, fps * 0.3], [0, 1], {
            extrapolateRight: 'clamp',
          }),
          transform: `translateX(${interpolate(frame, [0, fps * 0.3], [100, 0], {
            extrapolateRight: 'clamp',
          })}px)`,
        };
      case 'scale':
        return {
          transform: `scale(${spring({ frame, fps, config: { damping: 15 } })})`,
        };
    }
  })();

  return <div style={animationProps}>{children}</div>;
};
