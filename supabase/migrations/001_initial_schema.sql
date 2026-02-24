-- ============================================
-- VidLuxe 数据库初始化脚本
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================

-- ============================================
-- 1. 用户资料表（扩展 auth.users）
-- ============================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,

  -- 基础信息
  phone text unique,
  email text unique,
  wechat_openid text unique,
  wechat_unionid text unique,
  nickname text,
  avatar_url text,

  -- 额度相关
  credits_balance int default 0,
  total_credits_earned int default 0,
  total_credits_spent int default 0,
  free_credits_used_this_month int default 0,
  free_credits_reset_at timestamptz,

  -- 邀请相关
  invite_code text unique default gen_random_uuid(),
  invited_by uuid references public.profiles(id),

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 启用行级安全策略
alter table public.profiles enable row level security;

-- 用户只能查看自己的资料
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- 用户只能更新自己的资料
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ============================================
-- 2. 额度交易记录表
-- ============================================
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,

  amount int not null,               -- 正数=获得，负数=消耗
  type text not null,                -- purchase/invite_earned/invite_bonus/free/spend
  description text,

  -- 关联信息
  package_id text,
  order_id uuid,
  invite_code text,
  task_id text,                      -- 消耗时的任务 ID

  expires_at timestamptz,            -- 过期时间（邀请额度）
  created_at timestamptz default now(),

  constraint valid_type check (type in ('purchase', 'invite_earned', 'invite_bonus', 'free', 'spend'))
);

-- 启用行级安全策略
alter table public.credit_transactions enable row level security;

-- 用户只能查看自己的交易记录
create policy "Users can view own transactions"
  on public.credit_transactions for select
  using (auth.uid() = user_id);

-- ============================================
-- 3. 支付订单表
-- ============================================
create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,

  -- 订单信息
  package_id text not null,
  amount int not null,               -- 金额（分）
  credits int not null,              -- 购买的额度数量

  -- 微信支付信息
  wechat_prepay_id text,
  wechat_out_trade_no text unique,

  -- 状态
  status text default 'pending',

  created_at timestamptz default now(),
  paid_at timestamptz,

  constraint valid_status check (status in ('pending', 'paid', 'failed', 'refunded'))
);

-- 启用行级安全策略
alter table public.payment_orders enable row level security;

-- 用户只能查看自己的订单
create policy "Users can view own orders"
  on public.payment_orders for select
  using (auth.uid() = user_id);

-- ============================================
-- 4. 支付回调日志表
-- ============================================
create table if not exists public.payment_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.payment_orders(id),
  provider text not null,            -- wechat/alipay
  raw_data jsonb,
  processed_at timestamptz default now()
);

-- ============================================
-- 5. 触发器：自动创建用户资料
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, phone, email)
  values (new.id, new.phone, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- 删除已存在的触发器（如果有）
drop trigger if exists on_auth_user_created on auth.users;

-- 创建触发器
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- 6. 函数：增加用户额度
-- ============================================
create or replace function public.add_credits(
  p_user_id uuid,
  p_amount int,
  p_transaction_type text,
  p_description text,
  p_order_id uuid default null,
  p_package_id text default null
)
returns void as $$
begin
  -- 更新用户余额
  update public.profiles
  set
    credits_balance = credits_balance + p_amount,
    total_credits_earned = total_credits_earned + p_amount,
    updated_at = now()
  where id = p_user_id;

  -- 记录交易
  insert into public.credit_transactions (
    user_id,
    amount,
    type,
    description,
    order_id,
    package_id
  ) values (
    p_user_id,
    p_amount,
    p_transaction_type,
    p_description,
    p_order_id,
    p_package_id
  );
end;
$$ language plpgsql security definer;

-- ============================================
-- 7. 函数：消耗用户额度
-- ============================================
create or replace function public.spend_credits(
  p_user_id uuid,
  p_amount int,
  p_description text,
  p_task_id text default null
)
returns int as $$
declare
  v_balance int;
  v_free_used int;
  v_free_limit int := 3;
  v_total_available int;
  v_new_balance int;
begin
  -- 获取当前余额
  select credits_balance, free_credits_used_this_month into v_balance, v_free_used
  from public.profiles where id = p_user_id;

  -- 计算可用额度（付费额度 + 免费额度）
  v_total_available := v_balance + greatest(0, v_free_limit - v_free_used);

  -- 检查额度是否足够
  if v_total_available < p_amount then
    raise exception '额度不足';
  end if;

  -- 消耗额度（先消耗付费，再消耗免费）
  v_new_balance := v_balance;
  if v_balance >= p_amount then
    -- 付费额度足够
    v_new_balance := v_balance - p_amount;
  else
    -- 付费额度不够，需要消耗免费额度
    declare
      v_remaining int := p_amount - v_balance;
    begin
      v_new_balance := 0;
      update public.profiles
      set free_credits_used_this_month = free_credits_used_this_month + v_remaining
      where id = p_user_id;
    end;
  end if;

  -- 更新余额
  update public.profiles
  set
    credits_balance = v_new_balance,
    total_credits_spent = total_credits_spent + p_amount,
    updated_at = now()
  where id = p_user_id;

  -- 记录交易
  insert into public.credit_transactions (
    user_id,
    amount,
    type,
    description,
    task_id
  ) values (
    p_user_id,
    -p_amount,
    'spend',
    p_description,
    p_task_id
  );

  -- 返回新余额
  return v_new_balance + greatest(0, v_free_limit - (select free_credits_used_this_month from public.profiles where id = p_user_id));
end;
$$ language plpgsql security definer;

-- ============================================
-- 8. 函数：获取用户可用额度
-- ============================================
create or replace function public.get_available_credits(p_user_id uuid)
returns json as $$
declare
  v_balance int;
  v_free_used int;
  v_free_limit int := 3;
  v_free_remaining int;
begin
  select credits_balance, free_credits_used_this_month into v_balance, v_free_used
  from public.profiles where id = p_user_id;

  v_free_remaining := greatest(0, v_free_limit - v_free_used);

  return json_build_object(
    'balance', v_balance,
    'free', v_free_remaining,
    'total', v_balance + v_free_remaining
  );
end;
$$ language plpgsql security definer;
