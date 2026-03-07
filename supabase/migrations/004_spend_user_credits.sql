-- VidLuxe 用户额度消费函数
-- 统一使用 user_credits 表，支持付费额度 + 免费额度

-- ============================================
-- 1. 消费用户额度函数
-- ============================================
-- 先消耗付费额度，再消耗免费额度
-- 返回 JSONB 格式: {success, error?, balance, free_remaining}
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
BEGIN
  -- 获取当前余额和已用免费额度
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
    free_credits_used_this_month = free_credits_used_this_month + v_free_to_spend
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;

  -- 记录交易流水（使用 task_id 而非 metadata）
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
-- 2. 退回用户额度函数
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
  -- 更新余额
  UPDATE user_credits
  SET
    balance = balance + p_amount,
    total_earned = total_earned + p_amount
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
-- 3. 授予执行权限
-- ============================================
GRANT EXECUTE ON FUNCTION spend_user_credits TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION refund_user_credits TO anon, authenticated, service_role;
