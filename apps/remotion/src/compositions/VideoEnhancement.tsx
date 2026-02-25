import React from 'react';
import {
  AbsoluteFill,
  useVideoConfig,
  useCurrentFrame,
  interpolate,
  spring,
  Img,
  Video,
  Sequence,
} from 'remotion';

// ============================================================================
// Types
// ============================================================================

export interface VideoEnhancementProps {
  /** 背景图 URL */
  backgroundUrl: string;
  /** 前景图/视频 URL（已抠像的人物） */
  foregroundUrl?: string;
  /** 文字内容 */
  text?: {
    title?: string;
    subtitle?: string;
    highlights?: string[];
  };
  /** 风格类型 */
  styleType?: 'magazine' | 'soft' | 'urban' | 'minimal' | 'vintage';
  /** 是否显示评分 */
  showScore?: boolean;
  /** 评分数据 */
  scoreData?: {
    overall: number;
    grade: string;
    dimensions: {
      visualAttraction: number;
      contentMatch: number;
      authenticity: number;
      emotionalImpact: number;
      actionGuidance: number;
    };
  };
}

// ============================================================================
// Style Themes
// ============================================================================

const STYLE_THEMES = {
  magazine: {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    accentColor: '#D4AF37',
    textColor: '#ffffff',
    secondaryColor: 'rgba(255,255,255,0.6)',
  },
  soft: {
    background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    accentColor: '#e17055',
    textColor: '#2d3436',
    secondaryColor: 'rgba(45,52,54,0.6)',
  },
  urban: {
    background: 'linear-gradient(135deg, #2d3436 0%, #636e72 100%)',
    accentColor: '#00b894',
    textColor: '#ffffff',
    secondaryColor: 'rgba(255,255,255,0.6)',
  },
  minimal: {
    background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
    accentColor: '#333333',
    textColor: '#1a1a1a',
    secondaryColor: 'rgba(0,0,0,0.5)',
  },
  vintage: {
    background: 'linear-gradient(135deg, #d4a373 0%, #ccd5ae 100%)',
    accentColor: '#bc6c25',
    textColor: '#264653',
    secondaryColor: 'rgba(38,70,83,0.6)',
  },
};

// ============================================================================
// Video Enhancement Composition
// ============================================================================

export const VideoEnhancementComposition: React.FC<VideoEnhancementProps> = ({
  backgroundUrl,
  foregroundUrl,
  text,
  styleType = 'magazine',
  showScore = false,
  scoreData,
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const theme = STYLE_THEMES[styleType];

  // 背景动画
  const backgroundScale = interpolate(frame, [0, 150], [1, 1.1], {
    extrapolateRight: 'clamp',
  });

  const backgroundOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // 前景（人物）动画
  const foregroundEnter = spring({
    frame: frame - 20,
    fps,
    config: { damping: 15 },
  });

  // 文字动画
  const textEnter = spring({
    frame: frame - 40,
    fps,
    config: { damping: 12 },
  });

  // 评分动画
  const scoreEnter = spring({
    frame: frame - 60,
    fps,
    config: { damping: 15 },
  });

  return (
    <AbsoluteFill style={{ background: theme.background }}>
      {/* 背景层 */}
      <AbsoluteFill
        style={{
          transform: `scale(${backgroundScale})`,
          opacity: backgroundOpacity,
        }}
      >
        {backgroundUrl ? (
          <Img
            src={backgroundUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <AbsoluteFill style={{ background: theme.background }} />
        )}
      </AbsoluteFill>

      {/* 渐变遮罩 */}
      <AbsoluteFill
        style={{
          background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.5) 100%)',
        }}
      />

      {/* 前景层（人物） */}
      {foregroundUrl && (
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            opacity: foregroundEnter,
            transform: `translateY(${(1 - foregroundEnter) * 50}px)`,
          }}
        >
          <Img
            src={foregroundUrl}
            style={{
              maxHeight: '80%',
              maxWidth: '90%',
              objectFit: 'contain',
            }}
          />
        </AbsoluteFill>
      )}

      {/* 文字层 */}
      {text && (
        <AbsoluteFill
          style={{
            justifyContent: 'flex-end',
            alignItems: 'flex-start',
            padding: 60,
            paddingBottom: 120,
          }}
        >
          <div
            style={{
              opacity: textEnter,
              transform: `translateY(${(1 - textEnter) * 30}px)`,
            }}
          >
            {text.title && (
              <h1
                style={{
                  fontSize: 56,
                  fontWeight: 700,
                  color: theme.textColor,
                  margin: 0,
                  marginBottom: 16,
                  letterSpacing: '-0.02em',
                  textShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}
              >
                {text.title}
              </h1>
            )}
            {text.subtitle && (
              <p
                style={{
                  fontSize: 28,
                  color: theme.secondaryColor,
                  margin: 0,
                  fontWeight: 400,
                }}
              >
                {text.subtitle}
              </p>
            )}
          </div>
        </AbsoluteFill>
      )}

      {/* 评分展示 */}
      {showScore && scoreData && frame > 60 && (
        <Sequence from={60}>
          <ScoreOverlay
            scoreData={scoreData}
            theme={theme}
            enterProgress={scoreEnter}
          />
        </Sequence>
      )}

      {/* 品牌水印 */}
      <AbsoluteFill
        style={{
          justifyContent: 'flex-end',
          alignItems: 'flex-end',
          padding: 30,
        }}
      >
        <div
          style={{
            opacity: interpolate(frame, [120, 140], [0, 0.6]),
            fontSize: 18,
            color: theme.textColor,
            fontWeight: 500,
            letterSpacing: '0.05em',
          }}
        >
          VidLuxe
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============================================================================
// Score Overlay Component
// ============================================================================

interface ScoreOverlayProps {
  scoreData: VideoEnhancementProps['scoreData'];
  theme: (typeof STYLE_THEMES)[keyof typeof STYLE_THEMES];
  enterProgress: number;
}

const ScoreOverlay: React.FC<ScoreOverlayProps> = ({ scoreData, theme, enterProgress }) => {
  const frame = useCurrentFrame();

  if (!scoreData) return null;

  const { overall, grade, dimensions } = scoreData;

  // 评分圆环动画
  const scoreProgress = interpolate(enterProgress, [0, 1], [0, overall / 100]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        padding: 40,
        top: 'auto',
        bottom: 250,
      }}
    >
      <div
        style={{
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(10px)',
          borderRadius: 20,
          padding: 24,
          opacity: enterProgress,
          transform: `translateX(${(1 - enterProgress) * 30}px)`,
        }}
      >
        {/* 评分圆环 */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: `conic-gradient(${theme.accentColor} ${scoreProgress * 360}deg, rgba(255,255,255,0.1) 0deg)`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.8)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 36, fontWeight: 700, color: '#fff' }}>
              {Math.round(overall)}
            </span>
            <span style={{ fontSize: 16, fontWeight: 600, color: theme.accentColor }}>
              {grade}
            </span>
          </div>
        </div>

        {/* 维度评分 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <DimensionMiniBar label="视觉" score={dimensions.visualAttraction} color={theme.accentColor} />
          <DimensionMiniBar label="匹配" score={dimensions.contentMatch} color="#4CAF50" />
          <DimensionMiniBar label="真实" score={dimensions.authenticity} color="#2196F3" />
          <DimensionMiniBar label="情绪" score={dimensions.emotionalImpact} color="#FF6B35" />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// Dimension Mini Bar Component
// ============================================================================

interface DimensionMiniBarProps {
  label: string;
  score: number;
  color: string;
}

const DimensionMiniBar: React.FC<DimensionMiniBarProps> = ({ label, score, color }) => {
  const frame = useCurrentFrame();

  const progress = spring({
    frame: frame - 10,
    fps: 30,
    config: { damping: 20 },
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', width: 32 }}>{label}</span>
      <div
        style={{
          flex: 1,
          height: 4,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${score * progress}%`,
            height: '100%',
            background: color,
            borderRadius: 2,
          }}
        />
      </div>
      <span style={{ fontSize: 12, color: '#fff', width: 24, textAlign: 'right' }}>
        {score}
      </span>
    </div>
  );
};

export default VideoEnhancementComposition;
