/**
 * 上传界面组件
 *
 * 处理文件上传和拖拽上传
 */

'use client';

interface UploadSectionProps {
  isLoading: boolean;
  onFileChange: (file: File) => void;
  onDrop: (e: React.DragEvent) => void;
  onMultipleFiles?: (files: File[]) => void;
  allowMultiple?: boolean;
}

export function UploadSection({
  isLoading,
  onFileChange,
  onDrop,
  onMultipleFiles,
  allowMultiple = false,
}: UploadSectionProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 24px',
      }}
    >
      {/* 标题 */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1
          style={{
            fontSize: '48px',
            fontWeight: 600,
            letterSpacing: '-0.03em',
            marginBottom: '16px',
          }}
        >
          让普通素材变爆款
        </h1>
        <p
          style={{
            fontSize: '21px',
            color: 'rgba(255, 255, 255, 0.5)',
            maxWidth: '400px',
          }}
        >
          光线差、背景乱？一键提升高级感
        </p>
      </div>

      {/* 上传区 */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !isLoading && document.getElementById('file-input')?.click()}
        style={{
          width: '100%',
          maxWidth: '480px',
          aspectRatio: '4/3',
          borderRadius: '24px',
          border: '2px dashed rgba(255, 255, 255, 0.15)',
          background: 'rgba(255, 255, 255, 0.02)',
          cursor: isLoading ? 'wait' : 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          opacity: isLoading ? 0.6 : 1,
        }}
      >
        <input
          id="file-input"
          type="file"
          accept="image/*,video/*"
          multiple={allowMultiple}
          style={{ display: 'none' }}
          onChange={(e) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;

            if (allowMultiple && files.length > 1 && onMultipleFiles) {
              onMultipleFiles(Array.from(files));
            } else {
              onFileChange(files[0]);
            }
          }}
          disabled={isLoading}
        />

        {isLoading ? (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(255,255,255,0.1)',
                borderTopColor: '#D4AF37',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px',
              }}
            />
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>上传中...</p>
          </div>
        ) : (
          <>
            <div
              style={{
                width: '80px',
                height: '80px',
                marginBottom: '24px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.4 }}>
                <path
                  d="M12 16V4M12 4L8 8M12 4L16 8M4 16V18C4 19.1 4.9 20 6 20H18C19.1 20 20 19.1 20 18V16"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p style={{ fontSize: '21px', fontWeight: 500, marginBottom: '8px' }}>
              拖入你的原片或视频{allowMultiple ? '（可多选）' : ''}
            </p>
            <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '16px' }}>
              图片或视频
            </p>
            <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.35)' }}>
              <span>JPG / PNG 最大 10MB</span>
              <span>·</span>
              <span>MP4 / MOV 最大 500MB</span>
            </div>
          </>
        )}
      </div>

      {/* 小贴士 */}
      <div
        style={{
          marginTop: '32px',
          padding: '16px 20px',
          borderRadius: '12px',
          background: 'rgba(212, 175, 55, 0.06)',
          border: '1px solid rgba(212, 175, 55, 0.12)',
          maxWidth: '480px',
          width: '100%',
        }}
      >
        <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
          💡 {allowMultiple
            ? '建议上传：穿搭 / 美妆 / 探店 / 生活方式，最多9张图片'
            : '建议上传：穿搭 / 美妆 / 探店 / 生活方式，原图效果更佳'
          }
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
