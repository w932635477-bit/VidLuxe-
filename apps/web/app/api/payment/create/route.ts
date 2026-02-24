/**
 * 支付订单创建 API
 * POST /api/payment/create
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createH5Order, generateOutTradeNo, isWechatPayConfigured } from '@/lib/wechat-pay';
import { CREDIT_PACKAGES } from '@/lib/credits';

export async function POST(request: NextRequest) {
  try {
    // 验证用户登录
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    // 解析请求
    const { packageId } = await request.json();

    if (!packageId) {
      return NextResponse.json({ error: '请选择套餐' }, { status: 400 });
    }

    // 查找套餐
    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!pkg) {
      return NextResponse.json({ error: '套餐不存在' }, { status: 400 });
    }

    if (pkg.price === 0) {
      return NextResponse.json({ error: '免费套餐无需购买' }, { status: 400 });
    }

    // 检查微信支付配置
    if (!isWechatPayConfigured()) {
      return NextResponse.json({
        error: '支付功能暂未开放，请联系客服',
        code: 'PAYMENT_NOT_CONFIGURED'
      }, { status: 503 });
    }

    // 生成订单号
    const outTradeNo = generateOutTradeNo();

    // 创建微信支付订单
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     request.headers.get('x-real-ip') ||
                     '127.0.0.1';

    const orderResult = await createH5Order({
      outTradeNo,
      totalFee: pkg.price,
      body: `VidLuxe - ${pkg.name} (${pkg.credits}额度)`,
      clientIp,
    });

    if (orderResult.error) {
      return NextResponse.json({ error: orderResult.error }, { status: 500 });
    }

    // 保存订单到数据库（使用现有的 credits 系统）
    // 注意：这里暂时使用本地存储，等 Supabase 数据库表创建后再迁移
    // TODO: 迁移到 Supabase 后启用以下代码
    /*
    const { error: dbError } = await supabase.from('payment_orders').insert({
      user_id: user.id,
      package_id: packageId,
      amount: pkg.price,
      credits: pkg.credits,
      wechat_out_trade_no: outTradeNo,
      status: 'pending',
    });

    if (dbError) {
      console.error('Failed to save order:', dbError);
      return NextResponse.json({ error: '创建订单失败' }, { status: 500 });
    }
    */

    return NextResponse.json({
      success: true,
      orderId: outTradeNo,
      prepayId: orderResult.prepayId,
      // H5 支付跳转 URL（实际环境中需要从统一下单接口获取）
      mwebUrl: `https://vidluxe.com/payment/pending?orderId=${outTradeNo}`,
      package: pkg,
    });
  } catch (error) {
    console.error('Payment create error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
