-- VidLuxe 原子积分操作函数
-- 用于并发安全的积分更新
-- 执行方式：在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 1. 原子增加积分函数
-- ============================================
-- 使用 PostgreSQL 行级锁确保并发安全
CREATE OR REPLACE FUNCTION increment_credits(
  p_user_id VARCHAR(128),
  p_amount INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance INTEGER;
  v_new_total_earned INTEGER;
BEGIN
  -- 使用 FOR UPDATE 锁定行，防止并发更新
  UPDATE user_credits
  SET
    balance = balance + p_amount,
    total_earned = total_earned + p_amount
  WHERE user_id = p_user_id
  RETURNING balance, total_earned INTO v_new_balance, v_new_total_earned;

  -- 如果没有找到用户，创建新记录
  IF NOT FOUND THEN
    INSERT INTO user_credits (user_id, balance, total_earned, total_spent)
    VALUES (p_user_id, p_amount, p_amount, 0)
    RETURNING balance, total_earned INTO v_new_balance, v_new_total_earned;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'balance', v_new_balance,
    'total_earned', v_new_total_earned
  );
END;
$$;

-- ============================================
-- 2. 原子消费积分函数
-- ============================================
CREATE OR REPLACE FUNCTION consume_credits(
  p_user_id VARCHAR(128),
  p_amount INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_new_total_spent INTEGER;
BEGIN
  -- 锁定并获取当前余额
  SELECT balance INTO v_current_balance
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- 检查余额是否足够
  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'user_not_found'
    );
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_balance',
      'current_balance', v_current_balance
    );
  END IF;

  -- 原子更新
  UPDATE user_credits
  SET
    balance = balance - p_amount,
    total_spent = total_spent + p_amount
  WHERE user_id = p_user_id
  RETURNING balance, total_spent INTO v_new_balance, v_new_total_spent;

  RETURN jsonb_build_object(
    'success', true,
    'balance', v_new_balance,
    'total_spent', v_new_total_spent
  );
END;
$$;

-- ============================================
-- 3. 添加 webhook_events 表用于幂等性
-- ============================================
-- 记录已处理的 webhook 事件，防止重复处理
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(128) UNIQUE NOT NULL,  -- 微信事件 ID
  event_type VARCHAR(64) NOT NULL,         -- 事件类型
  out_trade_no VARCHAR(64),                -- 关联订单号
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payload JSONB                            -- 原始事件数据
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_trade_no ON webhook_events(out_trade_no);

-- ============================================
-- 4. 授予执行权限
-- ============================================
-- 允许 anon 和 authenticated 角色执行函数
GRANT EXECUTE ON FUNCTION increment_credits TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION consume_credits TO anon, authenticated, service_role;

-- 允许 service_role 插入 webhook_events
GRANT INSERT ON webhook_events TO service_role;
