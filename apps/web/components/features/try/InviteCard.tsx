/**
 * InviteCard - 邀请码卡片
 *
 * 展示用户的邀请码和填写邀请码入口，引导用户邀请好友
 * Apple Design 风格优化版
 */

'use client';

import { useState, useCallback, useEffect } from 'react';

interface InviteCardProps {
  anonymousId: string;
  onCreditsUpdate?: () => void;
  compact?: boolean;
}

export function InviteCard({ anonymousId, onCreditsUpdate, compact = false }: InviteCardProps) {
  const [myInviteCode, setMyInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [inviteApplied, setInviteApplied] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [hasUsedInviteCode, setHasUsedInviteCode] = useState(false);

  useEffect(() => {
    if (anonymousId) {
      fetch(`/api/invite?anonymousId=${encodeURIComponent(anonymousId)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data?.code) {
            setMyInviteCode(data.data.code);
          }
        })
        .catch(err => console.error('Failed to fetch invite code:', err));

      fetch(`/api/credits?anonymousId=${encodeURIComponent(anonymousId)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data?.hasUsedInviteCode !== undefined) {
            setHasUsedInviteCode(data.data.hasUsedInviteCode);
          }
        })
        .catch(err => console.error('Failed to check invite status:', err));
    }
  }, [anonymousId]);

  const handleCopyInviteLink = useCallback(() => {
    if (!myInviteCode) return;
    const inviteUrl = `${window.location.origin}/try?invite=${myInviteCode}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [myInviteCode]);

  const handleApplyInviteCode = useCallback(async () => {
    if (!inviteCodeInput || inviteCodeInput.length !== 6 || inviteLoading || !anonymousId) return;

    setInviteLoading(true);
    setInviteError(null);

    try {
      const response = await fetch(`/api/invite/${inviteCodeInput.toUpperCase()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anonymousId }),
      });

      const data = await response.json();

      if (data.success) {
        setInviteApplied(true);
        setHasUsedInviteCode(true);
        onCreditsUpdate?.();
      } else {
        setInviteError(data.error || '邀请码兑换失败');
      }
    } catch {
      setInviteError('网络错误，请重试');
    } finally {
      setInviteLoading(false);
    }
  }, [inviteCodeInput, inviteLoading, anonymousId, onCreditsUpdate]);

  const showInviteInput = !hasUsedInviteCode && !inviteApplied;

  // 紧凑模式
  if (compact) {
    return (
      <div style={{
        padding: '12px 16px',
        borderRadius: '14px',
        background: 'rgba(52, 199, 89, 0.06)',
        border: '0.5px solid rgba(52, 199, 89, 0.12)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          {myInviteCode && (
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)', marginBottom: '4px', letterSpacing: '0.02em' }}>我的邀请码</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#34C759',
                  letterSpacing: '0.08em',
                  fontVariantNumeric: 'tabular-nums'
                }}>
                  {myInviteCode}
                </span>
                <button
                  onClick={handleCopyInviteLink}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '8px',
                    border: '0.5px solid rgba(52, 199, 89, 0.25)',
                    background: copied ? 'rgba(52, 199, 89, 0.15)' : 'rgba(52, 199, 89, 0.08)',
                    color: copied ? '#34C759' : 'rgba(255, 255, 255, 0.75)',
                    fontSize: '11px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
                  }}
                >
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
            </div>
          )}

          {showInviteInput && (
            <div style={{ flex: 1, textAlign: 'right' }}>
              <p style={{ fontSize: '11px', color: '#34C759', marginBottom: '4px', fontWeight: '500' }}>输入邀请码 +5</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                <input
                  type="text"
                  value={inviteCodeInput}
                  onChange={(e) => { setInviteCodeInput(e.target.value.toUpperCase()); setInviteError(null); }}
                  placeholder="6位码"
                  maxLength={6}
                  style={{
                    width: '68px',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '0.5px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontVariantNumeric: 'tabular-nums',
                    transition: 'all 200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
                  }}
                />
                <button
                  onClick={handleApplyInviteCode}
                  disabled={!inviteCodeInput || inviteCodeInput.length !== 6 || inviteLoading}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: inviteCodeInput?.length === 6 ? '#34C759' : 'rgba(255, 255, 255, 0.06)',
                    color: inviteCodeInput?.length === 6 ? '#000' : 'rgba(255, 255, 255, 0.3)',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: inviteCodeInput?.length === 6 ? 'pointer' : 'default',
                    transition: 'all 200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
                  }}
                >
                  {inviteLoading ? '...' : '兑换'}
                </button>
              </div>
              {inviteError && <p style={{ fontSize: '10px', color: '#FF3B30', marginTop: '4px' }}>{inviteError}</p>}
            </div>
          )}

          {!showInviteInput && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>✓ 已使用邀请码</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 完整模式
  return (
    <div style={{
      padding: '20px',
      borderRadius: '18px',
      background: 'linear-gradient(145deg, rgba(52, 199, 89, 0.08) 0%, rgba(52, 199, 89, 0.02) 100%)',
      border: '0.5px solid rgba(52, 199, 89, 0.15)',
    }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'linear-gradient(145deg, #34C759 0%, #2DB84E 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(52, 199, 89, 0.3)',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div>
          <p style={{ fontSize: '15px', fontWeight: '600', color: 'white', letterSpacing: '-0.01em' }}>邀请好友，双方各得 5 额度</p>
          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '2px' }}>分享你的专属邀请码给好友</p>
        </div>
      </div>

      {/* 我的邀请码 */}
      {myInviteCode && (
        <div style={{
          padding: '16px',
          borderRadius: '14px',
          background: 'rgba(0, 0, 0, 0.24)',
          marginBottom: '16px',
        }}>
          <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)', marginBottom: '10px', letterSpacing: '0.02em' }}>我的邀请码</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              fontSize: '22px',
              fontWeight: '700',
              color: '#34C759',
              letterSpacing: '0.2em',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {myInviteCode}
            </span>
            <button
              onClick={handleCopyInviteLink}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                border: 'none',
                background: copied ? '#34C759' : 'linear-gradient(145deg, #34C759 0%, #2DB84E 100%)',
                color: '#000',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
                boxShadow: copied ? 'none' : '0 2px 8px rgba(52, 199, 89, 0.3)',
              }}
            >
              {copied ? (
                <>已复制</>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  复制链接
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 填写邀请码 */}
      {showInviteInput && (
        <div style={{
          padding: '16px',
          borderRadius: '14px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '0.5px dashed rgba(255, 255, 255, 0.1)',
        }}>
          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '12px' }}>
            有好友邀请码？输入后双方各得 <span style={{ color: '#34C759', fontWeight: '600' }}>+5 额度</span>
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={inviteCodeInput}
              onChange={(e) => { setInviteCodeInput(e.target.value.toUpperCase()); setInviteError(null); }}
              placeholder="输入 6 位邀请码"
              maxLength={6}
              style={{
                flex: 1,
                padding: '14px 16px',
                borderRadius: '12px',
                border: '0.5px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.04)',
                color: 'white',
                fontSize: '15px',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                fontVariantNumeric: 'tabular-nums',
                outline: 'none',
                transition: 'all 200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
              }}
            />
            <button
              onClick={handleApplyInviteCode}
              disabled={!inviteCodeInput || inviteCodeInput.length !== 6 || inviteLoading}
              style={{
                padding: '14px 22px',
                borderRadius: '12px',
                border: 'none',
                background: inviteLoading ? 'rgba(255, 255, 255, 0.08)' : inviteCodeInput?.length === 6 ? '#34C759' : 'rgba(255, 255, 255, 0.06)',
                color: inviteLoading ? 'rgba(255, 255, 255, 0.45)' : inviteCodeInput?.length === 6 ? '#000' : 'rgba(255, 255, 255, 0.3)',
                fontSize: '14px',
                fontWeight: '600',
                cursor: inviteCodeInput?.length === 6 ? 'pointer' : 'default',
                transition: 'all 200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
              }}
            >
              {inviteLoading ? '兑换中...' : '兑换'}
            </button>
          </div>
          {inviteError && (
            <p style={{ fontSize: '12px', color: '#FF3B30', marginTop: '10px' }}>{inviteError}</p>
          )}
        </div>
      )}

      {/* 已使用邀请码提示 */}
      {!showInviteInput && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '12px',
          background: 'rgba(52, 199, 89, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ color: '#34C759', fontSize: '14px' }}>✓</span>
          <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>已使用邀请码，获得 5 额度奖励</span>
        </div>
      )}

      {/* 说明文字 */}
      <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {[
          { emoji: '↑', text: '复制链接发给好友' },
          { emoji: '★', text: '好友注册各得 5 额度' },
          { emoji: '∞', text: '邀请数量无上限' },
        ].map((item, i) => (
          <div key={i} style={{
            padding: '12px 8px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.02)',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '18px', marginBottom: '4px', opacity: 0.8 }}>{item.emoji}</p>
            <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)', lineHeight: 1.4 }}>{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default InviteCard;
