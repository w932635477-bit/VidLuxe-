-- VidLuxe 额度系统幂等性增强
-- 添加 task_id 唯一约束，防止重复扣费

-- ============================================
-- 1. 添加 task_id 唯一约束（部分索引，只对非 null 值）
-- ============================================
-- 注意：PostgreSQL 不支持带条件的唯一约束，使用部分索引

CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_transactions_task_id
ON credit_transactions (task_id)
WHERE task_id IS NOT NULL;

-- ============================================
-- 2. 修改 spend_user_credits 函数，添加幂等性检查
-- ============================================
CREATE OR REPLACE FUNCTION spend_user_credits(
  p_user_id VARCHAR(128),
  p_amount INTEGER,
  p_description TEXT DEFAULT '生成图片',
  p_task_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance INTEGER;
  v_free_used INTEGER;
  v_free_limit INTEGER := 8;
  v_total_available INTEGER;
  v_new_balance INTEGER;
  v_new_free_used INTEGER;
  v_paid_to_spend INTEGER;
  v_free_to_spend INTEGER;
  v_existing_tx_id INTEGER;
BEGIN
  -- 幂等性检查：如果 task_id 已存在，返回已处理状态
  IF p_task_id IS NOT NULL THEN
    SELECT id INTO v_existing_tx_id
    FROM credit_transactions
    WHERE task_id = p_task_id AND user_id = p_user_id
    LIMIT 1;

    IF v_existing_tx_id IS NOT NULL THEN
      -- 返回当前余额，标记为已处理
      SELECT balance INTO v_balance
      FROM user_credits
      WHERE user_id = p_user_id;

      RETURN jsonb_build_object(
        'success', true,
        'already_processed', true,
        'message', 'Transaction already processed',
        'balance', COALESCE(v_balance, 0),
        'free_remaining', v_free_limit
      );
    END IF;
  END IF;

  -- 获取当前余额和已用免费额度（带行级锁）
  SELECT balance, COALESCE(free_credits_used_this_month, 0)
  INTO v_balance, v_free_used
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- 如果用户不存在，创建新记录
  IF v_balance IS NULL THEN
    INSERT INTO user_credits (user_id, balance, total_earned, total_spent, free_credits_used_this_month)
    VALUES (p_user_id, 0, 0, 0, 0);
    v_balance := 0;
    v_free_used := 0;
  END IF;

  -- 计算可用额度（付费额度 + 剩余免费额度）
  v_total_available := v_balance + GREATEST(0, v_free_limit - v_free_used);

  -- 检查额度是否足够
  IF v_total_available < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_balance',
      'balance', v_balance,
      'free_remaining', GREATEST(0, v_free_limit - v_free_used)
    );
  END IF;

  -- 计算消耗顺序：先付费，后免费
  IF v_balance >= p_amount THEN
    v_paid_to_spend := p_amount;
    v_free_to_spend := 0;
  ELSE
    v_paid_to_spend := v_balance;
    v_free_to_spend := p_amount - v_balance;
  END IF;

  -- 更新 user_credits 表
  UPDATE user_credits
  SET
    balance = balance - v_paid_to_spend,
    total_spent = total_spent + v_paid_to_spend,
    free_credits_used_this_month = free_credits_used_this_month + v_free_to_spend,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;

  -- 记录交易流水（包含 task_id）
  INSERT INTO credit_transactions (user_id, amount, type, description, task_id)
  VALUES (p_user_id, -p_amount, 'spend', p_description, p_task_id);

  -- 计算新的免费额度剩余
  v_new_free_used := v_free_used + v_free_to_spend;

  RETURN jsonb_build_object(
    'success', true,
    'balance', v_new_balance,
    'free_remaining', GREATEST(0, v_free_limit - v_new_free_used),
    'paid_spent', v_paid_to_spend,
    'free_spent', v_free_to_spend
  );
END;
$$;

-- ============================================
-- 3. 修改 refund_user_credits 函数，添加行级锁
-- ============================================
CREATE OR REPLACE FUNCTION refund_user_credits(
  p_user_id VARCHAR(128),
  p_amount INTEGER,
  p_description TEXT DEFAULT '退回额度',
  p_original_type VARCHAR(32) DEFAULT 'spend'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance INTEGER;
  v_new_total_earned INTEGER;
BEGIN
  -- 使用行级锁更新余额
  UPDATE user_credits
  SET
    balance = balance + p_amount,
    total_earned = total_earned + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING balance, total_earned INTO v_new_balance, v_new_total_earned;

  -- 如果用户不存在，创建新记录
  IF v_new_balance IS NULL THEN
    INSERT INTO user_credits (user_id, balance, total_earned, total_spent)
    VALUES (p_user_id, p_amount, p_amount, 0)
    RETURNING balance, total_earned INTO v_new_balance, v_new_total_earned;
  END IF;

  -- 记录交易流水
  INSERT INTO credit_transactions (user_id, amount, type, description)
  VALUES (p_user_id, p_amount, 'refund', p_description);

  RETURN jsonb_build_object(
    'success', true,
    'balance', v_new_balance,
    'total_earned', v_new_total_earned
  );
END;
$$;

-- ============================================
-- 4. 添加审计字段到 credit_transactions 表
-- ============================================
ALTER TABLE credit_transactions
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45),
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS request_id VARCHAR(64);

-- ============================================
-- 5. 授予执行权限
-- ============================================
GRANT EXECUTE ON FUNCTION spend_user_credits TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION refund_user_credits TO anon, authenticated, service_role;

-- ============================================
-- 注释
-- ============================================
COMMENT ON FUNCTION spend_user_credits IS '安全增强版：支持 task_id 幂等性检查';
COMMENT ON FUNCTION refund_user_credits IS '安全增强版：添加行级锁防止并发问题';
COMMENT ON INDEX idx_credit_transactions_task_id IS '用于 task_id 幂等性检查的部分唯一索引';
