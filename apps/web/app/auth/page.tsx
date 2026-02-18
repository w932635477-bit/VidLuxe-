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

    // 模拟登录
    setTimeout(() => {
      setLoading(false);
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-display font-bold tracking-tight">
              VID<span className="text-brand-500">★</span>LUXE
            </span>
          </Link>
          <p className="text-content-secondary mt-4">欢迎回来</p>
        </div>

        {/* 登录卡片 */}
        <div className="glass-card">
          <div className="glass-card-inner">
            {/* 登录方式切换 */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setMethod('phone')}
                className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                  method === 'phone'
                    ? 'bg-brand-500/20 text-brand-500'
                    : 'bg-white/5 text-content-secondary hover:bg-white/10'
                }`}
              >
                📱 手机号
              </button>
              <button
                onClick={() => setMethod('wechat')}
                className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                  method === 'wechat'
                    ? 'bg-brand-500/20 text-brand-500'
                    : 'bg-white/5 text-content-secondary hover:bg-white/10'
                }`}
              >
                💬 微信
              </button>
              <button
                onClick={() => setMethod('email')}
                className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                  method === 'email'
                    ? 'bg-brand-500/20 text-brand-500'
                    : 'bg-white/5 text-content-secondary hover:bg-white/10'
                }`}
              >
                📧 邮箱
              </button>
            </div>

            {/* 手机号登录表单 */}
            {method === 'phone' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-content-secondary mb-2">手机号码</label>
                  <div className="flex gap-2">
                    <span className="flex items-center px-3 py-3 rounded-lg bg-white/5 text-content-secondary text-sm">
                      +86
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      placeholder="请输入手机号"
                      className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-content-primary placeholder:text-content-tertiary focus:outline-none focus:border-brand-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-content-secondary mb-2">验证码</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="请输入验证码"
                      className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-content-primary placeholder:text-content-tertiary focus:outline-none focus:border-brand-500/50"
                    />
                    <button
                      onClick={sendCode}
                      disabled={countdown > 0 || phone.length !== 11}
                      className={`px-4 py-3 rounded-lg text-sm whitespace-nowrap transition-colors ${
                        countdown > 0 || phone.length !== 11
                          ? 'bg-white/5 text-content-tertiary cursor-not-allowed'
                          : 'bg-brand-500/20 text-brand-500 hover:bg-brand-500/30'
                      }`}
                    >
                      {countdown > 0 ? `${countdown}s` : '获取验证码'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 微信登录 */}
            {method === 'wechat' && (
              <div className="text-center py-8">
                <div className="inline-block p-4 bg-white rounded-2xl mb-4">
                  {/* 微信二维码占位 */}
                  <div className="w-48 h-48 bg-gray-100 flex items-center justify-center text-gray-400">
                    微信扫码登录
                  </div>
                </div>
                <p className="text-sm text-content-secondary">
                  打开微信扫一扫，快速登录
                </p>
              </div>
            )}

            {/* 邮箱登录 */}
            {method === 'email' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-content-secondary mb-2">邮箱地址</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="请输入邮箱"
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-content-primary placeholder:text-content-tertiary focus:outline-none focus:border-brand-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm text-content-secondary mb-2">密码</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-content-primary placeholder:text-content-tertiary focus:outline-none focus:border-brand-500/50"
                  />
                </div>

                <div className="text-right">
                  <Link href="#" className="text-sm text-brand-500 hover:text-brand-400">
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
                className="w-full mt-6 btn-gold py-3 text-center disabled:opacity-50"
              >
                {loading ? '登录中...' : '登录'}
              </button>
            )}

            {/* 协议提示 */}
            <p className="mt-6 text-center text-xs text-content-tertiary">
              首次登录将自动注册账号
              <br />
              登录即表示同意{' '}
              <Link href="#" className="text-content-secondary hover:text-content-primary">
                用户协议
              </Link>{' '}
              和{' '}
              <Link href="#" className="text-content-secondary hover:text-content-primary">
                隐私政策
              </Link>
            </p>
          </div>
        </div>

        {/* 返回首页 */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-content-secondary hover:text-content-primary">
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
