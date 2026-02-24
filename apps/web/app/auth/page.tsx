'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabase = createClient();

  // 发送验证码
  const sendCode = async () => {
    if (countdown > 0 || !phone || phone.length !== 11) return;
    setError(null);
    setSendingCode(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: '+86' + phone,
      });

      if (error) {
        // 友好的错误提示
        if (error.message.includes('Invalid')) {
          setError('手机号格式不正确');
        } else if (error.message.includes('rate')) {
          setError('发送太频繁，请稍后再试');
        } else {
          setError(error.message);
        }
        return;
      }

      setCodeSent(true);
      setSuccess('验证码已发送');
      setCountdown(60);

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError('发送失败，请重试');
    } finally {
      setSendingCode(false);
    }
  };

  // 验证码登录
  const handleLogin = async () => {
    if (!code || code.length < 4) {
      setError('请输入验证码');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: '+86' + phone,
        token: code,
        type: 'sms',
      });

      if (error) {
        if (error.message.includes('Invalid')) {
          setError('验证码错误或已过期');
        } else {
          setError(error.message);
        }
        setLoading(false);
        return;
      }

      // 登录成功，跳转到 dashboard
      router.push('/dashboard');
    } catch (err) {
      setError('登录失败，请重试');
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Link href="/" style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.02em', color: '#fff', textDecoration: 'none' }}>
            VidLuxe
          </Link>
          <p style={{ marginTop: '12px', fontSize: '17px', color: 'rgba(255, 255, 255, 0.5)' }}>
            欢迎回来
          </p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div style={{
            padding: '12px 16px',
            marginBottom: '16px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        {/* 成功提示 */}
        {success && !error && (
          <div style={{
            padding: '12px 16px',
            marginBottom: '16px',
            borderRadius: '12px',
            background: 'rgba(74, 222, 128, 0.1)',
            border: '1px solid rgba(74, 222, 128, 0.3)',
            color: '#4ade80',
            fontSize: '14px',
          }}>
            {success}
          </div>
        )}

        {/* 登录卡片 */}
        <div style={{
          padding: '24px',
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}>
          {/* 手机号输入 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '8px' }}>
                手机号码
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '14px',
                }}>
                  +86
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, '').slice(0, 11));
                    setError(null);
                  }}
                  placeholder="请输入手机号"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '15px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* 验证码输入 */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '8px' }}>
                验证码
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setError(null);
                  }}
                  placeholder="请输入验证码"
                  disabled={loading || !codeSent}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '15px',
                    outline: 'none',
                    opacity: codeSent ? 1 : 0.5,
                  }}
                />
                <button
                  onClick={sendCode}
                  disabled={countdown > 0 || phone.length !== 11 || sendingCode || loading}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: 'none',
                    background: countdown > 0 || phone.length !== 11 || sendingCode
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(212, 175, 55, 0.15)',
                    color: countdown > 0 || phone.length !== 11 || sendingCode
                      ? 'rgba(255, 255, 255, 0.3)'
                      : '#D4AF37',
                    fontSize: '14px',
                    cursor: countdown > 0 || phone.length !== 11 || sendingCode || loading ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    minWidth: '100px',
                  }}
                >
                  {sendingCode ? '发送中...' : countdown > 0 ? `${countdown}s` : '获取验证码'}
                </button>
              </div>
            </div>
          </div>

          {/* 登录按钮 */}
          <button
            onClick={handleLogin}
            disabled={loading || !codeSent}
            style={{
              width: '100%',
              marginTop: '24px',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: loading || !codeSent ? 'rgba(212, 175, 55, 0.3)' : '#D4AF37',
              color: '#000',
              fontSize: '16px',
              fontWeight: 500,
              cursor: loading || !codeSent ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? '登录中...' : '登录'}
          </button>

          {/* 协议提示 */}
          <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: 'rgba(255, 255, 255, 0.35)', lineHeight: 1.6 }}>
            首次登录将自动注册账号
            <br />
            登录即表示同意{' '}
            <Link href="/terms" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>用户协议</Link>
            {' '}和{' '}
            <Link href="/privacy" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>隐私政策</Link>
          </p>
        </div>

        {/* 返回首页 */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Link href="/" style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)', textDecoration: 'none' }}>
            ← 返回首页
          </Link>
        </div>
      </div>
    </main>
  );
}
