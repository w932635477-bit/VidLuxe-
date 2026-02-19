'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type LoginMethod = 'phone' | 'wechat' | 'email';

export default function AuthPage() {
  const router = useRouter();
  const [method, setMethod] = useState<LoginMethod>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  // 发送验证码
  const sendCode = async () => {
    if (countdown > 0 || !phone || phone.length !== 11) return;

    setCodeSent(true);
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
  };

  // 登录
  const handleLogin = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <main style={{ minHeight: '100vh', background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Link href="/" style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.02em' }}>
            VidLuxe
          </Link>
          <p style={{ marginTop: '12px', fontSize: '17px', color: 'rgba(255, 255, 255, 0.5)' }}>
            欢迎回来
          </p>
        </div>

        {/* 登录卡片 */}
        <div style={{
          padding: '24px',
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}>
          {/* 登录方式切换 - Apple 风格药丸 */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {[
              { id: 'phone' as LoginMethod, label: '手机', icon: '📱' },
              { id: 'wechat' as LoginMethod, label: '微信', icon: '💬' },
              { id: 'email' as LoginMethod, label: '邮箱', icon: '📧' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setMethod(item.id)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  background: method === item.id ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: method === item.id ? '#D4AF37' : 'rgba(255, 255, 255, 0.5)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>

          {/* 手机号登录表单 */}
          {method === 'phone' && (
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
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    placeholder="请输入手机号"
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

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '8px' }}>
                  验证码
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="请输入验证码"
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
                  <button
                    onClick={sendCode}
                    disabled={countdown > 0 || phone.length !== 11}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: 'none',
                      background: countdown > 0 || phone.length !== 11
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(212, 175, 55, 0.15)',
                      color: countdown > 0 || phone.length !== 11
                        ? 'rgba(255, 255, 255, 0.3)'
                        : '#D4AF37',
                      fontSize: '14px',
                      cursor: countdown > 0 || phone.length !== 11 ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 微信登录 */}
          {method === 'wechat' && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{
                display: 'inline-block',
                padding: '16px',
                background: '#fff',
                borderRadius: '16px',
                marginBottom: '16px',
              }}>
                <div style={{
                  width: '180px',
                  height: '180px',
                  background: 'linear-gradient(135deg, #f0f0f0, #e0e0e0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                  fontSize: '14px',
                }}>
                  微信扫码登录
                </div>
              </div>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)' }}>
                打开微信扫一扫，快速登录
              </p>
            </div>
          )}

          {/* 邮箱登录 */}
          {method === 'email' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '8px' }}>
                  邮箱地址
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入邮箱"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '8px' }}>
                  密码
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ textAlign: 'right' }}>
                <Link href="#" style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>
                  忘记密码？
                </Link>
              </div>
            </div>
          )}

          {/* 登录按钮 */}
          {method !== 'wechat' && (
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                width: '100%',
                marginTop: '24px',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                background: '#D4AF37',
                color: '#000',
                fontSize: '16px',
                fontWeight: 500,
                cursor: loading ? 'wait' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? '登录中...' : '登录'}
            </button>
          )}

          {/* 协议提示 */}
          <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: 'rgba(255, 255, 255, 0.35)', lineHeight: 1.6 }}>
            首次登录将自动注册账号
            <br />
            登录即表示同意{' '}
            <Link href="#" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>用户协议</Link>
            {' '}和{' '}
            <Link href="#" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>隐私政策</Link>
          </p>
        </div>

        {/* 返回首页 */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Link href="/" style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)' }}>
            ← 返回首页
          </Link>
        </div>
      </div>
    </main>
  );
}
