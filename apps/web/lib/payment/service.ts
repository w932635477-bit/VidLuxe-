/**
 * 支付服务 - 与 Supabase 交互的支付订单管理
 * 支持 JSAPI（小程序）和 Native（扫码）支付
 */
import { createClient } from '@/lib/supabase/server';
import {
  createJSAPIOrder,
  createNativeOrder,
  queryOrder as queryWechatOrder,
  generateOutTradeNo,
  type JSAPIOrderResult,
  type NativeOrderResult,
} from '@/lib/wechat-pay';

// ============================================
// 类型定义
// ============================================

export type PayType = 'jsapi' | 'native';

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number; // 分
  originalPrice?: number;
  popular?: boolean;
}

export interface PaymentOrder {
  id: string;
  out_trade_no: string;
  user_id: string;
  package_id: string;
  amount: number;
  credits: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'expired';
  code_url: string | null;
  transaction_id: string | null;
  paid_at: string | null;
  created_at: string;
  pay_type?: PayType;
}

// ============================================
// 积分包配置
// ============================================

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'small',
    name: '尝鲜包',
    credits: 10,
    price: 2900, // 29 元
  },
  {
    id: 'medium',
    name: '标准包',
    credits: 30,
    price: 7900, // 79 元
    originalPrice: 8700,
    popular: true,
  },
  {
    id: 'large',
    name: '超值包',
    credits: 100,
    price: 19900, // 199 元
    originalPrice: 29000,
  },
  {
    id: 'xlarge',
    name: '专业包',
    credits: 300,
    price: 49900, // 499 元
    originalPrice: 87000,
  },
];

export function getPackageById(packageId: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find(p => p.id === packageId);
}

// ============================================
// 订单管理
// ============================================

export interface CreatePaymentOrderParams {
  userId: string;
  packageId: string;
  payType?: PayType; // 默认 native
  openid?: string; // JSAPI 支付需要 openid
}

export interface CreatePaymentOrderResult {
  order?: PaymentOrder;
  codeUrl?: string; // Native 支付的二维码链接
  miniProgramPayParams?: JSAPIOrderResult['miniProgramPayParams']; // 小程序支付参数
  error?: string;
}

/**
 * 创建支付订单
 */
export async function createPaymentOrder(params: CreatePaymentOrderParams): Promise<CreatePaymentOrderResult> {
  const { userId, packageId, payType = 'native', openid } = params;

  const pkg = getPackageById(packageId);
  if (!pkg) {
    return { error: '套餐不存在' };
  }

  if (pkg.price === 0) {
    return { error: '免费套餐无需购买' };
  }

  // JSAPI 支付需要 openid
  if (payType === 'jsapi' && !openid) {
    return { error: 'JSAPI 支付需要用户 openid' };
  }

  try {
    const supabase = await createClient();

    // 生成订单号
    const outTradeNo = generateOutTradeNo();

    // 调用微信支付创建订单
    let orderResult: JSAPIOrderResult | NativeOrderResult;
    let codeUrl: string | undefined;
    let miniProgramPayParams: JSAPIOrderResult['miniProgramPayParams'] | undefined;

    if (payType === 'jsapi') {
      // 小程序支付
      orderResult = await createJSAPIOrder({
        outTradeNo,
        totalFee: pkg.price,
        body: `VidLuxe - ${pkg.name} (${pkg.credits}次)`,
        openid: openid!,
      });

      if (orderResult.error) {
        return { error: orderResult.error };
      }

      miniProgramPayParams = orderResult.miniProgramPayParams;
    } else {
      // Native 扫码支付
      orderResult = await createNativeOrder({
        outTradeNo,
        totalFee: pkg.price,
        body: `VidLuxe - ${pkg.name} (${pkg.credits}次)`,
        productId: pkg.id,
      });

      if (orderResult.error) {
        return { error: orderResult.error };
      }

      codeUrl = orderResult.codeUrl;
    }

    // 计算过期时间（2小时后）
    const expiredAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    // 保存订单到数据库
    const { data: order, error: dbError } = await supabase
      .from('payment_orders')
      .insert({
        out_trade_no: outTradeNo,
        user_id: userId,
        package_id: packageId,
        amount: pkg.price,
        credits: pkg.credits,
        status: 'pending',
        code_url: codeUrl || null,
        pay_type: payType,
        expired_at: expiredAt,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to save order:', dbError);
      return { error: '创建订单失败' };
    }

    return {
      order: order as PaymentOrder,
      codeUrl,
      miniProgramPayParams,
    };
  } catch (error) {
    console.error('Create payment order error:', error);
    return { error: '服务器错误' };
  }
}

/**
 * 查询订单状态
 */
export async function queryPaymentOrder(outTradeNo: string): Promise<{
  order?: PaymentOrder;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data: order, error } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('out_trade_no', outTradeNo)
      .single();

    if (error || !order) {
      return { error: '订单不存在' };
    }

    // 如果订单是 pending 状态，查询微信支付状态
    if (order.status === 'pending') {
      const wechatResult = await queryWechatOrder(outTradeNo);

      if (wechatResult.tradeState === 'SUCCESS' && order.status !== 'paid') {
        // 更新订单状态（幂等操作）
        await markOrderAsPaid(outTradeNo, wechatResult.transactionId || null);
        order.status = 'paid';
        order.transaction_id = wechatResult.transactionId || null;
        order.paid_at = new Date().toISOString();
      }
    }

    return { order: order as PaymentOrder };
  } catch (error) {
    console.error('Query payment order error:', error);
    return { error: '服务器错误' };
  }
}

/**
 * 标记订单为已支付
 */
export async function markOrderAsPaid(
  outTradeNo: string,
  transactionId: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // 获取订单信息
    const { data: order, error: orderError } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('out_trade_no', outTradeNo)
      .single();

    if (orderError || !order) {
      return { success: false, error: '订单不存在' };
    }

    // 检查订单状态（幂等）
    if (order.status === 'paid') {
      return { success: true }; // 已处理过
    }

    if (order.status !== 'pending') {
      return { success: false, error: '订单状态异常' };
    }

    // 更新订单状态
    const { error: updateError } = await supabase
      .from('payment_orders')
      .update({
        status: 'paid',
        transaction_id: transactionId,
        paid_at: new Date().toISOString(),
      })
      .eq('out_trade_no', outTradeNo);

    if (updateError) {
      console.error('Failed to update order:', updateError);
      return { success: false, error: '更新订单失败' };
    }

    // 发放积分
    const { error: creditError } = await addCredits(
      order.user_id,
      order.credits,
      'purchase',
      `购买${getPackageById(order.package_id)?.name || '积分包'}`,
      order.id
    );

    if (creditError) {
      console.error('Failed to add credits:', creditError);
      // 订单已支付但积分发放失败，需要人工处理
      return { success: false, error: '积分发放失败，请联系客服' };
    }

    // 记录交易
    await supabase.from('payment_transactions').insert({
      order_id: order.id,
      out_trade_no: outTradeNo,
      transaction_id: transactionId,
      amount: order.amount,
      status: 'success',
    });

    return { success: true };
  } catch (error) {
    console.error('Mark order paid error:', error);
    return { success: false, error: '服务器错误' };
  }
}

/**
 * 添加积分
 */
export async function addCredits(
  userId: string,
  amount: number,
  type: string,
  description: string,
  orderId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // 获取或创建用户积分记录
    let { data: userCredit, error: fetchError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      // 用户不存在，创建新记录
      const { data: newCredit, error: createError } = await supabase
        .from('user_credits')
        .insert({
          user_id: userId,
          balance: 0,
          total_earned: 0,
          total_spent: 0,
        })
        .select()
        .single();

      if (createError) {
        return { success: false, error: '创建用户积分记录失败' };
      }
      userCredit = newCredit;
    } else if (fetchError) {
      return { success: false, error: '获取用户积分失败' };
    }

    // 更新积分余额
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({
        balance: (userCredit.balance || 0) + amount,
        total_earned: (userCredit.total_earned || 0) + amount,
      })
      .eq('user_id', userId);

    if (updateError) {
      return { success: false, error: '更新积分失败' };
    }

    // 记录交易
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount: amount,
      type: type,
      description: description,
      order_id: orderId || null,
    });

    return { success: true };
  } catch (error) {
    console.error('Add credits error:', error);
    return { success: false, error: '服务器错误' };
  }
}

/**
 * 获取用户订单列表
 */
export async function getUserOrders(userId: string): Promise<{
  orders?: PaymentOrder[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data: orders, error } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return { error: '获取订单失败' };
    }

    return { orders: orders as PaymentOrder[] };
  } catch (error) {
    console.error('Get user orders error:', error);
    return { error: '服务器错误' };
  }
}
