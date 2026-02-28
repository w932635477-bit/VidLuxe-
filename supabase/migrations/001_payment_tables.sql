-- VidLuxe 支付系统数据库表
-- 执行方式：在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 1. 支付订单表
-- ============================================
CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  out_trade_no VARCHAR(64) UNIQUE NOT NULL,  -- 商户订单号 (VL开头)
  user_id VARCHAR(128) NOT NULL,              -- 用户 ID (匿名ID或Supabase用户ID)
  package_id VARCHAR(32) NOT NULL,            -- 积分包 ID (small/medium/large/xlarge)
  amount INTEGER NOT NULL,                    -- 金额（分）
  credits INTEGER NOT NULL,                   -- 积分数量
  status VARCHAR(32) DEFAULT 'pending',       -- pending/paid/failed/refunded/expired
  code_url TEXT,                              -- 微信支付二维码链接 (Native支付)
  transaction_id VARCHAR(64),                 -- 微信支付交易号
  paid_at TIMESTAMP WITH TIME ZONE,           -- 支付时间
  expired_at TIMESTAMP WITH TIME ZONE,        -- 订单过期时间
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. 支付交易记录表（用于对账）
-- ============================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES payment_orders(id) ON DELETE CASCADE,
  out_trade_no VARCHAR(64) NOT NULL,          -- 商户订单号
  transaction_id VARCHAR(64),                 -- 微信支付交易号
  amount INTEGER NOT NULL,                    -- 支付金额（分）
  status VARCHAR(32) NOT NULL,                -- success/failed
  raw_data JSONB,                             -- 微信回调原始数据
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. 积分余额表（替代 JSON 文件存储）
-- ============================================
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(128) UNIQUE NOT NULL,       -- 用户 ID
  balance INTEGER DEFAULT 0,                  -- 当前余额
  total_earned INTEGER DEFAULT 0,             -- 累计获得
  total_spent INTEGER DEFAULT 0,              -- 累计消耗
  free_credits_used_this_month INTEGER DEFAULT 0,  -- 本月已用免费额度
  free_credits_reset_at TIMESTAMP WITH TIME ZONE,  -- 免费额度重置时间
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. 积分交易流水表
-- ============================================
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(128) NOT NULL,
  amount INTEGER NOT NULL,                    -- 正数=获得，负数=消耗
  type VARCHAR(32) NOT NULL,                  -- purchase/spend/invite_earned/invite_bonus/refund/admin_gift/free
  description TEXT,
  order_id UUID REFERENCES payment_orders(id),  -- 关联订单（如果是购买）
  metadata JSONB,                             -- 额外信息
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. 索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_orders_user ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_trade_no ON payment_orders(out_trade_no);
CREATE INDEX IF NOT EXISTS idx_orders_created ON payment_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_trans_user ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_trans_created ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_credits_user ON user_credits(user_id);

-- ============================================
-- 6. 更新时间触发器
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payment_orders_updated_at
    BEFORE UPDATE ON payment_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_credits_updated_at
    BEFORE UPDATE ON user_credits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. RLS (Row Level Security) 策略
-- ============================================
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的订单
CREATE POLICY "Users can view own orders" ON payment_orders
    FOR SELECT USING (user_id = auth.uid()::text OR user_id LIKE 'anon_%');

-- 用户只能查看自己的积分
CREATE POLICY "Users can view own credits" ON user_credits
    FOR SELECT USING (user_id = auth.uid()::text OR user_id LIKE 'anon_%');

-- 用户只能查看自己的交易记录
CREATE POLICY "Users can view own transactions" ON credit_transactions
    FOR SELECT USING (user_id = auth.uid()::text OR user_id LIKE 'anon_%');
