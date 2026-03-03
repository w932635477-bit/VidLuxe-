-- ============================================
-- 添加支付订单表缺失的列
-- 执行方式：在 Supabase SQL Editor 中运行此脚本
-- ============================================

-- 添加 code_url 列（Native 支付二维码链接）
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS code_url TEXT;

-- 添加 pay_type 列（支付类型：jsapi/native）
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS pay_type VARCHAR(32) DEFAULT 'native';

-- 添加 expired_at 列（订单过期时间）
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS expired_at TIMESTAMP WITH TIME ZONE;

-- 添加 transaction_id 列（微信支付交易号）
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(64);

-- 添加索引提升查询性能
CREATE INDEX IF NOT EXISTS idx_orders_expired ON payment_orders(expired_at) WHERE status = 'pending';

-- 更新现有数据（可选）
-- 为已存在的订单设置默认过期时间（创建后2小时）
UPDATE payment_orders
SET expired_at = created_at + INTERVAL '2 hours'
WHERE expired_at IS NULL AND status = 'pending';
