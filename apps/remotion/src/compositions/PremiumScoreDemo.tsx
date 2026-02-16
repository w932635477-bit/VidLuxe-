import React from 'react';
import {
  AbsoluteFill,
  useVideoConfig,
  useCurrentFrame,
  interpolate,
  spring,
} from 'remotion';
import { PremiumScorer } from '@vidluxe/core';

// ============================================================================
// Premium Score Demo Composition
// ============================================================================

export const PremiumScoreDemo: React.FC = () => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  // Demo score data
  const score = 72;
  const grade = 'B';
  const gradeColor = '#2196F3';

  // Animation
  const scoreOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const scoreScale = spring({
    frame,
    fps,
    config: {
      damping: 12,
    },
  });

  const progressWidth = spring({
    frame: frame - 15,
    fps,
    config: {
      damping: 20,
    },
  });

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'SF Pro Display, -apple-system, sans-serif',
      }}
    >
      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 200,
          textAlign: 'center',
          opacity: interpolate(frame, [0, 20], [0, 1]),
        }}
      >
        <h1
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: '#fff',
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          VidLuxe
        </h1>
        <p
          style={{
            fontSize: 28,
            color: 'rgba(255,255,255,0.6)',
            marginTop: 16,
            fontWeight: 400,
          }}
        >
          Premium Video Engine
        </p>
      </div>

      {/* Score Circle */}
      <div
        style={{
          opacity: scoreOpacity,
          transform: `scale(${scoreScale})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: `conic-gradient(${gradeColor} ${score * 3.6}deg, rgba(255,255,255,0.1) 0deg)`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: `0 0 60px ${gradeColor}40`,
          }}
        >
          <div
            style={{
              width: 240,
              height: 240,
              borderRadius: '50%',
              background: '#1a1a2e',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: 80,
                fontWeight: 700,
                color: '#fff',
              }}
            >
              {score}
            </span>
            <span
              style={{
                fontSize: 36,
                fontWeight: 600,
                color: gradeColor,
              }}
            >
              Grade {grade}
            </span>
          </div>
        </div>
      </div>

      {/* Dimension Bars */}
      <div
        style={{
          position: 'absolute',
          bottom: 300,
          width: 800,
          opacity: interpolate(frame, [30, 50], [0, 1]),
        }}
      >
        <DimensionBar
          label="色彩协调度"
          score={78}
          color="#FF6B35"
          progress={progressWidth}
        />
        <DimensionBar
          label="排版舒适度"
          score={65}
          color="#4CAF50"
          progress={progressWidth}
        />
        <DimensionBar
          label="构图美感度"
          score={72}
          color="#2196F3"
          progress={progressWidth}
        />
      </div>

      {/* Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: 100,
          opacity: interpolate(frame, [60, 80], [0, 1]),
        }}
      >
        <p
          style={{
            fontSize: 24,
            color: 'rgba(255,255,255,0.4)',
          }}
        >
          vidluxe.ai - 让你的视频瞬间变得高级
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// Dimension Bar Component
// ============================================================================

interface DimensionBarProps {
  label: string;
  score: number;
  color: string;
  progress: number;
}

const DimensionBar: React.FC<DimensionBarProps> = ({ label, score, color, progress }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: 20,
      }}
    >
      <span
        style={{
          width: 150,
          fontSize: 22,
          color: 'rgba(255,255,255,0.8)',
        }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          height: 12,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 6,
          overflow: 'hidden',
          marginLeft: 20,
        }}
      >
        <div
          style={{
            width: `${score * progress}%`,
            height: '100%',
            background: color,
            borderRadius: 6,
          }}
        />
      </div>
      <span
        style={{
          width: 60,
          textAlign: 'right',
          fontSize: 22,
          fontWeight: 600,
          color: '#fff',
          marginLeft: 16,
        }}
      >
        {score}
      </span>
    </div>
  );
};
