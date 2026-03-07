/**
 * MagazineTextOverlay - 杂志大片文字叠加组件
 *
 * 在图片上叠加 VOGUE 风格的英文标题
 * 支持 Canvas 合成下载带文字的图片
 */

'use client';

import { useCallback, useRef, useState } from 'react';

interface MagazineTextOverlayProps {
  imageUrl: string;
  onDownload?: (blob: Blob) => void;
  showDownloadButton?: boolean;
}

export function MagazineTextOverlay({
  imageUrl,
  onDownload,
  showDownloadButton = true,
}: MagazineTextOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // 合成图片并下载
  const handleDownload = useCallback(async () => {
    if (isDownloading) return;

    setIsDownloading(true);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx || !canvas) throw new Error('Canvas context not available');

      // 使用 fetch + blob 方式绕过 CORS 限制
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Failed to fetch image');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      // 加载图片
      const img = new Image();

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = blobUrl;
      });

      // 设置 canvas 尺寸
      canvas.width = img.width;
      canvas.height = img.height;

      // 绘制原图
      ctx.drawImage(img, 0, 0);

      const w = img.width;
      const h = img.height;

      // 顶部品牌标识 "VOGUE"
      ctx.font = `700 ${Math.round(w * 0.08)}px Georgia, "Times New Roman", serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 3;
      ctx.fillText('VOGUE', w / 2, h * 0.05);

      // 副标题
      ctx.font = `400 ${Math.round(w * 0.025)}px Georgia, "Times New Roman", serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.shadowBlur = 4;
      ctx.fillText('FALL ESSENTIALS', w / 2, h * 0.13);

      // 底部主题
      ctx.font = `600 ${Math.round(w * 0.045)}px Georgia, "Times New Roman", serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 10;
      ctx.textBaseline = 'bottom';
      ctx.fillText('THE NEW CLASSICS', w / 2, h * 0.92);

      // 转换为 Blob 并下载
      canvas.toBlob((resultBlob) => {
        if (resultBlob) {
          if (onDownload) {
            onDownload(resultBlob);
          } else {
            const url = URL.createObjectURL(resultBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'vidluxe_magazine.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }
        }
        // 清理临时 blob URL
        URL.revokeObjectURL(blobUrl);
        setIsDownloading(false);
      }, 'image/jpeg', 0.95);
    } catch (error) {
      console.error('[MagazineTextOverlay] Download failed:', error);
      setIsDownloading(false);
    }
  }, [imageUrl, onDownload, isDownloading]);

  return (
    <div style={{ width: '100%' }}>
      {/* 图片区域 */}
      <div style={{ position: 'relative', width: '100%' }}>
        {/* 原图 */}
        <img
          src={imageUrl}
          alt="Magazine cover"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            borderRadius: '16px',
          }}
        />

        {/* 文字叠加层 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '5% 8%',
            pointerEvents: 'none',
            borderRadius: '16px',
            overflow: 'hidden',
          }}
        >
          {/* 顶部区域 */}
          <div style={{ textAlign: 'center', width: '100%' }}>
            <h1
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 'clamp(28px, 8vw, 56px)',
                fontWeight: 700,
                letterSpacing: '0.18em',
                color: '#FFFFFF',
                textShadow: '0 3px 12px rgba(0,0,0,0.4)',
                margin: 0,
                lineHeight: 1,
              }}
            >
              VOGUE
            </h1>
            <p
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 'clamp(10px, 2.5vw, 16px)',
                fontWeight: 400,
                letterSpacing: '0.25em',
                color: 'rgba(255,255,255,0.85)',
                marginTop: '10px',
                textShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }}
            >
              FALL ESSENTIALS
            </p>
          </div>

          {/* 底部主题 */}
          <h2
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 'clamp(16px, 4.5vw, 32px)',
              fontWeight: 600,
              letterSpacing: '0.1em',
              color: '#FFFFFF',
              textShadow: '0 3px 12px rgba(0,0,0,0.4)',
              margin: 0,
              textAlign: 'center',
            }}
          >
            THE NEW CLASSICS
          </h2>
        </div>

        {/* 隐藏的 Canvas */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* 右上角快速下载图标 */}
        {showDownloadButton && (
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.1)',
              cursor: isDownloading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'auto',
            }}
            title="下载杂志大片"
          >
            {isDownloading ? (
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255,255,255,0.2)',
                  borderTopColor: '#D4AF37',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* 底部显眼的下载按钮 */}
      {showDownloadButton && (
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          style={{
            width: '100%',
            padding: '16px',
            marginTop: '16px',
            borderRadius: '12px',
            border: 'none',
            background: isDownloading ? 'rgba(212, 175, 55, 0.6)' : '#D4AF37',
            color: '#000000',
            fontSize: '16px',
            fontWeight: 600,
            textAlign: 'center',
            cursor: isDownloading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {isDownloading ? (
            <>
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid rgba(0,0,0,0.2)',
                  borderTopColor: '#000',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <span>正在下载...</span>
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              <span>下载杂志大片</span>
            </>
          )}
        </button>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default MagazineTextOverlay;
