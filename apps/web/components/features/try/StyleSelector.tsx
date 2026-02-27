'use client';

import { useState } from 'react';
import type { ContentType } from '@/lib/content-types';
import { getContentTypeConfig } from '@/lib/content-types';

// 风格预设类型
export type StyleType = 'magazine' | 'soft' | 'urban' | 'vintage';

// 风格来源类型
export type StyleSourceType = 'reference' | 'preset';

// 风格预设配置
export interface StylePreset {
  id: StyleType;
  name: string;
  nameEn: string;
  description: string;
  tags: string[];
  suitableFor: string[];
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
  thumbnail: {
    before: string;
    after: string;
  };
  // 根据内容类型的不同对比图
  comparisonImagesByType?: Partial<Record<ContentType, { before: string; after: string }>>;
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'magazine',
    name: '杂志大片',
    nameEn: 'Magazine',
    description: '时尚杂志封面质感，高级奢华',
    tags: ['时尚杂志', '高级感', '奢华'],
    suitableFor: ['穿搭', '美妆', '奢侈品', '时尚博主'],
    accentColor: '#D4AF37',
    gradientFrom: '#D4AF37',
    gradientTo: '#8B6914',
    thumbnail: {
      before: '/comparisons/fashion-1-original.jpg',
      after: '/comparisons/fashion-1-enhanced.jpg',
    },
    comparisonImagesByType: {
      outfit: { before: '/comparisons/fashion-1-original.jpg', after: '/comparisons/fashion-1-enhanced.jpg' },
      beauty: { before: '/hero/hero-beauty-before.jpg', after: '/hero/hero-beauty-after.jpg' },
      cafe: { before: '/comparisons/cafe-1-original.jpg', after: '/comparisons/cafe-1-enhanced.jpg' },
      food: { before: '/comparisons/food-1-original.jpg', after: '/comparisons/food-1-enhanced.jpg' },
    },
  },
  {
    id: 'soft',
    name: '温柔日系',
    nameEn: 'Soft',
    description: '清新温柔，文艺治愈感',
    tags: ['清新温柔', '文艺氛围', '日系'],
    suitableFor: ['生活方式', '探店', '美食', '家居'],
    accentColor: '#B8A99A',
    gradientFrom: '#D4C5B9',
    gradientTo: '#9A8A7A',
    thumbnail: {
      before: '/comparisons/lifestyle-1-original.jpg',
      after: '/comparisons/lifestyle-1-enhanced.jpg',
    },
    comparisonImagesByType: {
      outfit: { before: '/comparisons/portrait-1-original.jpg', after: '/comparisons/portrait-1-enhanced.jpg' },
      beauty: { before: '/hero/hero-beauty-before.jpg', after: '/hero/hero-beauty-after.jpg' },
      cafe: { before: '/comparisons/cafe-1-original.jpg', after: '/comparisons/cafe-1-enhanced.jpg' },
      travel: { before: '/comparisons/lifestyle-1-original.jpg', after: '/comparisons/lifestyle-1-enhanced.jpg' },
      food: { before: '/comparisons/food-1-original.jpg', after: '/comparisons/food-1-enhanced.jpg' },
    },
  },
  {
    id: 'urban',
    name: '都市职场',
    nameEn: 'Urban',
    description: '专业干练，可信赖感',
    tags: ['专业干练', '都市精英', '可信赖'],
    suitableFor: ['职场', '知识分享', '科技', '财经'],
    accentColor: '#5E7A99',
    gradientFrom: '#6B8AAD',
    gradientTo: '#3D5A80',
    thumbnail: {
      before: '/comparisons/cafe-1-original.jpg',
      after: '/comparisons/cafe-1-enhanced.jpg',
    },
    comparisonImagesByType: {
      outfit: { before: '/comparisons/fashion-1-original.jpg', after: '/comparisons/fashion-1-enhanced.jpg' },
      cafe: { before: '/comparisons/cafe-1-original.jpg', after: '/comparisons/cafe-1-enhanced.jpg' },
    },
  },
  {
    id: 'vintage',
    name: '复古胶片',
    nameEn: 'Vintage',
    description: '复古怀旧，电影氛围感',
    tags: ['复古怀旧', '电影感', '胶片'],
    suitableFor: ['人像', '旅行', '文艺内容', '复古穿搭'],
    accentColor: '#C9A86C',
    gradientFrom: '#D4B896',
    gradientTo: '#8B7355',
    thumbnail: {
      before: '/comparisons/portrait-1-original.jpg',
      after: '/comparisons/portrait-1-enhanced.jpg',
    },
    comparisonImagesByType: {
      outfit: { before: '/comparisons/fashion-1-original.jpg', after: '/comparisons/fashion-1-enhanced.jpg' },
      travel: { before: '/comparisons/lifestyle-1-original.jpg', after: '/comparisons/lifestyle-1-enhanced.jpg' },
      cafe: { before: '/comparisons/cafe-1-original.jpg', after: '/comparisons/cafe-1-enhanced.jpg' },
    },
  },
];

// 组件 Props
interface StyleSelectorProps {
  selectedStyle: StyleType;
  onSelect: (style: StyleType) => void;
  contentType?: ContentType;
  className?: string;
}

// 单个风格卡片
function StyleCard({
  preset,
  isSelected,
  onSelect,
  contentType,
}: {
  preset: StylePreset;
  isSelected: boolean;
  onSelect: () => void;
  contentType?: ContentType;
}) {
  const [isHovered, setIsHovered] = useState(false);

  // 根据 content type 获取对比图
  const getComparisonImages = () => {
    if (contentType && preset.comparisonImagesByType?.[contentType]) {
      return preset.comparisonImagesByType[contentType];
    }
    return preset.thumbnail;
  };

  const images = getComparisonImages();

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        width: '100%',
        textAlign: 'left',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
      }}
    >
      {/* 卡片容器 */}
      <div
        style={{
          position: 'relative',
          borderRadius: '20px',
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.03)',
          border: isSelected
            ? `2px solid ${preset.accentColor}`
            : '1px solid rgba(255, 255, 255, 0.08)',
          transition: 'all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
          transform: isHovered || isSelected ? 'translateY(-4px)' : 'translateY(0)',
          boxShadow: isSelected
            ? `0 8px 32px ${preset.accentColor}33`
            : isHovered
            ? '0 8px 24px rgba(0, 0, 0, 0.4)'
            : '0 2px 8px rgba(0, 0, 0, 0.2)',
        }}
      >
        {/* 预览图区域 */}
        <div
          style={{
            position: 'relative',
            aspectRatio: '9/12',
            overflow: 'hidden',
          }}
        >
          {/* Before 图片 */}
          <img
            src={images.before}
            alt={`${preset.name} - 原图`}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: isHovered ? 0 : 1,
              transition: 'opacity 0.5s ease',
            }}
          />
          {/* After 图片 */}
          <img
            src={images.after}
            alt={`${preset.name} - 效果图`}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.5s ease',
            }}
          />
          {/* 渐变遮罩 */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '50%',
              background: `linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)`,
            }}
          />

          {/* 风格名称覆盖层 */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '14px',
              right: '14px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '6px',
                marginBottom: '4px',
              }}
            >
              <span
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#fff',
                  letterSpacing: '-0.02em',
                }}
              >
                {preset.name}
              </span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.5)',
                  letterSpacing: '0.02em',
                }}
              >
                {preset.nameEn}
              </span>
            </div>
          </div>

          {/* 选中指示器 */}
          {isSelected && (
            <div
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: preset.accentColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12L10 17L19 8"
                  stroke="#000"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </div>

        {/* 信息区域 */}
        <div style={{ padding: '14px' }}>
          {/* 标签 */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap',
              marginBottom: '10px',
            }}
          >
            {preset.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: preset.accentColor,
                  background: `${preset.accentColor}15`,
                  padding: '4px 10px',
                  borderRadius: '100px',
                  letterSpacing: '0.02em',
                }}
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* 适合场景 */}
          <div
            style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.45)',
              lineHeight: '1.5',
            }}
          >
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>适合：</span>
            {preset.suitableFor.slice(0, 3).join(' · ')}
          </div>
        </div>
      </div>
    </button>
  );
}

// 主组件
export function StyleSelector({
  selectedStyle,
  onSelect,
  contentType,
  className = '',
}: StyleSelectorProps) {
  return (
    <div className={className}>
      {/* 标题 */}
      <div style={{ marginBottom: '20px' }}>
        <h3
          style={{
            fontSize: '17px',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.95)',
            letterSpacing: '-0.02em',
            marginBottom: '4px',
          }}
        >
          选择预设风格
        </h3>
        <p
          style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.45)',
          }}
        >
          悬停查看效果，点击选择
        </p>
      </div>

      {/* 风格卡片网格 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
        }}
      >
        {STYLE_PRESETS.map((preset) => (
          <StyleCard
            key={preset.id}
            preset={preset}
            isSelected={selectedStyle === preset.id}
            onSelect={() => onSelect(preset.id)}
            contentType={contentType}
          />
        ))}
      </div>
    </div>
  );
}

// 风格来源选择器
interface StyleSourceSelectorProps {
  sourceType: StyleSourceType;
  onSourceTypeChange: (type: StyleSourceType) => void;
  referenceFile: File | null;
  onReferenceFileChange: (file: File | null) => void;
  selectedPreset: StyleType;
  onPresetChange: (style: StyleType) => void;
  contentType?: ContentType;
}

export function StyleSourceSelector({
  sourceType,
  onSourceTypeChange,
  referenceFile,
  onReferenceFileChange,
  selectedPreset,
  onPresetChange,
  contentType,
}: StyleSourceSelectorProps) {
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleReferenceUpload = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) return;
    if (file.size > 50 * 1024 * 1024) return;

    onReferenceFileChange(file);
    setReferencePreview(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    handleReferenceUpload(file);
  };

  const clearReference = () => {
    onReferenceFileChange(null);
    setReferencePreview(null);
  };

  return (
    <div>
      {/* 标题 */}
      <div style={{ marginBottom: '20px' }}>
        <h3
          style={{
            fontSize: '17px',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.95)',
            letterSpacing: '-0.02em',
            marginBottom: '4px',
          }}
        >
          风格来源
        </h3>
        <p
          style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.45)',
          }}
        >
          上传参考图让 AI 学习风格，或选择预设风格
        </p>
      </div>

      {/* 两种方式切换 */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        {/* 方式A：上传参考图 */}
        <button
          onClick={() => onSourceTypeChange('reference')}
          style={{
            flex: 1,
            padding: '16px',
            borderRadius: '16px',
            border: sourceType === 'reference'
              ? '2px solid #D4AF37'
              : '1px solid rgba(255, 255, 255, 0.1)',
            background: sourceType === 'reference'
              ? 'rgba(212, 175, 55, 0.08)'
              : 'rgba(255, 255, 255, 0.02)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: sourceType === 'reference'
                  ? '#D4AF37'
                  : 'rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 16V4M12 4L8 8M12 4L16 8M4 16V18C4 19.1 4.9 20 6 20H18C19.1 20 20 19.1 20 18V16"
                  stroke={sourceType === 'reference' ? '#000' : 'rgba(255,255,255,0.5)'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: sourceType === 'reference'
                    ? '#D4AF37'
                    : 'rgba(255, 255, 255, 0.8)',
                  marginBottom: '2px',
                }}
              >
                上传参考图
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.45)',
                }}
              >
                AI 学习你喜欢的风格
              </div>
            </div>
          </div>
        </button>

        {/* 方式B：预设风格 */}
        <button
          onClick={() => onSourceTypeChange('preset')}
          style={{
            flex: 1,
            padding: '16px',
            borderRadius: '16px',
            border: sourceType === 'preset'
              ? '2px solid #D4AF37'
              : '1px solid rgba(255, 255, 255, 0.1)',
            background: sourceType === 'preset'
              ? 'rgba(212, 175, 55, 0.08)'
              : 'rgba(255, 255, 255, 0.02)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: sourceType === 'preset'
                  ? '#D4AF37'
                  : 'rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="4"
                  stroke={sourceType === 'preset' ? '#000' : 'rgba(255,255,255,0.5)'}
                  strokeWidth="2"
                />
                <circle
                  cx="8.5"
                  cy="8.5"
                  r="1.5"
                  fill={sourceType === 'preset' ? '#000' : 'rgba(255,255,255,0.5)'}
                />
                <path
                  d="M21 15L16 10L5 21"
                  stroke={sourceType === 'preset' ? '#000' : 'rgba(255,255,255,0.5)'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: sourceType === 'preset'
                    ? '#D4AF37'
                    : 'rgba(255, 255, 255, 0.8)',
                  marginBottom: '2px',
                }}
              >
                预设风格
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.45)',
                }}
              >
                5 种精选高级感风格
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* 根据选择显示不同内容 */}
      {sourceType === 'reference' ? (
        <div>
          {referencePreview ? (
            // 已上传参考图
            <div
              style={{
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div style={{ aspectRatio: '16/9', position: 'relative' }}>
                {referenceFile?.type.startsWith('video/') ? (
                  <video
                    src={referencePreview}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    muted
                    autoPlay
                    loop
                  />
                ) : (
                  <img
                    src={referencePreview}
                    alt="参考图预览"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                )}
                {/* 渐变遮罩 */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)',
                  }}
                />
                {/* 信息 */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '16px',
                    left: '16px',
                    right: '16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                    }}
                  >
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#34C759',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: 'rgba(255, 255, 255, 0.9)',
                      }}
                    >
                      风格已提取
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.5)',
                    }}
                  >
                    AI 将学习这张图片的风格并应用到你的内容
                  </p>
                </div>
              </div>
              {/* 清除按钮 */}
              <button
                onClick={clearReference}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="rgba(255,255,255,0.7)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          ) : (
            // 上传区域
            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => document.getElementById('reference-input')?.click()}
              style={{
                padding: '40px 24px',
                borderRadius: '16px',
                border: isDragOver
                  ? '2px dashed #D4AF37'
                  : '1px dashed rgba(255, 255, 255, 0.15)',
                background: isDragOver
                  ? 'rgba(212, 175, 55, 0.05)'
                  : 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.3s ease',
              }}
            >
              <input
                id="reference-input"
                type="file"
                accept="image/*,video/*"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files?.[0] && handleReferenceUpload(e.target.files[0])}
              />
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  margin: '0 auto 16px',
                  borderRadius: '16px',
                  background: 'rgba(212, 175, 55, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 16L8.586 11.414C9.367 10.633 10.633 10.633 11.414 11.414L16 16M14 14L15.586 12.414C16.367 11.633 17.633 11.633 18.414 12.414L20 14M14 8H14.01M6 20H18C19.105 20 20 19.105 20 18V6C20 4.895 19.105 4 18 4H6C4.895 4 4 4.895 4 6V18C4 19.105 4.895 20 6 20Z"
                    stroke="#D4AF37"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p
                style={{
                  fontSize: '15px',
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.8)',
                  marginBottom: '6px',
                }}
              >
                上传风格参考图
              </p>
              <p
                style={{
                  fontSize: '13px',
                  color: 'rgba(255, 255, 255, 0.4)',
                }}
              >
                支持 JPG、PNG、MP4，最大 50MB
              </p>
            </div>
          )}

          {/* 提示 */}
          <div
            style={{
              marginTop: '16px',
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'rgba(212, 175, 55, 0.06)',
              border: '1px solid rgba(212, 175, 55, 0.15)',
            }}
          >
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '16px' }}>💡</span>
              <div>
                <p
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'rgba(255, 255, 255, 0.8)',
                    marginBottom: '4px',
                  }}
                >
                  如何选择参考图？
                </p>
                <p
                  style={{
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    lineHeight: '1.6',
                  }}
                >
                  上传一张你喜欢的风格图片，AI 会学习其色调、氛围、构图等特征，并应用到你的内容上
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // 预设风格选择
        <StyleSelector
          selectedStyle={selectedPreset}
          onSelect={onPresetChange}
          contentType={contentType}
        />
      )}
    </div>
  );
}

// 获取预设配置
export function getStylePreset(style: StyleType): StylePreset {
  return STYLE_PRESETS.find((s) => s.id === style) || STYLE_PRESETS[0];
}
