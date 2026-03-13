'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';

export default function EmailVerificationBanner() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    checkVerificationStatus();

    // 检查是否刚完成验证
    if (searchParams.get('verified') === 'success') {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [searchParams]);

  const checkVerificationStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const verified = !!user.email_confirmed_at;
        setIsVerified(verified);
        setShow(!verified); // 只在未验证时显示
      }
    } catch (error) {
      console.error('Check verification error:', error);
    }
  };

  const handleSendVerification = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ 验证邮件已发送！请检查收件箱');
        setTimeout(() => setMessage(''), 5000);
      } else {
        setMessage(`❌ ${data.error || '发送失败'}`);
      }
    } catch (error) {
      setMessage('❌ 发送失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 验证成功提示
  if (showSuccess) {
    return (
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        maxWidth: '500px',
        width: '90%',
      }}>
        <div style={{
          padding: '16px 24px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
          color: '#fff',
          boxShadow: '0 10px 40px rgba(74, 222, 128, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'slideDown 0.3s ease-out',
        }}>
          <span style={{ fontSize: '24px' }}>🎉</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>
              邮箱验证成功！
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              已获得 5 次免费额度奖励
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 未验证提示
  if (!show) return null;

  return (
    <>
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>

      <div style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        maxWidth: '600px',
        width: '90%',
      }}>
        <div style={{
          padding: '16px 24px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        }}>
          {/* 图标 */}
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(212, 175, 55, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            flexShrink: 0,
          }}>
            📧
          </div>

          {/* 内容 */}
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '15px',
              fontWeight: 500,
              color: '#D4AF37',
              marginBottom: '4px',
            }}>
              验证邮箱，获得 5 次免费额度 🎁
            </div>
            <div style={{
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.6)',
            }}>
              验证后可以找回密码，还能获得额外奖励
            </div>
            {message && (
              <div style={{
                marginTop: '8px',
                fontSize: '13px',
                color: message.startsWith('✅') ? '#4ade80' : '#ef4444',
              }}>
                {message}
              </div>
            )}
          </div>

          {/* 按钮 */}
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={handleSendVerification}
              disabled={loading}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: loading ? 'rgba(212, 175, 55, 0.3)' : '#D4AF37',
                color: '#000',
                fontSize: '14px',
                fontWeight: 500,
                cursor: loading ? 'wait' : 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
            >
              {loading ? '发送中...' : '发送验证邮件'}
            </button>

            <button
              onClick={() => setShow(false)}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
