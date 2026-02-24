'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type AuthMode = 'login' | 'register';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabase = createClient();

  // 登录
  const handleLogin = async () => {
    if (!email || !password) {
      setError('请输入邮箱和密码');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('邮箱或密码错误');
        } else if (error.message.includes('Email not confirmed')) {
          setError('请先验证邮箱（检查收件箱）');
        } else {
          setError(error.message);
        }
        setLoading(false);
        return;
      }

      // 登录成功
      router.push('/dashboard');
    } catch (err) {
      setError('登录失败，请重试');
      setLoading(false);
    }
  };

  // 注册
  const handleRegister = async () => {
    if (!email || !password) {
      setError('请输入邮箱和密码');
      return;
    }

    if (password.length < 6) {
      setError('密码至少需要 6 个字符');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次密码不一致');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          setError('该邮箱已注册，请直接登录');
        } else {
          setError(error.message);
        }
        setLoading(false);
        return;
      }

      // 注册成功，提示用户验证邮箱
      setSuccess('注册成功！请检查邮箱完成验证，然后登录');
      setMode('login');
      setLoading(false);
    } catch (err) {
      setError('注册失败，请重试');
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (mode === 'login') {
      handleLogin();
    } else {
      handleRegister();
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
            {mode === 'login' ? '欢迎回来' : '创建账号'}
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
          {/* 模式切换 */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            <button
              onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                border: 'none',
                background: mode === 'login' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                color: mode === 'login' ? '#D4AF37' : 'rgba(255, 255, 255, 0.5)',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              登录
            </button>
            <button
              onClick={() => { setMode('register'); setError(null); setSuccess(null); }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                border: 'none',
                background: mode === 'register' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                color: mode === 'register' ? '#D4AF37' : 'rgba(255, 255, 255, 0.5)',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              注册
            </button>
          </div>

          {/* 表单 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 邮箱 */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '8px' }}>
                邮箱地址
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="请输入邮箱"
                disabled={loading}
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

            {/* 密码 */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '8px' }}>
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="请输入密码（至少6位）"
                disabled={loading}
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

            {/* 确认密码（仅注册时显示） */}
            {mode === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '8px' }}>
                  确认密码
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                  placeholder="请再次输入密码"
                  disabled={loading}
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
            )}
          </div>

          {/* 提交按钮 */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%',
              marginTop: '24px',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: loading ? 'rgba(212, 175, 55, 0.3)' : '#D4AF37',
              color: '#000',
              fontSize: '16px',
              fontWeight: 500,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            {loading
              ? (mode === 'login' ? '登录中...' : '注册中...')
              : (mode === 'login' ? '登录' : '注册')}
          </button>

          {/* 协议提示 */}
          <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: 'rgba(255, 255, 255, 0.35)', lineHeight: 1.6 }}>
            {mode === 'register' && '注册即表示同意'}
            {mode === 'register' && (
              <>
                {' '}
                <Link href="/terms" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>用户协议</Link>
                {' '}和{' '}
                <Link href="/privacy" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>隐私政策</Link>
              </>
            )}
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
