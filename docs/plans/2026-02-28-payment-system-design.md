# 微信支付系统设计文档

**创建日期**: 2026-02-28
**状态**: 已完成设计，待实施

---

## 概述

为 VidLuxe 添加微信 Native 支付（扫码支付）功能，支持用户购买积分包。

---

## 技术选型

| 项目 | 选择 |
|------|------|
| 支付场景 | 购买积分包 |
| 支付方式 | Native 支付（扫码） |
| 数据存储 | Supabase PostgreSQL |
| 定价方案 | 29/79/199/499 元 |

---

## 数据库设计

### 表结构

```sql
-- 支付订单表
CREATE TABLE payment_orders (
  id UUID PRIMARY KEY,
  out_trade_no VARCHAR(64) UNIQUE,  -- 商户订单号
  user_id VARCHAR(128) NOT NULL,
  package_id VARCHAR(32) NOT NULL,
  amount INTEGER NOT NULL,          -- 金额（分）
  credits INTEGER NOT NULL,         -- 积分数量
  status VARCHAR(32) DEFAULT 'pending',
  code_url TEXT,                    -- 二维码链接
  transaction_id VARCHAR(64),       -- 微信交易号
  paid_at TIMESTAMP,
  expired_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 积分余额表
CREATE TABLE user_credits (
  id UUID PRIMARY KEY,
  user_id VARCHAR(128) UNIQUE,
  balance INTEGER DEFAULT 0,
  total_earned INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0
);

-- 积分交易流水表
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY,
  user_id VARCHAR(128),
  amount INTEGER,
  type VARCHAR(32),
  description TEXT,
  order_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API 设计

### 端点

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/payment/create` | 创建支付订单 |
| GET | `/api/payment/query` | 查询订单状态 |
| POST | `/api/webhook/wechat` | 微信支付回调 |

### 支付流程

```
1. 用户选择积分包
2. POST /api/payment/create → 返回 code_url
3. 前端展示二维码
4. 用户扫码支付
5. 微信回调 POST /api/webhook/wechat
6. 验证签名，更新订单，发放积分
7. 前端轮询 GET /api/payment/query
8. 支付成功 → 跳转结果页
```

---

## 前端页面

| 路径 | 描述 |
|------|------|
| `/pricing` | 定价页面（选择积分包）|
| `/payment/checkout?orderId=xxx` | 支付页面（二维码）|
| `/payment/result?status=xxx` | 支付结果页 |

---

## 积分包定价

| ID | 名称 | 额度 | 价格 |
|----|------|------|------|
| small | 尝鲜包 | 10次 | ¥29 |
| medium | 标准包 | 30次 | ¥79 |
| large | 超值包 | 100次 | ¥199 |
| xlarge | 专业包 | 300次 | ¥499 |

---

## 配置项

需要在 `.env.local` 中配置：

```bash
WECHAT_PAY_APP_ID=      # 微信公众号/小程序 AppID
WECHAT_PAY_MCH_ID=      # 商户号
WECHAT_PAY_API_KEY=     # API 密钥 (v2)
WECHAT_PAY_NOTIFY_URL=https://vidluxe.com/api/webhook/wechat
```

---

## 文件清单

### 新建文件

- `supabase/migrations/001_payment_tables.sql` - 数据库迁移
- `lib/payment/service.ts` - 支付服务
- `app/api/payment/create/route.ts` - 创建订单 API
- `app/api/payment/query/route.ts` - 查询订单 API
- `app/api/webhook/wechat/route.ts` - 微信回调 API
- `app/payment/checkout/page.tsx` - 支付页面
- `app/payment/result/page.tsx` - 结果页面

### 修改文件

- `lib/wechat-pay/client.ts` - 添加 Native 支付支持

---

## 待办事项

1. [ ] 在 Supabase 中执行数据库迁移
2. [ ] 申请微信支付商户号
3. [ ] 配置微信支付环境变量
4. [ ] 更新 pricing 页面的购买按钮逻辑
5. [ ] 测试支付流程
